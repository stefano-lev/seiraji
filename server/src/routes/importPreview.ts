import express from 'express';

import { previewProgram } from '../services/previewProgram';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { url, hostOverride } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL required',
      });
    }

    const preview = await previewProgram(
      url,
      hostOverride?.trim() || undefined
    );

    return res.json(preview);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to generate preview',
    });
  }
});

export default router;
