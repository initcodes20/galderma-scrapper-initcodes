import { BaseScraper } from "../services/baseScraper.js";
import { logger } from "../utils/logger.js";
import { PriceUtils } from "../utils/priceUtils.js";

export class AmazonHandler extends BaseScraper {
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
