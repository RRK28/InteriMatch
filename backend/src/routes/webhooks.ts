import { Router } from 'express';
import { prisma } from '../services/db';
import { EPI_PAR_METIER } from './profiles';

const router = Router();

function assertSecret(req: { headers: Record<string, unknown> }) {
  const secret = req.headers['x-webhook-secret'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return false;
  }
  return true;
}

// endpoint appelé par n8n pour relancer les missions ouvertes trop longtemps
router.post('/relance-missions', async (req, res) => {
  if (!assertSecret(req as any)) return res.status(401).json({ error: 'unauthorized' });

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

const OFFRES_DEMO = [
  { titre: 'Maçon gros œuvre — immeuble Part-Dieu', metier: 'macon', competences: ['coffrage', 'béton', 'fondations'], ville: 'Lyon', codePostal: '69003', remuneration: 16.5, description: 'Coulage et élévation de voiles béton sur chantier neuf.' },
  { titre: 'Coffreur-bancheur — résidence Guillotière', metier: 'coffreur', competences: ['coffrage', 'banche', 'ferraillage'], ville: 'Lyon', codePostal: '69007', remuneration: 17, description: 'Mise en place de banches et ferraillage R+4.' },
  { titre: 'Électricien bâtiment — rénovation T4', metier: 'electricien', competences: ['courant fort', 'tableau', 'gaine'], ville: 'Villeurbanne', codePostal: '69100', remuneration: 18, description: 'Remise aux normes électriques d’un immeuble années 70.' },
  { titre: 'Peintre intérieur — bureaux Gerland', metier: 'peintre', competences: ['enduit', 'ponçage', 'peinture'], ville: 'Lyon', codePostal: '69007', remuneration: 14.5, description: 'Préparation et application peinture acrylique open-space.' },
  { titre: 'Charpentier — toiture Vaise', metier: 'charpentier', competences: ['charpente', 'couverture', 'échafaudage'], ville: 'Lyon', codePostal: '69009', remuneration: 18.5, description: 'Remplacement de fermettes et liteaunage.' },
  { titre: 'Manœuvre polyvalent — chantier Confluence', metier: 'macon', competences: ['manutention', 'béton', 'nettoyage'], ville: 'Lyon', codePostal: '69002', remuneration: 13.5, description: 'Aide au coffrage, approvisionnement et rangement chantier.' },
  { titre: 'Maçon carreleur — villa Caluire', metier: 'macon', competences: ['carrelage', 'chape', 'étanchéité'], ville: 'Caluire-et-Cuire', codePostal: '69300', remuneration: 16, description: 'Pose carrelage grand format RDC + SDB.' },
  { titre: 'Coffreur — parking sous-sol Bron', metier: 'coffreur', competences: ['coffrage', 'béton', 'étayage'], ville: 'Bron', codePostal: '69500', remuneration: 16.8, description: 'Coffrage de longrines et dalles de parking.' },
  { titre: 'Électricien courant faible — tertiaire', metier: 'electricien', competences: ['VDI', 'fibre', 'baie'], ville: 'Lyon', codePostal: '69006', remuneration: 17.5, description: 'Tirage câbles et raccordement baies informatiques.' },
  { titre: 'Peintre façade — immeuble Croix-Rousse', metier: 'peintre', competences: ['façade', 'échafaudage', 'enduit'], ville: 'Lyon', codePostal: '69004', remuneration: 15.5, description: 'Ravalement et peinture façade R+3.' },
  { titre: 'Maçon pierre — rénovation patrimoine', metier: 'macon', competences: ['pierre', 'mortier', 'jointoiement'], ville: 'Lyon', codePostal: '69005', remuneration: 17.2, description: 'Reprise de joints et consolidation mur pierre.' },
  { titre: 'Coffreur-boiseur — pont Rhône', metier: 'coffreur', competences: ['coffrage', 'bois', 'sécurité'], ville: 'Lyon', codePostal: '69008', remuneration: 19, description: 'Coffrages spéciaux ouvrage d’art (habilitation hauteur).' },
  { titre: 'Électricien industriel — atelier Vénissieux', metier: 'electricien', competences: ['armoire', 'automate', 'H0B0'], ville: 'Vénissieux', codePostal: '69200', remuneration: 19.5, description: 'Câblage armoires et mise en service ligne production.' },
  { titre: 'Peintre décorateur — loft Presqu’île', metier: 'peintre', competences: ['enduit', 'décoratif', 'ponçage'], ville: 'Lyon', codePostal: '69001', remuneration: 15, description: 'Finitions haut de gamme murs et plafonds.' },
  { titre: 'Charpentier métallique — hangar Décines', metier: 'charpentier', competences: ['soudure', 'assemblage', 'CACES'], ville: 'Décines-Charpieu', codePostal: '69150', remuneration: 18, description: 'Assemblage structure métallique et boulonnage.' },
  { titre: 'Maçon — dallage commercial Meyzieu', metier: 'macon', competences: ['dallage', 'béton', 'nivellement'], ville: 'Meyzieu', codePostal: '69330', remuneration: 15.8, description: 'Coulage et finition dalle 800 m².' },
  { titre: 'Coffreur — cages d’ascenseur Saint-Priest', metier: 'coffreur', competences: ['coffrage', 'ferraillage', 'vertical'], ville: 'Saint-Priest', codePostal: '69800', remuneration: 17.4, description: 'Coffrage vertical cages et noyaux.' },
  { titre: 'Électricien chantier — hôtel Part-Dieu', metier: 'electricien', competences: ['éclairage', 'prises', 'norme NF C'], ville: 'Lyon', codePostal: '69003', remuneration: 17, description: 'Second œuvre électrique chambres et parties communes.' },
  { titre: 'Peintre — parkings et sous-sols', metier: 'peintre', competences: ['sol', 'marquage', 'résine'], ville: 'Villeurbanne', codePostal: '69100', remuneration: 14, description: 'Application résine et marquages au sol.' },
  { titre: 'Maçon démolition contrôlée — réhab', metier: 'macon', competences: ['démolition', 'sciage', 'évacuation'], ville: 'Lyon', codePostal: '69008', remuneration: 16.2, description: 'Ouvertures de baies et évacuation gravats triés.' },
  { titre: 'Coffreur — voiles courbes Gerland', metier: 'coffreur', competences: ['coffrage', 'courbe', 'béton'], ville: 'Lyon', codePostal: '69007', remuneration: 18.2, description: 'Coffrages non standards pour voiles architecturaux.' },
  { titre: 'Électricien maintenance — campus', metier: 'electricien', competences: ['dépannage', 'éclairage', 'TGBT'], ville: 'Écully', codePostal: '69130', remuneration: 16.5, description: 'Astreinte dépannage et petits travaux électriques.' },
  { titre: 'Charpentier — ossature bois Rillieux', metier: 'charpentier', competences: ['ossature', 'isolation', 'bardage'], ville: 'Rillieux-la-Pape', codePostal: '69140', remuneration: 17.8, description: 'Levage et assemblage murs ossature bois.' },
  { titre: 'Maçon enduiseur — lotissement Ouest', metier: 'macon', competences: ['enduit', 'projection', 'finition'], ville: 'Tassin-la-Demi-Lune', codePostal: '69160', remuneration: 15.2, description: 'Enduits monocouche façades maisons individuelles.' },
];

/** Seed one-shot : crée plein de missions pour un compte entreprise (SSO ok). */
router.post('/seed-missions', async (req, res) => {
  if (!assertSecret(req as any)) return res.status(401).json({ error: 'unauthorized' });

  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'email requis' });

  let user = await prisma.user.findUnique({
    where: { email },
    include: { entreprise: true },
  });
  if (!user) return res.status(404).json({ error: 'utilisateur introuvable' });

  if (user.role !== 'ENTREPRISE') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ENTREPRISE' },
      include: { entreprise: true },
    });
  }

  if (!user.entreprise) {
    await prisma.entrepriseProfile.create({
      data: {
        userId: user.id,
        raisonSociale: 'InteriMatch BTP — compte démo',
        siret: '00000000000000',
        ville: 'Lyon',
        codePostal: '69003',
        description: 'Entreprise BTP (compte SSO)',
      },
    });
  }

  const created = [];
  for (let i = 0; i < OFFRES_DEMO.length; i++) {
    const o = OFFRES_DEMO[i];
    const debut = new Date();
    debut.setDate(debut.getDate() + 5 + (i % 10) * 3);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 21 + (i % 5) * 7);
    const metierKey = o.metier.toLowerCase();
    const mission = await prisma.mission.create({
      data: {
        entrepriseId: user.id,
        titre: o.titre,
        description: o.description,
        metier: metierKey,
        competences: o.competences,
        ville: o.ville,
        codePostal: o.codePostal,
        dateDebut: debut,
        dateFin: fin,
        remuneration: o.remuneration,
        epiObligatoires: EPI_PAR_METIER[metierKey] || EPI_PAR_METIER.default,
        status: 'OUVERTE',
      },
    });
    created.push({ id: mission.id, titre: mission.titre });
  }

  res.status(201).json({
    ok: true,
    email,
    count: created.length,
    missions: created,
  });
});

export default router;
