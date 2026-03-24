import { BaseScraper } from "../services/baseScraper.js";
import { logger } from "../utils/logger.js";
import { PriceUtils } from "../utils/priceUtils.js";

export class FlipkartHandler extends BaseScraper {
  async scrape(url) {
    try {
      await this.navigateWithRetry(url, { waitUntil: 'load' });
      
      // Close initial login popup if present
      try {
        const closeBtn = await this.page.$("button._2KpZ6l._2doB4z");
        if (closeBtn) await closeBtn.click();
      } catch (e) {}

      const priceSelectors = ["._30jeq3", "._30jeq3._16Jk6d", ".Nx9zRn"];
      let priceText = null;

      for (const sel of priceSelectors) {
        const found = await this.waitForSelectorSafe(sel, 8000);
        if (found) {
          priceText = await this.page.$eval(sel, el => el.innerText || el.textContent);
          if (priceText) break;
        }
      }

      if (!priceText) {
          const title = await this.page.title();
          logger.warn(`Flipkart: No price found. Title: "${title}"`);
          return null;
      }

      const details = await this.page.evaluate(() => {
        const nameEl = document.querySelector(".VU-ZEz, .B_NuCI, .yhB1nd");
        const name = nameEl ? nameEl.innerText.trim() : null;
        const imgEl = document.querySelector("._396cs4, .DByuf4, .v2VpsG img, img[src*='image']");
        const image_url = imgEl ? imgEl.src : null;
        const rateEl = document.querySelector("._3LWZlK, .XQDdHH");
        let rating = null;
        if (rateEl) {
            const match = rateEl.innerText.match(/[\d.]+/);
            if (match) rating = parseFloat(match[0]);
        }
        return { name, image_url, rating };
      });

      const price = PriceUtils.clean(priceText);
      return { ...details, price, platform: 'flipkart' };

    } catch (err) {
      logger.error("Flipkart Scraping Error", err);
      return null;
    }
  }
}
