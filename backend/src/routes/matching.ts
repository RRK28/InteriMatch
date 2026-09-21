import { Router } from 'express';
import { prisma } from '../services/db';
import { requireAuth, requireRole } from '../middleware/auth';
import { scoreMatch } from '../services/matching';
import { AutomationEvent, isMongoReady, MatchingLog } from '../services/mongo';
import { notifyN8n } from '../services/n8n';

const router = Router();

async function logMatchingRows(
  rows: { missionId: string; interimId: string; score: number; details: unknown }[]
) {
  if (!rows.length || !isMongoReady()) return;
  try {
    await MatchingLog.insertMany(rows);
  } catch {
    // mongo down = pas grave
  }
}

// pour une mission: ranking des intérimaires
router.get('/mission/:id', requireAuth, requireRole('ENTREPRISE'), async (req, res) => {
  const mission = await prisma.mission.findFirst({
    where: { id: req.params.id, entrepriseId: req.user!.id },
  });
  if (!mission) return res.status(404).json({ error: 'introuvable' });

  const interims = await prisma.interimProfile.findMany({
    include: { user: { select: { id: true, email: true } } },
  });

  const ranked = interims
    .map((p) => {
      const result = scoreMatch(mission, p);
      return {
        interimId: p.userId,
        email: p.user.email,
        prenom: p.prenom,
        nom: p.nom,
        metiers: p.metiers,
        ...result,
      };
    })
    .sort((a, b) => b.score - a.score);

  await logMatchingRows(
    ranked.slice(0, 20).map((r) => ({
      missionId: mission.id,
      interimId: r.interimId,
      score: r.score,
      details: r.details,
    }))
  );

  const hot = ranked.filter((r) => r.score >= 80);
  if (hot.length) {
    await notifyN8n({
      type: 'high_match',
      mission: mission.titre,
      missionId: mission.id,
      matches: hot.map((h) => ({ email: h.email, score: h.score })),
    });
  }

  res.json(ranked);
});

// pour un interim: missions qui matchent
router.get('/for-me', requireAuth, requireRole('INTERIMAIRE'), async (req, res) => {
  const profil = await prisma.interimProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profil) return res.status(400).json({ error: 'profil manquant' });

  const missions = await prisma.mission.findMany({ where: { status: 'OUVERTE' } });
  const ranked = missions
    .map((m) => ({ mission: m, ...scoreMatch(m, profil) }))
    .sort((a, b) => b.score - a.score);

  await logMatchingRows(
    ranked.slice(0, 20).map((r) => ({
      missionId: r.mission.id,
      interimId: req.user!.id,
      score: r.score,
      details: r.details,
    }))
  );

  res.json(ranked);
});

/** Derniers logs de matching (preuve Mongo en soutenance) */
router.get('/logs', requireAuth, requireRole('ENTREPRISE'), async (_req, res) => {
  if (!isMongoReady()) {
    return res.status(503).json({ error: 'mongo indisponible', logs: [] });
  }
  const logs = await MatchingLog.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json({ count: logs.length, logs });
});

/** Événements n8n archivés (même sans webhook externe) */
router.get('/automations', requireAuth, requireRole('ENTREPRISE'), async (_req, res) => {
  if (!isMongoReady()) {
    return res.status(503).json({ error: 'mongo indisponible', events: [] });
  }
  const events = await AutomationEvent.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json({ count: events.length, events });
});

export default router;
