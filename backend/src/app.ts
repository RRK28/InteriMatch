import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import missionRoutes from './routes/missions';
import profileRoutes from './routes/profiles';
import matchRoutes from './routes/matching';
import tendanceRoutes from './routes/tendances';
import webhookRoutes from './routes/webhooks';
import { configurePassport, passport } from './services/passport';

configurePassport();

const app = express();

const publicUrl =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173';

app.use(
  cors({
    origin: [publicUrl, 'http://localhost:5173', 'http://localhost:4000'],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'interimatch' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/matching', matchRoutes);
app.use('/api/tendances', tendanceRoutes);
app.use('/api/webhooks', webhookRoutes);

app.get('/sitemap.xml', (_req, res) => {
  const base = publicUrl.replace(/\/$/, '');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
  <url><loc>${base}/missions</loc></url>
  <url><loc>${base}/tendances</loc></url>
  <url><loc>${base}/mentions-legales</loc></url>
</urlset>`);
});

// prod : front Vite build servi par Express (une seule URL Render)
// __dirname = backend/dist/src → remonter à la racine du repo
const frontDist = path.resolve(__dirname, '../../../frontend/dist');
const frontAlt = path.resolve(process.cwd(), '../frontend/dist');
const staticDir = fs.existsSync(frontDist) ? frontDist : frontAlt;

if (fs.existsSync(staticDir)) {
  console.log('front static:', staticDir);
  app.use(express.static(staticDir, { maxAge: '1h', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  console.warn('pas de frontend/dist — GET / renverra 404');
  app.get('/', (_req, res) => {
    res.status(503).send('Front non buildé. Vérifie scripts/render-build.sh');
  });
}

export default app;
