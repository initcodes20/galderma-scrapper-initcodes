import { CONFIG } from "../config/config.js";
import { logger } from "../utils/logger.js";

export class BaseScraper {
  constructor(page) {
    this.page = page;
  }

  async delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async randomDelay() {
    const ms = Math.floor(
      Math.random() * (CONFIG.HUMAN_BEHAVIOR.MAX_DELAY - CONFIG.HUMAN_BEHAVIOR.MIN_DELAY) +
      CONFIG.HUMAN_BEHAVIOR.MIN_DELAY
    );
    await this.delay(ms);
  }

  async simulateHumanBehavior() {
    if (Math.random() < CONFIG.HUMAN_BEHAVIOR.SCROLL_PROBABILITY) {
      logger.debug("Simulating scroll...");
      const scrollY = Math.floor(Math.random() * 500) + 100;
      await this.page.mouse.wheel(0, scrollY);
      await this.randomDelay();
    }
  }

  async navigateWithRetry(url, options = {}) {
    let lastError = null;
    const maxRetries = options.maxRetries || CONFIG.RETRY.MAX_RETRIES;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.info(`Navigating to ${url} (Attempt ${i + 1}/${maxRetries})`);
        await this.page.goto(url, {
          waitUntil: options.waitUntil || "domcontentloaded",
          timeout: options.timeout || CONFIG.BROWSER.TIMEOUT,
        });
        
        await this.randomDelay();
        await this.simulateHumanBehavior();
        
        return true;
      } catch (err) {
        lastError = err;
        logger.warn(`Navigation failed (Attempt ${i + 1}): ${err.message}`);
        const delayMs = Math.min(
            CONFIG.RETRY.INITIAL_DELAY * Math.pow(2, i),
            CONFIG.RETRY.MAX_DELAY
        );
        await this.delay(delayMs);
      }
    }
    
    throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts. Last error: ${lastError.message}`);
  }

  async waitForSelectorSafe(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { state: 'attached', timeout });
      return true;
    } catch (e) {
      return false;
    }
  }
}
