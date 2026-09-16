import { Router } from 'express';
import { prisma } from '../services/db';

const router = Router();

// endpoint appelé par n8n pour relancer les missions ouvertes trop longtemps
router.post('/relance-missions', async (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const days = Number(req.body.days || 7);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const stale = await prisma.mission.findMany({
    where: { status: 'OUVERTE', createdAt: { lt: cutoff } },
    include: { entreprise: { select: { email: true, entreprise: true } } },
  });

  res.json({
    count: stale.length,
    missions: stale.map((m) => ({
      id: m.id,
      titre: m.titre,
      email: m.entreprise.email,
      createdAt: m.createdAt,
    })),
  });
});

export default router;
