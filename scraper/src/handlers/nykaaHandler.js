import { BaseScraper } from "../services/baseScraper.js";
import { logger } from "../utils/logger.js";
import { PriceUtils } from "../utils/priceUtils.js";

export class NykaaHandler extends BaseScraper {
  async scrape(url) {
    try {
      await this.navigateWithRetry(url, { waitUntil: 'domcontentloaded' });
      
      const priceSelectors = [".css-111z9ua", "[data-testid='price']", ".css-12s389n"];
      let priceText = null;

      for (const sel of priceSelectors) {
        const found = await this.waitForSelectorSafe(sel, 10000);
        if (found) {
          priceText = await this.page.$eval(sel, el => el.innerText || el.textContent);
          if (priceText) break;
        }
      }

      if (!priceText) {
          logger.warn(`Nykaa: No price found. Title: "${await this.page.title()}"`);
          return null;
      }

      const details = await this.page.evaluate(() => {
        const nameEl = document.querySelector("h1.css-1gc4x7i, h1[class*='product-title']");
        const name = nameEl ? nameEl.innerText.trim() : null;
        const imgEl = document.querySelector(".css-1by5ab9 img, [class*='product-image'] img, img[src*='nykaa']");
        const image_url = imgEl ? imgEl.src : null;
        const rateEl = document.querySelector(".css-12ola6c, [class*='rating']");
        let rating = null;
        if (rateEl) {
            const match = rateEl.innerText.match(/[\d.]+/);
            if (match) rating = parseFloat(match[0]);
        }
        return { name, image_url, rating };
      });

      const price = PriceUtils.clean(priceText);
      return { ...details, price, platform: 'nykaa' };

    } catch (err) {
      logger.error("Nykaa Scraping Error", err);
      return null;
    }
  }
}
