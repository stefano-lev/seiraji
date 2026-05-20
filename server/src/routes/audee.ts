import express from 'express';
import { requireAdmin } from '../middleware/admin';

import { scrapeAudee } from '../services/scrapeAudee';

import { readCache, writeCache } from '../utils/cache';

const router = express.Router();

router.post('/import', requireAdmin, async (req, res) => {
  try {
    const url = req.body?.url;

    if (!url) {
      return res.status(400).json({
        error: 'URL required',
      });
    }

    const urlObj = new URL(url);

    const slug = urlObj.pathname.split('/').filter(Boolean)[0];

    if (!slug) {
      return res.status(400).json({
        error: 'Invalid Audee URL',
      });
    }

    const cache = await readCache('audee-programs.json');

    if (cache[slug]) {
      console.log(`Returning cached data for ${slug}`);

      return res.json(cache[slug]);
    }

    console.log(`Scraping fresh data for ${slug}`);

    const data = await scrapeAudee(url);

    cache[slug] = data;

    await writeCache('audee-programs.json', cache);

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to scrape page',
    });
  }
});

export default router;
