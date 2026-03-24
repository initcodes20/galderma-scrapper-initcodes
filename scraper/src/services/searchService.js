import { BrowserService } from './browserService.js';
import { AmazonHandler } from '../handlers/amazonHandler.js';
import { FlipkartHandler } from '../handlers/flipkartHandler.js';
import { NykaaHandler } from '../handlers/nykaaHandler.js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import stringSimilarity from 'string-similarity';

export class SearchService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.browserService = new BrowserService();
    this.initialized = false;
  }

  async initBrowser() {
    if (!this.initialized) {
      await this.browserService.init({ headless: false }); // Running non-headless to bypass basic bot detections
      this.initialized = true;
    }
  }

  async search(query) {
    if (!query) throw new Error("Query is required");

    // 1. Check Database first
    try {
       const { data: existingProducts, error: dbError } = await this.supabase
         .from('products')
         .select('id, name')
         .ilike('name', `%${query}%`)
         .limit(1);

       if (!dbError && existingProducts && existingProducts.length > 0) {
           const product = existingProducts[0];
           logger.info(`Found "${product.name}" in database. Fetching latest prices.`);
           
           // Fetch sources and latest prices
           const { data: sources } = await this.supabase
              .from('product_sources')
              .select('id, platform, product_url')
              .eq('product_id', product.id);

           if (sources && sources.length > 0) {
              const results = {
                 amazon: { status: 'error', price: null },
                 flipkart: { status: 'error', price: null },
                 nykaa: { status: 'error', price: null }
              };
              let bestPrice = Infinity;

              await this.initBrowser();
              logger.info(`Found "${product.name}" in database. Scraping fresh prices from known URLs.`);

              // Scrape live from known URLs
              await Promise.all(sources.map(async (source) => {
                 const platform = source.platform.toLowerCase();
                 try {
                     const page = await this.browserService.createPage();
                     let handler;
                     if (platform === 'amazon') handler = new AmazonHandler(page);
                     if (platform === 'flipkart') handler = new FlipkartHandler(page);
                     if (platform === 'nykaa') handler = new NykaaHandler(page);
                     
                     if (handler) {
                         const scraped = await handler.scrape(source.product_url);
                         if (scraped && scraped.price) {
                             results[platform] = { status: 'ok', price: scraped.price, url: source.product_url };
                             if (scraped.price < bestPrice) bestPrice = scraped.price;
                             
                             // Save new price history
                             await this.supabase.from('price_history').insert({
                                 product_id: product.id,
                                 source_id: source.id,
                                 platform: platform,
                                 price: scraped.price
                             });
                         }
                     }
                     await page.close().catch(() => {});
                 } catch (err) {
                     logger.error(`Error fresh scraping ${platform}`, err);
                 }
              }));

              return {
                 product: product.name,
                 results,
                 best_price: bestPrice === Infinity ? null : bestPrice,
                 cached: false,
                 refreshed: true
              };
           }
       }
    } catch (e) {
       logger.error('Database lookup/refresh error:', e);
    }

    // 2. Perform live search if not in DB
    await this.initBrowser();
    
    logger.info(`Starting live multi-platform search for: ${query}`);

    // Run searches in parallel
    const [amazonResult, flipkartResult, nykaaResult] = await Promise.allSettled([
      this.searchPlatform('amazon', query),
      this.searchPlatform('flipkart', query),
      this.searchPlatform('nykaa', query)
    ]);

    const results = {
      amazon: amazonResult.status === 'fulfilled' ? amazonResult.value : { status: 'error', price: null },
      flipkart: flipkartResult.status === 'fulfilled' ? flipkartResult.value : { status: 'error', price: null },
      nykaa: nykaaResult.status === 'fulfilled' ? nykaaResult.value : { status: 'error', price: null }
    };

    // calculate best price
    let bestPrice = Infinity;
    for (const res of Object.values(results)) {
      if (res && res.price && res.price < bestPrice) {
        bestPrice = res.price;
      }
    }

    return {
      product: query,
      results,
      best_price: bestPrice === Infinity ? null : bestPrice
    };
  }

  async searchPlatform(platform, query) {
    let page;
    try {
      page = await this.browserService.createPage();
      let handler;
      
      if (platform === 'amazon') handler = new AmazonHandler(page);
      if (platform === 'flipkart') handler = new FlipkartHandler(page);
      if (platform === 'nykaa') handler = new NykaaHandler(page);

      if (!handler) throw new Error("Invalid platform");

      logger.info(`Searching ${platform} for ${query}...`);
      const result = await handler.searchProduct(query);
      
      return result; // expected { price: 123, url: "...", status: "ok" }
      
    } catch (error) {
      logger.error(`Error searching ${platform}: ${error.message}`);
      return { status: 'error', price: null, url: null, error: error.message };
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
}
