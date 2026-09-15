import { Router } from 'express';
import { prisma } from '../services/db';
import { requireAuth, requireRole } from '../middleware/auth';
import { encrypt } from '../utils/crypto';

const router = Router();

// EPI par métier BTP — info sensibilisation
export const EPI_PAR_METIER: Record<string, string[]> = {
  macon: ['casque', 'chaussures de sécurité', 'gants', 'lunettes'],
  coffreur: ['casque', 'chaussures de sécurité', 'gants', 'harnais si hauteur'],
  electricien: ['casque', 'chaussures de sécurité', 'gants isolants', 'lunettes'],
  peintre: ['masque', 'gants', 'chaussures de sécurité'],
  charpentier: ['casque', 'chaussures de sécurité', 'harnais', 'gants'],
  default: ['casque', 'chaussures de sécurité', 'gants'],
};

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { entreprise: true, interim: true },
  });
  res.json(user?.role === 'ENTREPRISE' ? user.entreprise : user?.interim);
});

router.put('/entreprise', requireAuth, requireRole('ENTREPRISE'), async (req, res) => {
  const { raisonSociale, siret, ville, codePostal, description, iban } = req.body;
  const data: any = {
    raisonSociale,
    siret,
    ville,
    codePostal,
    description,
  };
  if (iban) data.ibanEnc = encrypt(String(iban));

  const profile = await prisma.entrepriseProfile.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, ...data, raisonSociale: raisonSociale || 'Sans nom' },
    update: data,
  });
  // on renvoie sans le iban déchiffré
  const { ibanEnc, ...safe } = profile;
  res.json({ ...safe, hasIban: !!ibanEnc });
});

router.put('/interim', requireAuth, requireRole('INTERIMAIRE'), async (req, res) => {
  const {
    prenom,
    nom,
    telephone,
    ville,
    codePostal,
    rayonKm,
    metiers,
    competences,
    dispoDebut,
    dispoFin,
    experienceAns,
    pieceIdentite,
  } = req.body;

  const data: any = {
    prenom,
    nom,
    telephone,
    ville,
    codePostal,
    rayonKm: rayonKm ? Number(rayonKm) : undefined,
    metiers: metiers || [],
    competences: competences || [],
    dispoDebut: dispoDebut ? new Date(dispoDebut) : null,
    dispoFin: dispoFin ? new Date(dispoFin) : null,
    experienceAns: experienceAns != null ? Number(experienceAns) : undefined,
  };
  if (pieceIdentite) data.pieceIdentiteEnc = encrypt(String(pieceIdentite));

  const profile = await prisma.interimProfile.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      prenom: prenom || '?',
      nom: nom || '?',
      metiers: data.metiers,
      competences: data.competences,
      ...data,
    },
    update: data,
  });
  const { pieceIdentiteEnc, ...safe } = profile;
  res.json({ ...safe, hasPieceIdentite: !!pieceIdentiteEnc });
});

router.get('/epi/:metier', (_req, res) => {
  const m = String(_req.params.metier || '').toLowerCase();
  res.json({ metier: m, epi: EPI_PAR_METIER[m] || EPI_PAR_METIER.default });
});

export default router;
