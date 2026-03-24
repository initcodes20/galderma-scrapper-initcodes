import { BaseScraper } from "../services/baseScraper.js";
import { logger } from "../utils/logger.js";
import { PriceUtils } from "../utils/priceUtils.js";
import stringSimilarity from "string-similarity";

export class AmazonHandler extends BaseScraper {
  async searchProduct(query) {
    try {
      const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
      await this.navigateWithRetry(searchUrl, { waitUntil: 'domcontentloaded' });

      // Wait for search results
      const resultsLoaded = await this.waitForSelectorSafe('[data-component-type="s-search-result"]', 10000);
      if (!resultsLoaded) {
        logger.warn(`Amazon: No search results loaded for "${query}".`);
        return { status: 'error', price: null, url: null, error: 'No results' };
      }

      // Extract top 5 results
      const items = await this.page.$$eval('[data-component-type="s-search-result"]', (elements) => {
        return elements.slice(0, 5).map(el => {
          const titleEl = el.querySelector('h2');
          const linkEl = el.querySelector('h2 a') || el.querySelector('.a-link-normal') || el.querySelector('a');
          const imgEl = el.querySelector('img.s-image') || el.querySelector('img');
          
          let priceText = null;
          const priceEl = el.querySelector('.a-price-whole') || el.querySelector('.a-price .a-offscreen');
          if (priceEl) {
              priceText = priceEl.innerText.trim();
          } else {
              const text = el.innerText;
              const match = text.match(/₹\s*([0-9,]+)/) || text.match(/Rs\.?\s*([0-9,]+)/i);
              if (match) priceText = match[1];
          }

          // Extract generic title
          let finalTitle = '';
          if (titleEl) {
             finalTitle = titleEl.innerText.trim();
             // Clean up extra newlines if h2 has multiple spans
             if (finalTitle.includes('\n')) finalTitle = finalTitle.split('\n').join(' ');
          }

          return {
            title: finalTitle,
            url: linkEl ? linkEl.href : '',
            priceText: priceText,
            image_url: imgEl ? imgEl.src : null
          };
        }).filter(item => item.title && item.url && item.priceText);
      });

      if (items.length === 0) {
        return { status: 'error', price: null, url: null, error: 'No items parsed' };
      }

      // Trust the platform's search engine. Pick the first result that contains the primary brand/keyword, or just the first result.
      const mainKeyword = query.toLowerCase().split(' ')[0];
      let bestMatch = items.find(item => item.title.toLowerCase().includes(mainKeyword)) || items[0];

      logger.info(`Amazon: Fast Extract best match for "${query}" is "${bestMatch.title}"`);
      
      const cleanPrice = PriceUtils.clean(bestMatch.priceText);
      return { 
        status: 'ok', 
        price: cleanPrice, 
        url: bestMatch.url, 
        name: bestMatch.title, 
        image_url: bestMatch.image_url,
        platform: 'amazon'
      };

    } catch (err) {
      logger.error(`Amazon search error for "${query}"`, err);
      return { status: 'error', price: null, url: null, error: err.message };
    }
  }

  async scrape(url) {
    try {
      await this.navigateWithRetry(url, { waitUntil: 'domcontentloaded' });
      
      // Wait for a common product element to ensure page has loaded
      const isLoaded = await this.waitForSelectorSafe('#productTitle', 15000);
      if (!isLoaded) {
          const title = await this.page.title();
          if (title.includes('Robot') || title.includes('CAPTCHA')) {
              logger.warn("Amazon: Blocked by bot detection (Robot/CAPTCHA).");
              return null;
          }
          logger.warn(`Amazon: Timeout or selector not found. Title: "${title}"`);
          return null;
      }

      const priceSelectors = [
        ".a-price .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        ".a-price-whole"
      ];

      let priceText = null;
      for (const sel of priceSelectors) {
        const found = await this.waitForSelectorSafe(sel, 5000);
        if (found) {
            priceText = await this.page.$eval(sel, el => el.innerText || el.textContent);
            if (priceText) break;
        }
      }

      if (!priceText) {
          logger.warn("Amazon: No price found on page.");
          return null;
      }

      const details = await this.page.evaluate(() => {
        const nameEl = document.querySelector("#productTitle");
        const name = nameEl ? nameEl.innerText.trim() : null;
        
        // Improved image selection for Amazon
        const imgEl = document.querySelector("#landingImage") || 
                      document.querySelector("#imgBlkFront") || 
                      document.querySelector("#main-image-container img");
        const image_url = imgEl ? imgEl.src : null;
        
        const rateEl = document.querySelector(".a-icon-alt");
        let rating = null;
        if (rateEl) {
          const match = rateEl.innerText.match(/[\d.]+/);
          if (match) rating = parseFloat(match[0]);
        }
        return { name, image_url, rating };
      });

      const price = PriceUtils.clean(priceText);
      return { ...details, price, platform: 'amazon' };

    } catch (err) {
      logger.error("Amazon Scraping Error", err);
      return null;
    }
  }
}
