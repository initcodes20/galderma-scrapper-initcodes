import { BrowserService } from './src/services/browserService.js';
import { AmazonHandler } from './src/handlers/amazonHandler.js';
import { FlipkartHandler } from './src/handlers/flipkartHandler.js';

async function run() {
  const browserService = new BrowserService();
  await browserService.init({ headless: false }); // Test with headed to see if it makes a difference

  try {
    const pageAmz = await browserService.createPage();
    const amazon = new AmazonHandler(pageAmz);
    console.log("Starting Amazon search...");
    const amzResult = await amazon.searchProduct("Cetaphil Healthy Radiance Cleanser");
    console.log("Amazon Result:", amzResult);

    const pageFlp = await browserService.createPage();
    const flipkart = new FlipkartHandler(pageFlp);
    console.log("Starting Flipkart search...");
    const flpResult = await flipkart.searchProduct("Cetaphil Healthy Radiance Cleanser");
    console.log("Flipkart Result:", flpResult);
    
  } catch(e) {
    console.error("Test error:", e);
  } finally {
    await browserService.close();
  }
}

run();
