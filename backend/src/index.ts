import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectMongo } from './services/mongo';
import authRoutes from './routes/auth';
import missionRoutes from './routes/missions';
import profileRoutes from './routes/profiles';
import matchRoutes from './routes/matching';
import tendanceRoutes from './routes/tendances';
import webhookRoutes from './routes/webhooks';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'interimatch' });
});

app.use('/api/auth', authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/matching', matchRoutes);
app.use('/api/tendances', tendanceRoutes);
app.use('/api/webhooks', webhookRoutes);

// pages publiques seo-ish (sitemap minimal)
app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://localhost:5173/</loc></url>
  <url><loc>http://localhost:5173/missions</loc></url>
  <url><loc>http://localhost:5173/tendances</loc></url>
  <url><loc>http://localhost:5173/mentions-legales</loc></url>
</urlset>`);
});

async function start() {
  try {
    await connectMongo();
  } catch (e) {
    console.warn('mongo pas dispo, logs matching désactivés', e);
  }

  app.listen(PORT, () => {
    console.log(`api sur :${PORT}`);
  });
}

if (require.main === module) {
  start();
}

export default app;
