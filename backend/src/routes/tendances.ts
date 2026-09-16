import { Router } from 'express';
import { prisma } from '../services/db';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/', async (_req, res) => {
  const fromDb = await prisma.tendanceMetier.findMany({ orderBy: { nbOffres: 'desc' }, take: 30 });
  if (fromDb.length) return res.json(fromDb);

  // fallback: fichier nettoyé par la CLI
  const cleaned = path.join(__dirname, '../../../data/cleaned/tendances.json');
  if (fs.existsSync(cleaned)) {
    const data = JSON.parse(fs.readFileSync(cleaned, 'utf8'));
    return res.json(data);
  }

  res.json([]);
});

router.get('/suggestions/:metier', async (req, res) => {
  const metier = req.params.metier.toLowerCase();
  const rows = await prisma.tendanceMetier.findMany({
    where: { metier: { contains: metier } },
    orderBy: { nbOffres: 'desc' },
    take: 5,
  });

  // suggestions de compétences basiques si rien en base
  const fallback: Record<string, string[]> = {
    macon: ['coffrage', 'béton', 'fondations', 'enduit'],
    coffreur: ['banche', 'ferraillage', 'décoffrage'],
    electricien: ['câblage', 'tableau', 'norme NF C 15-100'],
    peintre: ['enduit', 'ponçage', 'finition'],
    charpentier: ['assemblage', 'charpente bois', 'couverture'],
  };

  res.json({
    tendances: rows,
    competencesSuggerees: fallback[metier] || ['polyvalence chantier', 'lecture de plans'],
  });
});

export default router;
