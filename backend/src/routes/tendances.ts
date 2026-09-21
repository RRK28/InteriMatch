import { Router } from 'express';
import { prisma } from '../services/db';
import fs from 'fs';
import path from 'path';

const router = Router();

function readJson(rel: string) {
  const p = path.join(__dirname, '../../../', rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

router.get('/', async (_req, res) => {
  const fromDb = await prisma.tendanceMetier.findMany({ orderBy: { nbOffres: 'desc' }, take: 30 });
  if (fromDb.length) return res.json(fromDb);

  const cleaned = path.join(__dirname, '../../../data/cleaned/tendances.json');
  if (fs.existsSync(cleaned)) {
    return res.json(JSON.parse(fs.readFileSync(cleaned, 'utf8')));
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

/**
 * Démo soutenance : montre requête FT + brut vs nettoyé (pas tout le payload).
 * GET /api/tendances/pipeline-demo
 */
router.get('/pipeline-demo', (_req, res) => {
  const sample =
    readJson('Ressources/samples/offres-btp-MIS-sample.json') ||
    readJson('Ressources/samples/offres-macon-sample.json');
  const cleanedList = readJson('data/cleaned/offres-clean.json') || [];
  const tendances = readJson('data/cleaned/tendances.json') || [];

  const rawOffre = sample?.resultats?.[0] || null;
  const cleanOffre =
    (rawOffre && cleanedList.find((c: any) => c.id === rawOffre.id)) || cleanedList[0] || null;

  const champsBruts = rawOffre ? Object.keys(rawOffre) : [];
  const champsGardes = cleanOffre ? Object.keys(cleanOffre) : [];
  const champsJetés = [
    'description',
    'typeContratLibelle',
    'romeCode',
    'romeLibelle',
    'salaire (objet brut)',
    'lieuTravail (objet brut)',
    'contacts / téléphone / email (jamais stockés)',
    'logo / entreprise détail',
  ];

  res.json({
    titre: 'Pipeline France Travail → InteriMatch',
    usageDansApp: [
      'Page Tendances (agrégats métier × zone)',
      'Suggestions de compétences à la création/édition de mission',
    ],
    requeteToken: {
      method: 'POST',
      url: 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
      body: {
        grant_type: 'client_credentials',
        client_id: '***',
        client_secret: '***',
        scope: 'api_offresdemploiv2 o2dsoffre',
      },
    },
    requeteSearch: {
      method: 'GET',
      url: 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search',
      query: sample?.requete || { motsCles: 'BTP', typeContrat: 'MIS', range: '0-9' },
      headers: { Authorization: 'Bearer <token>' },
      note: 'On limite le range (ex. 0-9 / 0-49) — pas de dump massif. Sleep anti-429 dans la CLI.',
    },
    nettoyageCLI: [
      'Normalisation intitulés (accents, H/F, casse) → titreNorm',
      'Détection métier (macon, coffreur, …)',
      'Dédoublonnage par id offre',
      'Extraction zone = 2 premiers chiffres du CP',
      'Salaire estimé numérique depuis libellé texte',
      'Compétences = liste de libellés uniquement',
      'Agréats → tendances (nbOffres, salaireMed par métier/zone)',
    ],
    champsBrutsExemple: champsBruts,
    champsGardesApresClean: champsGardes,
    champsNonConserves: champsJetés,
    exempleBrut: rawOffre,
    exempleNettoye: cleanOffre,
    exempleTendances: Array.isArray(tendances) ? tendances.slice(0, 5) : tendances,
    nbOffresSample: sample?.nb ?? sample?.resultats?.length ?? null,
    nbOffresClean: Array.isArray(cleanedList) ? cleanedList.length : null,
  });
});

export default router;
