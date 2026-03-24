import { BrowserService } from './src/services/browserService.js';
import { AmazonHandler } from './src/handlers/amazonHandler.js';
import { FlipkartHandler } from './src/handlers/flipkartHandler.js';

async function test() {
  const bs = new BrowserService();
  await bs.init({headless: true});
  try {
    const page = await bs.createPage();
    const ah = new AmazonHandler(page);
    const fh = new FlipkartHandler(page);
    
    // Test Flipkart
    console.log("=== FLIPKART ===");
    await fh.navigateWithRetry(`https://www.flipkart.com/search?q=cetaphil+healthy+radiance+cleanser`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const fitems = await page.$$eval('[data-id]', elements => {
       return elements.slice(0, 5).map(el => {
          return {
             text: el.innerText.substring(0, 100).replace(/\n/g, " "),
             priceHtml: el.querySelector('div._30jeq3, div.Nx9zRn, .price, [class*="price"], [class*="Price"]')?.outerHTML || "no-price"
          }
       });
    });
    console.log("Flipkart raw items:", JSON.stringify(fitems, null, 2));

    // Test Amazon
    console.log("=== AMAZON ===");
    await ah.navigateWithRetry(`https://www.amazon.in/s?k=cetaphil+healthy+radiance+cleanser`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const aitems = await page.$$eval('[data-component-type="s-search-result"]', elements => {
       return elements.slice(0, 5).map(el => {
          return {
             text: el.innerText.substring(0, 100).replace(/\n/g, " "),
             priceHtml: el.querySelector('.a-price-whole, [class*="a-price"]')?.outerHTML || "no-price"
          }
       });
    });
    console.log("Amazon raw items:", JSON.stringify(aitems, null, 2));

  } catch(e) {
    console.error(e);
  } finally {
    await bs.close();
  }
}
test();
