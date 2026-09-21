import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { passport } from '../services/passport';

const router = Router();

/** Toujours rediriger sur le même host (évite la boucle localhost ↔ Render) */
function redirectTo(res: Response, req: Request, path: string) {
  // path commence par /
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  if (host && !host.includes('localhost')) {
    return res.redirect(`${proto}://${host}${path}`);
  }
  // local : front Vite
  const front = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return res.redirect(`${front}${path}`);
}

function signAndRedirect(req: Request, res: Response, user: { id: string; role: string; email: string }) {
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: '7d' }
  );
  // hash = le token ne part pas dans les logs Referer aussi facilement
  redirectTo(res, req, `/oauth/callback#token=${encodeURIComponent(token)}`);
}

function failRedirect(req: Request, res: Response, msg: string) {
  redirectTo(res, req, `/login?oauth_error=${encodeURIComponent(msg)}`);
}

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return failRedirect(req, res, 'Google OAuth non configuré');
  }
  const role = req.query.role === 'ENTREPRISE' ? 'ENTREPRISE' : 'INTERIMAIRE';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: role,
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err: any, user: any, info: any) => {
    if (err || !user) {
      console.error('google oauth fail', err || info);
      return failRedirect(req, res, err?.message || 'connexion Google échouée');
    }
    signAndRedirect(req, res, user);
  })(req, res, next);
});

router.get('/microsoft', (req, res, next) => {
  if (!process.env.MICROSOFT_CLIENT_ID) {
    return failRedirect(req, res, 'Microsoft OAuth non configuré');
  }
  const role = req.query.role === 'ENTREPRISE' ? 'ENTREPRISE' : 'INTERIMAIRE';
  passport.authenticate('microsoft', {
    session: false,
    state: role,
  })(req, res, next);
});

router.get('/microsoft/callback', (req, res, next) => {
  passport.authenticate('microsoft', { session: false }, (err: any, user: any, info: any) => {
    if (err || !user) {
      console.error('microsoft oauth fail', err || info);
      return failRedirect(req, res, err?.message || 'connexion Microsoft échouée');
    }
    signAndRedirect(req, res, user);
  })(req, res, next);
});

router.get('/providers', (_req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID,
    microsoft: !!process.env.MICROSOFT_CLIENT_ID,
  });
});

export default router;
