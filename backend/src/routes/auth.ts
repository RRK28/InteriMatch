import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/db';
import { requireAuth } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ENTREPRISE', 'INTERIMAIRE']),
  consentRgpd: z.literal(true),
  // profil minimal selon role
  raisonSociale: z.string().optional(),
  prenom: z.string().optional(),
  nom: z.string().optional(),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'données invalides', details: parsed.error.flatten() });
  }
  const data = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: 'email déjà utilisé' });

  if (data.role === 'ENTREPRISE' && !data.raisonSociale) {
    return res.status(400).json({ error: 'raison sociale requise' });
  }
  if (data.role === 'INTERIMAIRE' && (!data.prenom || !data.nom)) {
    return res.status(400).json({ error: 'nom/prenom requis' });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      consentRgpd: true,
      consentAt: new Date(),
      ...(data.role === 'ENTREPRISE'
        ? { entreprise: { create: { raisonSociale: data.raisonSociale! } } }
        : { interim: { create: { prenom: data.prenom!, nom: data.nom!, metiers: [], competences: [] } } }),
    },
  });

  const token = signToken(user.id, user.role, user.email);
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'email/mdp requis' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'identifiants incorrects' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'identifiants incorrects' });

  const token = signToken(user.id, user.role, user.email);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { entreprise: true, interim: true },
  });
  if (!user) return res.status(404).json({ error: 'introuvable' });
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    entreprise: user.entreprise,
    interim: user.interim,
  });
});

// suppression compte RGPD
router.delete('/me', requireAuth, async (req, res) => {
  await prisma.user.delete({ where: { id: req.user!.id } });
  res.json({ ok: true });
});

function signToken(id: string, role: string, email: string) {
  return jwt.sign({ id, role, email }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
}

export default router;
