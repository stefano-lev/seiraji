import express from 'express';

import { scrapeYoutubePlaylist } from '../services/scrapeYoutubePlaylist';

import { readCache, writeCache } from '../utils/cache';

const router = express.Router();

router.post('/import', async (req, res) => {
  try {
    const url = req.body?.url;

    if (!url) {
      return res.status(400).json({
        error: 'URL required',
      });
    }

    const playlistId = new URL(url).searchParams.get('list');

    if (!playlistId) {
      return res.status(400).json({
        error: 'Invalid playlist URL',
      });
    }

    const cache = await readCache('youtube-playlists.json');

    if (cache[playlistId]) {
      console.log(`Returning cached playlist ${playlistId}`);

      return res.json(cache[playlistId]);
    }

    console.log(`Scraping playlist ${playlistId}`);

    const data = await scrapeYoutubePlaylist(url);

    cache[playlistId] = data;

    await writeCache('youtube-playlists.json', cache);

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to import playlist',
    });
  }
});

export default router;
