import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = { id: string; role: 'ENTREPRISE' | 'INTERIMAIRE'; email: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev') as AuthUser;
    } catch {
      // token pourri = on continue en anonyme
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'non authentifié' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as AuthUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'token invalide' });
  }
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'accès refusé' });
    }
    next();
  };
}

// rate limit tout con en mémoire (anti brute force login)
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(max = 20, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || now > cur.reset) {
      hits.set(key, { n: 1, reset: now + windowMs });
      return next();
    }
    cur.n += 1;
    if (cur.n > max) {
      return res.status(429).json({ error: 'trop de tentatives, réessaie dans une minute' });
    }
    next();
  };
}
