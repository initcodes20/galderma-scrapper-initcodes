import { ScraperService } from "./src/services/scraperService.js";
import cron from "node-cron";
import { logger } from "./src/utils/logger.js";

async function run() {
  const service = new ScraperService();
  try {
    await service.run();
  } catch (err) {
    logger.error("Error in main entry point", err);
  }
}

// Every 6 hours
cron.schedule("0 */6 * * *", () => {
  logger.info("Running scheduled scraper...");
  run();
});

// Run once on start
run();