import { BaseScraper } from "../services/baseScraper.js";
import { logger } from "../utils/logger.js";
import { PriceUtils } from "../utils/priceUtils.js";
import { pickBestMatch } from "../utils/quantityUtils.js";

export class NykaaHandler extends BaseScraper {
  async searchProduct(query) {
    try {
      const searchUrl = `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}`;
      await this.navigateWithRetry(searchUrl, { waitUntil: 'domcontentloaded' });

      // Wait for product cards to appear
      const resultsLoaded = await this.waitForSelectorSafe(
        'a.css-qlopj4, #product-list-wrap, .css-1d5sdbf',
        12000
      );
      if (!resultsLoaded) {
        logger.warn(`Nykaa: No search results loaded for "${query}".`);
        return { status: 'error', price: null, url: null, error: 'No results' };
      }

      // Short settle wait for lazy-rendered prices
      await this.page.waitForTimeout(1500).catch(() => {});

      // --- PRIMARY: a.css-qlopj4 card layout ---
      let items = await this.page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a.css-qlopj4'));

        return cards.slice(0, 8).map(card => {

          // ── TITLE ──────────────────────────────────────────────────
          // Collect leaf text nodes, skip price-only, number-only, and discount-label strings
          const leafEls = Array.from(card.querySelectorAll('div, span, p'))
            .filter(el => {
              const text = el.innerText.trim();
              return el.children.length === 0 &&
              text.length > 3 &&
              !/^₹/.test(text) &&        // skip price-only
              !/^\d+(\.\d+)?$/.test(text) && // skip pure-number
              !/% Off/i.test(text) &&    // skip discount labels like "13% Off"
              !/Regular price/i.test(text); // skip "Regular price" labels
            });

          // First meaningful text node after filtering should be the product name
          const title = leafEls.length > 0 ? leafEls[0].innerText.trim() : card.innerText.split('\n')[0];

          // ── PRICE: selling price (NOT the struck-through MRP) ───────
          const allPriceEls = Array.from(card.querySelectorAll('span, div, p'))
            .filter(el =>
              el.children.length === 0 &&
              /₹\s*[\d,]+/.test(el.innerText)
            );

          // Find specific "discounted" or "selling" price if labeled
          const discountedPriceEl = Array.from(card.querySelectorAll('span, div, p'))
            .find(el => /Discounted price/i.test(el.innerText) || /Selling Price/i.test(el.innerText));

          let priceText = null;
          if (discountedPriceEl) {
             const match = discountedPriceEl.innerText.match(/₹\s*([\d,]+)/);
             if (match) priceText = match[0];
          }

          if (!priceText) {
              // Walk up DOM tree to detect strikethrough formatting
              const isStrikethrough = (el) => {
                let cur = el;
                while (cur && cur !== card) {
                  if (cur.tagName === 'DEL' || cur.tagName === 'S') return true;
                  const cls = (cur.className || '').toLowerCase();
                  if (
                    cls.includes('line-through') ||
                    cls.includes('mrp') ||
                    cls.includes('strike') ||
                    cls.includes('original-price')
                  ) return true;
                  cur = cur.parentElement;
                }
                return false;
              };

              let sellingPriceEl = allPriceEls.find(el => !isStrikethrough(el));

              if (!sellingPriceEl && allPriceEls.length > 0) {
                const parsed = allPriceEls.map(el => {
                  const m = el.innerText.match(/₹\s*([\d,]+)/);
                  return m ? { el, val: parseInt(m[1].replace(/,/g, ''), 10) } : null;
                }).filter(Boolean);
                if (parsed.length > 0) {
                  sellingPriceEl = parsed.reduce((a, b) => b.val < a.val ? b : a).el;
                }
              }
              priceText = sellingPriceEl ? sellingPriceEl.innerText.trim() : null;
          }
          const imgEl = card.querySelector('img');

          return {
            title,
            url: card.href || '',
            priceText,
            image_url: imgEl ? imgEl.src : null
          };
        }).filter(item => item.title && item.url && item.priceText);
      });

      // --- FALLBACK: older card selectors ---
      if (items.length === 0) {
        items = await this.page.$$eval(
          '.css-d5z3ro, .product-list-card, .productWrapper',
          (elements) => {
            return elements.slice(0, 8).map(el => {
              const linkEl = el.querySelector('a') || (el.tagName === 'A' ? el : null);
              const titleEl = el.querySelector('.css-xrzmfa, .product-title') || linkEl;
              const priceEl =
                el.querySelector('.css-111z9ua, [data-testid="price"]') ||
                el.querySelector('.css-1d0jf8e');
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
          }
        );
      }

      if (items.length === 0) {
        return { status: 'error', price: null, url: null, error: 'No items parsed' };
      }

      // Log all candidates for debugging
      logger.info(`Nykaa: Found ${items.length} candidates for "${query}":`);
      items.forEach((it, i) => logger.info(`  [${i}] "${it.title}" — ${it.priceText}`));

      // Quantity-aware best match: prefer exact quantity, fallback gracefully
      const { item: bestMatch, quantityMismatch, requestedQty, foundQty } = pickBestMatch(items, query);

      logger.info(`Nykaa: Picked → "${bestMatch.title}"${ quantityMismatch ? ` [qty mismatch: wanted ${requestedQty}, got ${foundQty || 'unknown'}]` : '' }`);

      const cleanPrice = PriceUtils.clean(bestMatch.priceText);
      return {
        status: 'ok',
        price: cleanPrice,
        url: bestMatch.url,
        name: bestMatch.title,
        image_url: bestMatch.image_url,
        platform: 'nykaa',
        quantity_mismatch: quantityMismatch,
        requested_qty: requestedQty,
        found_qty: foundQty
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
