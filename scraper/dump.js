import { BrowserService } from './src/services/browserService.js';
import fs from 'fs';

async function test() {
  const bs = new BrowserService();
  await bs.init({headless: false});
  try {
    const page = await bs.createPage();
    
    console.log("=== FLIPKART ===");
    await page.goto(`https://www.flipkart.com/search?q=cetaphil+healthy+radiance+cleanser`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    fs.writeFileSync('flp.html', await page.content());

    console.log("=== AMAZON ===");
    await page.goto(`https://www.amazon.in/s?k=cetaphil+healthy+radiance+cleanser`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    fs.writeFileSync('amz.html', await page.content());
    
  } catch(e) {
    console.error(e);
  } finally {
    await bs.close();
  }
}
test();
