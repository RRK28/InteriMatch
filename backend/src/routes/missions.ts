import { Router } from 'express';
import { prisma } from '../services/db';
import { requireAuth, requireRole } from '../middleware/auth';
import { EPI_PAR_METIER } from './profiles';

const router = Router();

// durée max mission intérim BTP (simplifié) : 18 mois
const MAX_MISSION_DAYS = 18 * 30;

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

router.get('/', async (req, res) => {
  const status = req.query.status as string | undefined;
  const where: any = {};
  if (status) where.status = status;
  // listing public des missions ouvertes (seo)
  if (!req.headers.authorization) {
    where.status = 'OUVERTE';
  }

  const missions = await prisma.mission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      entreprise: { select: { entreprise: true, email: true } },
      _count: { select: { candidatures: true } },
    },
    take: 50,
  });
  res.json(missions);
});

router.get('/mine', requireAuth, async (req, res) => {
  if (req.user!.role === 'ENTREPRISE') {
    const missions = await prisma.mission.findMany({
      where: { entrepriseId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { candidatures: true, _count: { select: { candidatures: true } } },
    });
    return res.json(missions);
  }
  // interim: missions où il a candidaté
  const cands = await prisma.candidature.findMany({
    where: { interimId: req.user!.id },
    include: { mission: true },
  });
  res.json(cands);
});

router.get('/:id', async (req, res) => {
  const mission = await prisma.mission.findUnique({
    where: { id: req.params.id },
    include: {
      entreprise: { select: { entreprise: true } },
      candidatures: { include: { interim: { select: { interim: true, email: true } } } },
    },
  });
  if (!mission) return res.status(404).json({ error: 'introuvable' });
  res.json(mission);
});

router.post('/', requireAuth, requireRole('ENTREPRISE'), async (req, res) => {
  const { titre, description, metier, competences, ville, codePostal, dateDebut, dateFin, remuneration } =
    req.body;

  if (!titre || !metier || !ville || !dateDebut || !dateFin) {
    return res.status(400).json({ error: 'champs manquants' });
  }

  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  if (fin <= debut) return res.status(400).json({ error: 'dates incohérentes' });

  const duree = daysBetween(debut, fin);
  if (duree > MAX_MISSION_DAYS) {
    return res.status(400).json({
      error: `durée max intérim dépassée (${duree}j > ${MAX_MISSION_DAYS}j)`,
    });
  }

  const metierKey = String(metier).toLowerCase();
  const epi = EPI_PAR_METIER[metierKey] || EPI_PAR_METIER.default;

  const mission = await prisma.mission.create({
    data: {
      entrepriseId: req.user!.id,
      titre,
      description: description || '',
      metier: metierKey,
      competences: competences || [],
      ville,
      codePostal: codePostal || '',
      dateDebut: debut,
      dateFin: fin,
      remuneration: Number(remuneration) || 14,
      epiObligatoires: epi,
    },
  });

  res.status(201).json(mission);
});

router.patch('/:id/status', requireAuth, requireRole('ENTREPRISE'), async (req, res) => {
  const mission = await prisma.mission.findFirst({
    where: { id: req.params.id, entrepriseId: req.user!.id },
  });
  if (!mission) return res.status(404).json({ error: 'introuvable' });

  const status = req.body.status;
  if (!['OUVERTE', 'POURVUE', 'TERMINEE', 'ANNULEE'].includes(status)) {
    return res.status(400).json({ error: 'status invalide' });
  }

  const updated = await prisma.mission.update({
    where: { id: mission.id },
    data: { status },
  });
  res.json(updated);
});

// candidater
router.post('/:id/candidater', requireAuth, requireRole('INTERIMAIRE'), async (req, res) => {
  const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
  if (!mission || mission.status !== 'OUVERTE') {
    return res.status(400).json({ error: 'mission non disponible' });
  }

  const { scoreMatch } = await import('../services/matching');
  const profil = await prisma.interimProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profil) return res.status(400).json({ error: 'complète ton profil d abord' });

  const { score } = scoreMatch(mission, profil);

  try {
    const cand = await prisma.candidature.create({
      data: {
        missionId: mission.id,
        interimId: req.user!.id,
        score,
        message: req.body.message || null,
      },
    });

    // webhook n8n si configuré (confirmation postulation)
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candidature',
          email: req.user!.email,
          mission: mission.titre,
          score,
        }),
      }).catch(() => {});
    }

    res.status(201).json(cand);
  } catch {
    res.status(409).json({ error: 'déjà candidaté' });
  }
});

export default router;
