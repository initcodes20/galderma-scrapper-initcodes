export const CONFIG = {
  BROWSER: {
    HEADLESS: true, // Default to true for invisible scraping
    VIEWPORT: { width: 1280, height: 800 },
    TIMEOUT: 90000, // Increased to 90s for slower environments like Render
  },
  RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY: 3000,
    MAX_DELAY: 15000,
  },
  HUMAN_BEHAVIOR: {
    MIN_DELAY: 2000,
    MAX_DELAY: 5000,
    SCROLL_PROBABILITY: 0.8,
  },
  USER_AGENTS: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
  ],
  VIEWPORTS: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
  ],
  PROXIES: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(",") : [],
};
