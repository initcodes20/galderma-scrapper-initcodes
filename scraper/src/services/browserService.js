import { chromium } from "playwright";
import { CONFIG } from "../config/config.js";
import { logger } from "../utils/logger.js";

export class BrowserService {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  async init(options = {}) {
    const headless = options.headless !== undefined ? options.headless : CONFIG.BROWSER.HEADLESS;
    
    logger.info(`Starting browser (headless: ${headless})...`);
    
    this.browser = await chromium.launch({
      headless: headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
      ],
    });

    const userAgent = CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
    
    this.context = await this.browser.newContext({
      viewport: CONFIG.BROWSER.VIEWPORT,
      userAgent: userAgent,
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      // Add more stealth properties here if needed
    });

    // Stealth script to bypass basic detection
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    return { browser: this.browser, context: this.context };
  }

  async createPage() {
    if (!this.context) throw new Error("Browser not initialized. Call init() first.");
    return await this.context.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info("Browser closed.");
    }
  }
}
