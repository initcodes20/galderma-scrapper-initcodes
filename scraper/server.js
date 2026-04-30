import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SearchService } from './src/services/searchService.js';
import { logger } from './src/utils/logger.js';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 5001;

app.use(cors());
app.use(express.json());

const searchService = new SearchService();

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Galderma Scraper API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/search-product', async (req, res) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required and must be a string' });
  }

  try {
    logger.info(`Received search request for: "${query}"`);
    const result = await searchService.search(query);
    res.json(result);
  } catch (error) {
    logger.error('Error processing search request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  logger.info(`Scraper API server running on port ${port}`);
});
