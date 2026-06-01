import express from 'express';
import { requireAdmin } from '../middleware/admin';

import { scrapeOpenrec } from '../services/scrapeOpenrec';

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

    const slug = urlObj.pathname.split('/').filter(Boolean)[1];

    if (!slug) {
      return res.status(400).json({
        error: 'Invalid OpenRec URL',
      });
    }

    const cache = await readCache('openrec-programs.json');

    if (cache[slug]) {
      console.log(`Returning cached data for ${slug}`);

      return res.json(cache[slug]);
    }

    console.log(`Scraping fresh data for ${slug}`);

    const data = await scrapeOpenrec(url);

    cache[slug] = data;

    await writeCache('openrec-programs.json', cache);

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to scrape page',
    });
  }
});

export default router;
