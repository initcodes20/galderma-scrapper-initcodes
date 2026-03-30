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

      // Wait for any of the known result selectors (new or old layout)
      const resultsLoaded = await this.waitForSelectorSafe(
        'a.pIpigb, [data-id], .cPHDOP',
        10000
      );
      if (!resultsLoaded) {
        logger.warn(`Flipkart: No search results loaded for "${query}".`);
        return { status: 'error', price: null, url: null, error: 'No results' };
      }

      // --- NEW layout: sibling anchor tags per product (a.pIpigb=title, a.fb4uj3=price, a.GnxRXv=image) ---
      let items = await this.page.evaluate(() => {
        const titleLinks = Array.from(document.querySelectorAll('a.pIpigb'));
        const map = new Map();

        // Index price links by base URL (strip query params for matching)
        const priceLinks = Array.from(document.querySelectorAll('a.fb4uj3'));
        const imgLinks = Array.from(document.querySelectorAll('a.GnxRXv'));

        const baseUrl = (href) => {
          try { const u = new URL(href); return u.pathname; } catch(e) { return href; }
        };

        const priceMap = new Map();
        priceLinks.forEach(a => {
          const key = baseUrl(a.href);
          if (!priceMap.has(key)) {
            // First child div that likely contains discounted price
            const divs = Array.from(a.querySelectorAll('div'));
            const priceDiv = divs.find(d => /₹|Rs/.test(d.innerText) && d.children.length === 0);
            priceMap.set(key, priceDiv ? priceDiv.innerText.trim() : (a.innerText.match(/₹\s*[\d,]+/)?.[0] || null));
          }
        });

        const imgMap = new Map();
        imgLinks.forEach(a => {
          const key = baseUrl(a.href);
          if (!imgMap.has(key)) {
            const img = a.querySelector('img');
            imgMap.set(key, img ? img.src : null);
          }
        });

        return titleLinks.slice(0, 5).map(a => {
          const key = baseUrl(a.href);
          return {
            title: a.title || a.innerText.trim(),
            url: a.href,
            priceText: priceMap.get(key) || null,
            image_url: imgMap.get(key) || null
          };
        }).filter(item => item.title && item.url && item.priceText);
      });

      // --- FALLBACK: old layout using [data-id] cards ---
      if (items.length === 0) {
        items = await this.page.$$eval('[data-id]', (elements) => {
          return elements.slice(0, 5).map(el => {
            const allLinks = Array.from(el.querySelectorAll('a'));
            const linkEl = allLinks.find(a => a.href && a.href.includes('/p/')) || allLinks[0];
            let titleEl = el.querySelector('div._4rR01T, a.s1Q9rs, a.IRpwTa, a.pIpigb, .slAVV4, .wjcEIp');
            if (!titleEl && allLinks.length > 0) {
              titleEl = allLinks.reduce((l, c) => c.innerText.length > l.innerText.length ? c : l, allLinks[0]);
            }
            const imgEl = el.querySelector('img._396cs4, img.CXW8mj, img');
            let priceText = null;
            const priceEl = el.querySelector('div._30jeq3, div.Nx9zRn, .price');
            if (priceEl) priceText = priceEl.innerText.trim();
            else {
              const match = el.innerText.match(/₹\s*([0-9,]+)/);
              if (match) priceText = '₹' + match[1];
            }
            let finalTitle = titleEl?.title || titleEl?.innerText?.trim() || '';
            if (finalTitle.includes('\n')) finalTitle = finalTitle.split('\n')[0];
            return { title: finalTitle, url: linkEl?.href || '', priceText, image_url: imgEl?.src || null };
          }).filter(item => item.title && item.url && item.priceText);
        });
      }

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
