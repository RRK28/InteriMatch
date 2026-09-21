import { Router } from 'express';
import { prisma } from '../services/db';

const router = Router();

// endpoint appelé par n8n pour relancer les missions ouvertes trop longtemps
router.post('/relance-missions', async (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // attention: days=0 est valide (démo) — ne pas utiliser `|| 7` (0 est falsy)
  const days = req.body.days === undefined || req.body.days === null || req.body.days === ''
    ? 7
    : Number(req.body.days);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stale = await prisma.mission.findMany({
    where: { status: 'OUVERTE', createdAt: { lte: cutoff } },
    include: { entreprise: { select: { email: true, entreprise: true } } },
  });

  res.json({
    count: stale.length,
    days,
    cutoff: cutoff.toISOString(),
    missions: stale.map((m) => ({
      id: m.id,
      titre: m.titre,
      email: m.entreprise.email,
      createdAt: m.createdAt,
    })),
  });
});

export default router;
