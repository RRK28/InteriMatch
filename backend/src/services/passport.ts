import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MicrosoftStrategy = require('passport-microsoft').Strategy;
import { prisma } from './db';
import type { Role } from '@prisma/client';

export type OAuthUser = { id: string; email: string; role: Role };

function parseRole(raw?: string): Role {
  return raw === 'ENTREPRISE' ? 'ENTREPRISE' : 'INTERIMAIRE';
}

function splitName(displayName?: string | null) {
  const parts = (displayName || 'Utilisateur OAuth').trim().split(/\s+/);
  return { prenom: parts[0] || 'Prénom', nom: parts.slice(1).join(' ') || 'Nom' };
}

async function upsertOAuthUser(opts: {
  email: string;
  role: Role;
  displayName?: string | null;
  googleId?: string;
  microsoftId?: string;
}) {
  const email = opts.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user && opts.googleId) {
    user = await prisma.user.findUnique({ where: { googleId: opts.googleId } });
  }
  if (!user && opts.microsoftId) {
    user = await prisma.user.findUnique({ where: { microsoftId: opts.microsoftId } });
  }

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: opts.googleId || user.googleId,
        microsoftId: opts.microsoftId || user.microsoftId,
        consentRgpd: true,
        consentAt: user.consentAt || new Date(),
      },
    });
    return user;
  }

  const { prenom, nom } = splitName(opts.displayName);

  return prisma.user.create({
    data: {
      email,
      role: opts.role,
      googleId: opts.googleId,
      microsoftId: opts.microsoftId,
      consentRgpd: true,
      consentAt: new Date(),
      ...(opts.role === 'ENTREPRISE'
        ? {
            entreprise: {
              create: { raisonSociale: opts.displayName || email.split('@')[0] },
            },
          }
        : {
            interim: {
              create: { prenom, nom, metiers: [], competences: [] },
            },
          }),
    },
  });
}

export function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            'http://localhost:4000/api/auth/google/callback',
          passReqToCallback: true,
        },
        async (req, _accessToken, _refreshToken, profile: GoogleProfile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('email Google manquant'));
            const role = parseRole(String(req.query.state || req.query.role || 'INTERIMAIRE'));
            const user = await upsertOAuthUser({
              email,
              role,
              displayName: profile.displayName,
              googleId: profile.id,
            });
            done(null, user);
          } catch (e) {
            done(e as Error);
          }
        }
      )
    );
    console.log('passport google ok');
  } else {
    console.warn('passport google désactivé (manque GOOGLE_CLIENT_ID/SECRET)');
  }

  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          callbackURL:
            process.env.MICROSOFT_CALLBACK_URL ||
            'http://localhost:4000/api/auth/microsoft/callback',
          scope: ['user.read', 'openid', 'email', 'profile'],
          tenant: 'common',
          passReqToCallback: true,
        },
        async (
          req: any,
          _accessToken: string,
          _refreshToken: string,
          profile: any,
          done: (err: any, user?: any) => void
        ) => {
          try {
            const email =
              profile.emails?.[0]?.value ||
              profile._json?.mail ||
              profile._json?.userPrincipalName;
            if (!email) return done(new Error('email Microsoft manquant'));
            const role = parseRole(String(req.query.state || req.query.role || 'INTERIMAIRE'));
            const user = await upsertOAuthUser({
              email: String(email),
              role,
              displayName: profile.displayName || profile._json?.displayName,
              microsoftId: profile.id,
            });
            done(null, user);
          } catch (e) {
            done(e);
          }
        }
      )
    );
    console.log('passport microsoft ok');
  } else {
    console.warn('passport microsoft désactivé (manque MICROSOFT_CLIENT_ID/SECRET)');
  }
}

export { passport };
