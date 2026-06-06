import express from 'express';
import { requireAdmin } from '../middleware/requireAdmin';

import { readCache, deleteCacheEntry } from '../utils/cache';

const router = express.Router();

router.get('/all', async (_, res) => {
  try {
    const [
      audee,
      youtube,
      onsen,
      qlover,
      nicochannel,
      openrec,
      nhk,
      tfm,
      allnightnippon,
    ] = await Promise.all([
      readCache('audee-programs.json'),

      readCache('youtube-playlists.json'),

      readCache('onsen-programs.json'),

      readCache('qlover-programs.json'),

      readCache('nicochannel-programs.json'),

      readCache('openrec-programs.json'),

      readCache('nhk-programs.json'),

      readCache('tfm-programs.json'),

      readCache('allnightnippon-programs.json'),
    ]);

    const merged = [
      ...Object.values(audee),
      ...Object.values(youtube),
      ...Object.values(onsen),
      ...Object.values(qlover),
      ...Object.values(nicochannel),
      ...Object.values(openrec),
      ...Object.values(nhk),
      ...Object.values(tfm),
      ...Object.values(allnightnippon),
    ];

    res.json(merged);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to load library',
    });
  }
});

router.delete('/:platform/:id', requireAdmin, async (req, res) => {
  try {
    const platform = String(req.params.platform);
    const id = String(req.params.id);

    const cacheMap: Record<string, string> = {
      audee: 'audee-programs.json',
      youtube: 'youtube-playlists.json',
      onsen: 'onsen-programs.json',
      qlover: 'qlover-programs.json',
      nicochannel: 'nicochannel-programs.json',
      openrec: 'openrec-programs.json',
      nhk: 'nhk-programs.json',
      tfm: 'tfm-programs.json',
      allnightnippon: 'allnightnippon-programs.json',
    };

    const filename = cacheMap[platform];

    if (!filename) {
      return res.status(400).json({
        error: 'Invalid platform',
      });
    }

    await deleteCacheEntry(filename, id);

    res.json({
      success: true,
      deleted: id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to delete program',
    });
  }
});

export default router;
