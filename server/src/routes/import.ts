import express from 'express';

import { requireAdmin } from '../middleware/admin';

import { importProgram } from '../services/importProgram';

const router = express.Router();

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { url, hostOverride } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL required',
      });
    }

    const data = await importProgram(url, hostOverride?.trim() || undefined);

    return res.json(data);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to import program',
    });
  }
});

export default router;
