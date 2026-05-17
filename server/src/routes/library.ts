import express from 'express';

import { readCache } from '../utils/cache';

const router = express.Router();

router.get('/all', async (_, res) => {
  try {
    const [audee, youtube, onsen, qlover] = await Promise.all([
      readCache('audee-programs.json'),

      readCache('youtube-playlists.json'),

      readCache('onsen-programs.json'),

      readCache('qlover-programs.json'),
    ]);

    const merged = [
      ...Object.values(audee),
      ...Object.values(youtube),
      ...Object.values(onsen),
      ...Object.values(qlover),
    ];

    res.json(merged);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to load library',
    });
  }
});

export default router;
