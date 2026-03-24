import { BaseScraper } from "../services/baseScraper.js";
import { logger } from "../utils/logger.js";
import { PriceUtils } from "../utils/priceUtils.js";
import stringSimilarity from "string-similarity";

export class FlipkartHandler extends BaseScraper {
  async searchProduct(query) {
    try {
      const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
      await this.navigateWithRetry(searchUrl, { waitUntil: 'domcontentloaded' });

      // Close login popup if present
      try {
        const closeBtn = await this.page.$("button._2KpZ6l._2doB4z");
        if (closeBtn) await closeBtn.click();
      } catch (e) {}

      // Wait for search results
      const resultsLoaded = await this.waitForSelectorSafe('[data-id]', 10000);
      if (!resultsLoaded) {
        logger.warn(`Flipkart: No search results loaded for "${query}".`);
        return { status: 'error', price: null, url: null, error: 'No results' };
      }

      // Extract top 5 results
      const items = await this.page.$$eval('[data-id]', (elements) => {
        return elements.slice(0, 5).map(el => {
          const allLinks = Array.from(el.querySelectorAll('a'));
          const linkEl = allLinks.find(a => a.href && a.href.includes('/p/')) || allLinks[0];
          
          // Try known title classes first, then fallback to longest text link
          let titleEl = el.querySelector('div._4rR01T, a.s1Q9rs, a.IRpwTa, .name, .slAVV4, .wjcEIp');
          if (!titleEl && allLinks.length > 0) {
              titleEl = allLinks.reduce((longest, current) => current.innerText.length > longest.innerText.length ? current : longest, allLinks[0]);
          }
          
          const imgEl = el.querySelector('img._396cs4, img.CXW8mj, img');
          
          let priceText = null;
          let priceEl = el.querySelector('div._30jeq3') || el.querySelector('div.Nx9zRn') || el.querySelector('.price');
          if (priceEl) {
              priceText = priceEl.innerText.trim();
          } else {
              const text = el.innerText;
              const match = text.match(/₹\s*([0-9,]+)/) || text.match(/Rs\.?\s*([0-9,]+)/i);
              if (match) priceText = match[1];
          }

          let finalTitle = titleEl && titleEl.title ? titleEl.title : (titleEl ? titleEl.innerText.trim() : '');
          if (finalTitle.includes('\n')) finalTitle = finalTitle.split('\n')[0];

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

      logger.info(`Flipkart: Fast Extract best match for "${query}" is "${bestMatch.title}"`);
      
      const cleanPrice = PriceUtils.clean(bestMatch.priceText);
      return { 
        status: 'ok', 
        price: cleanPrice, 
        url: bestMatch.url, 
        name: bestMatch.title, 
        image_url: bestMatch.image_url,
        platform: 'flipkart'
      };

    } catch (err) {
      logger.error(`Flipkart search error for "${query}"`, err);
      return { status: 'error', price: null, url: null, error: err.message };
    }
  }

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
