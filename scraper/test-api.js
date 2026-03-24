import dotenv from 'dotenv';
dotenv.config();
import { SearchService } from './src/services/searchService.js';

async function test() {
  const service = new SearchService();
  console.log("Testing SearchService with query: 'cetaphil cleanser 118ml'");
  try {
    const result = await service.search('cetaphil cleanser 118ml');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Test failed", err);
  } finally {
    if (service.browserService) {
      await service.browserService.close();
    }
  }
}

test();
