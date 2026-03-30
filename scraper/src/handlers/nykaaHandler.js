import { BaseScraper } from "../services/baseScraper.js";
import { logger } from "../utils/logger.js";
import { PriceUtils } from "../utils/priceUtils.js";
import stringSimilarity from "string-similarity";

export class NykaaHandler extends BaseScraper {
  async searchProduct(query) {
    try {
      const searchUrl = `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}`;
      await this.navigateWithRetry(searchUrl, { waitUntil: 'domcontentloaded' });

      // Wait for search results container
      const resultsLoaded = await this.waitForSelectorSafe(
        'a.css-qlopj4, #product-list-wrap, .css-1d5sdbf, .product-list',
        10000
      );
      if (!resultsLoaded) {
        logger.warn(`Nykaa: No search results loaded for "${query}".`);
        return { status: 'error', price: null, url: null, error: 'No results' };
      }

      // --- NEW layout: a.css-qlopj4 cards ---
      let items = await this.page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a.css-qlopj4'));
        return cards.slice(0, 5).map(card => {
          const allText = Array.from(card.querySelectorAll('div'));
          // Title is usually the first meaningful text div (skip short/empty ones)
          const titleDiv = allText.find(d => d.children.length === 0 && d.innerText.trim().length > 5);
          // Price is a span or div containing ₹
          const priceEl = Array.from(card.querySelectorAll('span, div')).find(el =>
            el.children.length === 0 && /₹/.test(el.innerText)
          );
          const imgEl = card.querySelector('img');
          return {
            title: titleDiv ? titleDiv.innerText.trim() : '',
            url: card.href || '',
            priceText: priceEl ? priceEl.innerText.trim() : null,
            image_url: imgEl ? imgEl.src : null
          };
        }).filter(item => item.title && item.url && item.priceText);
      });

      // --- FALLBACK: old selectors ---
      if (items.length === 0) {
        items = await this.page.$$eval('.css-d5z3ro, .product-list-card, .productWrapper, .css-xrzmfa', (elements) => {
          return elements.slice(0, 5).map(el => {
            const linkEl = el.querySelector('a') || (el.tagName === 'A' ? el : null);
            const titleEl = el.querySelector('.css-xrzmfa, .product-title') || linkEl;
            const priceEl = el.querySelector('.css-111z9ua, .price, [data-testid="price"]') || el.querySelector('.css-1d0jf8e');
            const imgEl = el.querySelector('img');
            let titleText = titleEl ? titleEl.innerText.trim() : '';
            if (titleText.includes('\n')) titleText = titleText.split('\n')[0];
            return {
              title: titleText,
              url: linkEl ? linkEl.href : '',
              priceText: priceEl ? priceEl.innerText.trim() : null,
              image_url: imgEl ? imgEl.src : null
            };
          }).filter(item => item.title && item.url && item.priceText);
        });
      }

      if (items.length === 0) {
        return { status: 'error', price: null, url: null, error: 'No items parsed' };
      }

      // Trust the platform's search engine. Pick the first result that contains the primary brand/keyword, or just the first result.
      const mainKeyword = query.toLowerCase().split(' ')[0];
      let bestMatch = items.find(item => item.title.toLowerCase().includes(mainKeyword)) || items[0];

      logger.info(`Nykaa: Fast Extract best match for "${query}" is "${bestMatch.title}"`);
      
      const cleanPrice = PriceUtils.clean(bestMatch.priceText);
      return { 
        status: 'ok', 
        price: cleanPrice, 
        url: bestMatch.url, 
        name: bestMatch.title, 
        image_url: bestMatch.image_url,
        platform: 'nykaa'
      };

    } catch (err) {
      logger.error(`Nykaa search error for "${query}"`, err);
      return { status: 'error', price: null, url: null, error: err.message };
    }
  }

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
