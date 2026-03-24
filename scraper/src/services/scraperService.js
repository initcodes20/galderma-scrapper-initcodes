import { createClient } from "@supabase/supabase-js";
import { BrowserService } from "./browserService.js";
import { AmazonHandler } from "../handlers/amazonHandler.js";
import { FlipkartHandler } from "../handlers/flipkartHandler.js";
import { NykaaHandler } from "../handlers/nykaaHandler.js";
import { logger } from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

export class ScraperService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.browserService = new BrowserService();
  }

  async run() {
    logger.info("Scraper service started.");
    
    const { data: sources, error } = await this.supabase
      .from("product_sources")
      .select("*");

    if (error || !sources?.length) {
      logger.warn("No product sources found.");
      return;
    }

    try {
      await this.browserService.init();
      
      for (const source of sources) {
        const page = await this.browserService.createPage();
        const platform = source.platform.toLowerCase();
        
        try {
          logger.info(`Processing ${platform.toUpperCase()}: ${source.product_url}`);
          
          let handler;
          if (platform === "amazon") handler = new AmazonHandler(page);
          else if (platform === "flipkart") handler = new FlipkartHandler(page);
          else if (platform === "nykaa") handler = new NykaaHandler(page);
          
          if (!handler) {
            logger.warn(`No handler for platform: ${platform}`);
            continue;
          }

          const details = await handler.scrape(source.product_url);
          
          if (details && details.price !== null) {
            await this.updateDatabase(source, details);
          } else {
            logger.warn(`Failed to scrape price for ${platform}. Keeping last known data.`);
          }
          
          // Randomized delay between products
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
          
        } catch (err) {
          logger.error(`Error processing ${source.product_url}`, err);
        } finally {
          await page.close().catch(() => {});
        }
      }
    } catch (err) {
      logger.error("Fatal error in ScraperService", err);
    } finally {
      await this.browserService.close();
      logger.info("Scraper service finished.");
    }
  }

  async updateDatabase(source, details) {
    try {
      // 1. Update product metadata if missing or broken (e.g. relative path)
      const { data: product } = await this.supabase
        .from("products")
        .select("name, image_url")
        .eq("id", source.product_id)
        .maybeSingle();

      const updates = {};
      if (!product?.name && details.name) updates.name = details.name;
      
      // Update image if it's missing OR if it's a relative path (doesn't start with http)
      const isImageBroken = product?.image_url && !product.image_url.startsWith("http");
      if ((!product?.image_url || isImageBroken) && details.image_url && details.image_url.startsWith("http")) {
        updates.image_url = details.image_url;
      }

      if (Object.keys(updates).length > 0) {
        await this.supabase.from("products").update(updates).eq("id", source.product_id);
        logger.info(`Updated product info in DB for ${product?.name || 'product'}.`);
      }

      // 2. Save price history if changed
      const { data: lastRow } = await this.supabase
        .from("price_history")
        .select("price")
        .eq("source_id", source.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRow && Number(lastRow.price) === details.price) {
        logger.info("Price unchanged. Skipping insert.");
        return;
      }

      const { error } = await this.supabase.from("price_history").insert({
        product_id: source.product_id,
        source_id: source.id,
        platform: details.platform,
        price: details.price,
      });

      if (!error) logger.info(`Saved price ₹${details.price} for ${details.platform}`);
      else logger.error("Failed to save price", error);

    } catch (err) {
      logger.error("Database update error", err);
    }
  }
}
