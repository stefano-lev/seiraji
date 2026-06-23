import express from 'express';

import { requireAdmin } from '../middleware/requireAdmin';

import { refreshLibrary } from '../services/refreshLibrary';

const router = express.Router();

let refreshLibraryRunning = false;

router.post('/refresh-library', requireAdmin, async (_req, res) => {
  if (refreshLibraryRunning) {
    return res.status(409).json({
      error: 'Library refresh is already running',
    });
  }

  try {
    refreshLibraryRunning = true;

    const result = await refreshLibrary();

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to refresh library',
    });
  } finally {
    refreshLibraryRunning = false;
  }
});

export default router;
