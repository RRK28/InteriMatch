import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { passport } from '../services/passport';

const router = Router();

function frontBase() {
  return (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
}

function signAndRedirect(res: any, user: { id: string; role: string; email: string }) {
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: '7d' }
  );
  res.redirect(`${frontBase()}/oauth/callback?token=${encodeURIComponent(token)}`);
}

function failRedirect(res: any, msg: string) {
  res.redirect(`${frontBase()}/login?oauth_error=${encodeURIComponent(msg)}`);
}

// Google
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return failRedirect(res, 'Google OAuth non configuré');
  }
  const role = req.query.role === 'ENTREPRISE' ? 'ENTREPRISE' : 'INTERIMAIRE';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: role,
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err: any, user: any) => {
      if (err || !user) return failRedirect(res, err?.message || 'connexion Google échouée');
      signAndRedirect(res, user);
    })(req, res, next);
  }
);

// Microsoft
router.get('/microsoft', (req, res, next) => {
  if (!process.env.MICROSOFT_CLIENT_ID) {
    return failRedirect(res, 'Microsoft OAuth non configuré');
  }
  const role = req.query.role === 'ENTREPRISE' ? 'ENTREPRISE' : 'INTERIMAIRE';
  passport.authenticate('microsoft', {
    session: false,
    state: role,
  })(req, res, next);
});

router.get(
  '/microsoft/callback',
  (req, res, next) => {
    passport.authenticate('microsoft', { session: false }, (err: any, user: any) => {
      if (err || !user) return failRedirect(res, err?.message || 'connexion Microsoft échouée');
      signAndRedirect(res, user);
    })(req, res, next);
  }
);

router.get('/providers', (_req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID,
    microsoft: !!process.env.MICROSOFT_CLIENT_ID,
  });
});

export default router;
