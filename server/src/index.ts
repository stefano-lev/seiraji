import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';

import libraryRoutes from './routes/library';
import backupRoutes from './routes/backup';
import importRoutes from './routes/import';
import importPreviewRoutes from './routes/importPreview';
import { isAdmin } from './middleware/admin';

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,

  skip: (req) => isAdmin(req),
});

const backupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  skip: (req) => isAdmin(req),
});

app.use('/api', apiLimiter);

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://seiraji.stef-lev.xyz'],
  })
);

app.use(express.json());

app.use('/api/library', libraryRoutes);

app.use('/api/backup', backupLimiter);
app.use('/api/backup', backupRoutes);

app.use('/api/import/preview', importPreviewRoutes);

app.use('/api/import', importLimiter);
app.use('/api/import', importRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

// cron.schedule('0 0 */14 * *', async () => {
//   console.log('Running scheduled refresh...');
// });
