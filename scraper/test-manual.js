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
    const amzResult = await amazon.searchProduct("CETAPHIL Baby Daily Lotion 400ml");
    console.log("Amazon Result:", amzResult);

    const pageFlp = await browserService.createPage();
    const flipkart = new FlipkartHandler(pageFlp);
    console.log("Starting Flipkart search...");
    const flpResult = await flipkart.searchProduct("CETAPHIL Baby Daily Lotion 400ml");
    console.log("Flipkart Result:", flpResult);
    
    const pageNyk = await browserService.createPage();
    const { NykaaHandler } = await import('./src/handlers/nykaaHandler.js');
    const nykaa = new NykaaHandler(pageNyk);
    console.log("Starting Nykaa search...");
    const nykResult = await nykaa.searchProduct("CETAPHIL Baby Daily Lotion 400ml");
    console.log("Nykaa Result:", nykResult);
    
  } catch(e) {
    console.error("Test error:", e);
  } finally {
    await browserService.close();
  }
}

run();
