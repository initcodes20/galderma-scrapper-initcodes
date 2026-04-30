import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { CONFIG } from "../config/config.js";
import { logger } from "../utils/logger.js";

chromium.use(stealthPlugin());

export class BrowserService {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  async init(options = {}) {
    const headless = options.headless !== undefined ? options.headless : CONFIG.BROWSER.HEADLESS;
    
    logger.info(`Starting browser engine (headless: ${headless})...`);
    
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

    return { browser: this.browser };
  }

  async createPage() {
    if (!this.browser) throw new Error("Browser not launched. Call init() first.");
    
    // Log memory usage
    const mem = process.memoryUsage();
    logger.info(`Memory Usage: RSS: ${Math.round(mem.rss / 1024 / 1024)}MB, Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);

    const userAgent = CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
    logger.info(`Creating isolated browser context with User-Agent: ${userAgent}`);

    const context = await this.browser.newContext({
      viewport: CONFIG.BROWSER.VIEWPORT,
      userAgent: userAgent,
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      }
    });

    // Stealth script
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    return await context.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info("Browser engine stopped.");
    }
  }
}
