import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';

import audeeRoutes from './routes/audee';
import onsenRoutes from './routes/onsen';
import qloverRoutes from './routes/qlover';
import youtubeRoutes from './routes/youtube';
import libraryRoutes from './routes/library';
import backupRoutes from './routes/backup';

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
});

app.use('/api', apiLimiter);

app.use('/api/youtube/import', importLimiter);
app.use('/api/audee/import', importLimiter);
app.use('/api/qlover/import', importLimiter);
app.use('/api/onsen/import', importLimiter);

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://seiraji.stef-lev.xyz'],
  })
);

app.use(express.json());

app.use('/api/audee', audeeRoutes);

app.use('/api/onsen', onsenRoutes);

app.use('/api/qlover', qloverRoutes);

app.use('/api/youtube', youtubeRoutes);

app.use('/api/library', libraryRoutes);

app.use('/api/backup', backupRoutes);

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
