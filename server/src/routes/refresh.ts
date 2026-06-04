import express from 'express';

import { refreshProgram } from '../services/refreshProgram';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL required',
      });
    }

    const result = await refreshProgram(url);

    return res.json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to refresh program',
    });
  }
});

export default router;
