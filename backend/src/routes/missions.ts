import { Router } from 'express';
import { prisma } from '../services/db';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth';
import { EPI_PAR_METIER } from './profiles';
import { scoreMatch } from '../services/matching';

const router = Router();

// durée max mission intérim BTP (simplifié) : 18 mois
const MAX_MISSION_DAYS = 18 * 30;

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// listing public = missions ouvertes uniquement (SEO)
router.get('/', async (req, res) => {
  const status = (req.query.status as string) || 'OUVERTE';
  const missions = await prisma.mission.findMany({
    where: { status: status as any },
    orderBy: { createdAt: 'desc' },
    include: {
      entreprise: { select: { entreprise: { select: { raisonSociale: true, ville: true } } } },
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
      include: {
        candidatures: {
          orderBy: { score: 'desc' },
          include: {
            interim: { select: { email: true, interim: true } },
          },
        },
        _count: { select: { candidatures: true } },
      },
    });
    return res.json(missions);
  }
  const cands = await prisma.candidature.findMany({
    where: { interimId: req.user!.id },
    include: { mission: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(cands);
});

router.get('/:id', optionalAuth, async (req, res) => {
  const mission = await prisma.mission.findUnique({
    where: { id: req.params.id },
    include: {
      entreprise: { select: { entreprise: { select: { raisonSociale: true, ville: true } } } },
      candidatures: {
        orderBy: { score: 'desc' },
        include: { interim: { select: { interim: true, email: true } } },
      },
    },
  });
  if (!mission) return res.status(404).json({ error: 'introuvable' });

  const isOwner = req.user?.role === 'ENTREPRISE' && req.user.id === mission.entrepriseId;
  const myCand = req.user?.role === 'INTERIMAIRE'
    ? mission.candidatures.find((c) => c.interimId === req.user!.id)
    : null;

  // pas de fuite PII : candidatures réservées au propriétaire
  const { candidatures, ...rest } = mission;
  res.json({
    ...rest,
    candidatures: isOwner ? candidatures : undefined,
    maCandidature: myCand
      ? { id: myCand.id, score: myCand.score, status: myCand.status, message: myCand.message }
      : null,
    nbCandidatures: candidatures.length,
  });
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

// modification complète (sauf status — géré à part)
router.put('/:id', requireAuth, requireRole('ENTREPRISE'), async (req, res) => {
  const mission = await prisma.mission.findFirst({
    where: { id: req.params.id, entrepriseId: req.user!.id },
  });
  if (!mission) return res.status(404).json({ error: 'introuvable' });
  if (mission.status === 'TERMINEE' || mission.status === 'ANNULEE') {
    return res.status(400).json({ error: 'mission terminée/annulée, plus modifiable' });
  }

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

  const updated = await prisma.mission.update({
    where: { id: mission.id },
    data: {
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

  res.json(updated);
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

router.patch('/:id/candidatures/:candId', requireAuth, requireRole('ENTREPRISE'), async (req, res) => {
  const mission = await prisma.mission.findFirst({
    where: { id: req.params.id, entrepriseId: req.user!.id },
  });
  if (!mission) return res.status(404).json({ error: 'introuvable' });

  const status = req.body.status;
  if (!['ACCEPTEE', 'REFUSEE', 'EN_ATTENTE'].includes(status)) {
    return res.status(400).json({ error: 'status invalide' });
  }

  const cand = await prisma.candidature.findFirst({
    where: { id: req.params.candId, missionId: mission.id },
  });
  if (!cand) return res.status(404).json({ error: 'candidature introuvable' });

  const updated = await prisma.candidature.update({
    where: { id: cand.id },
    data: { status },
  });

  if (status === 'ACCEPTEE') {
    // mission pourvue + on refuse les autres en attente
    await prisma.mission.update({ where: { id: mission.id }, data: { status: 'POURVUE' } });
    await prisma.candidature.updateMany({
      where: { missionId: mission.id, id: { not: cand.id }, status: 'EN_ATTENTE' },
      data: { status: 'REFUSEE' },
    });
  }

  res.json(updated);
});

router.post('/:id/candidater', requireAuth, requireRole('INTERIMAIRE'), async (req, res) => {
  const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
  if (!mission || mission.status !== 'OUVERTE') {
    return res.status(400).json({ error: 'mission non disponible' });
  }

  const profil = await prisma.interimProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profil) return res.status(400).json({ error: 'complète ton profil d abord' });
  if (!profil.metiers.length) {
    return res.status(400).json({ error: 'ajoute au moins un métier dans ton profil' });
  }

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
