import { Router } from 'express';
import { prisma } from '../services/db';
import { requireAuth, requireRole } from '../middleware/auth';
import { scoreMatch } from '../services/matching';
import { MatchingLog } from '../services/mongo';

const router = Router();

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

  // log mongo (best effort)
  try {
    await MatchingLog.insertMany(
      ranked.slice(0, 20).map((r) => ({
        missionId: mission.id,
        interimId: r.interimId,
        score: r.score,
        details: r.details,
      }))
    );
  } catch {
    // mongo down = pas grave
  }

  // notif n8n si match > 80
  const hot = ranked.filter((r) => r.score >= 80);
  if (hot.length && process.env.N8N_WEBHOOK_URL) {
    fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'high_match',
        mission: mission.titre,
        matches: hot.map((h) => ({ email: h.email, score: h.score })),
      }),
    }).catch(() => {});
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

  res.json(ranked);
});

export default router;
