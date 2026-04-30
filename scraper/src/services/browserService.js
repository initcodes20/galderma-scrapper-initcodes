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

    await this.createNewContext();
    return { browser: this.browser, context: this.context };
  }

  async createNewContext() {
    if (this.context) await this.context.close().catch(() => {});
    
    const userAgent = CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
    logger.info(`Creating new browser context with User-Agent: ${userAgent}`);

    this.context = await this.browser.newContext({
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
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
  }

  async createPage() {
    if (!this.browser) throw new Error("Browser not launched. Call init() first.");
    
    // Log memory usage to help debug Render resource limits
    const mem = process.memoryUsage();
    logger.info(`Memory Usage: RSS: ${Math.round(mem.rss / 1024 / 1024)}MB, Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);

    // Create a new context for every page to maximize isolation and rotation
    await this.createNewContext();
    return await this.context.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info("Browser closed.");
    }
  }
}
