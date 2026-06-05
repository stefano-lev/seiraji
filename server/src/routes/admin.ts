import express from 'express';

import { requireAdmin } from '../middleware/requireAdmin';

import { refreshLibrary } from '../services/refreshLibrary';

const router = express.Router();

router.post('/refresh-library', requireAdmin, async (_req, res) => {
  try {
    const result = await refreshLibrary();

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to refresh library',
    });
  }
});

export default router;
