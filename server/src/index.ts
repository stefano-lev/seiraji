import express from 'express';
import 'dotenv/config';
import cors from 'cors';

import audeeRoutes from './routes/audee';
import onsenRoutes from './routes/onsen';
import qloverRoutes from './routes/qlover';
import youtubeRoutes from './routes/youtube';
import libraryRoutes from './routes/library';

const app = express();

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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/health', (_, res) => {
  res.json({ ok: true });
});
