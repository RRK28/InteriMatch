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

const INTERIMS_DEMO = [
  { email: 'amine.macon@interimatch.fr', prenom: 'Amine', nom: 'Khelifi', ville: 'Villeurbanne', codePostal: '69100', metiers: ['macon'], competences: ['coffrage', 'béton', 'fondations'], experienceAns: 5, rayonKm: 35 },
  { email: 'sofia.coffreuse@interimatch.fr', prenom: 'Sofia', nom: 'Benali', ville: 'Lyon', codePostal: '69003', metiers: ['coffreur', 'macon'], competences: ['coffrage', 'banche', 'ferraillage'], experienceAns: 3, rayonKm: 40 },
  { email: 'julien.elec@interimatch.fr', prenom: 'Julien', nom: 'Moreau', ville: 'Lyon', codePostal: '69007', metiers: ['electricien'], competences: ['courant fort', 'tableau', 'gaine'], experienceAns: 7, rayonKm: 50 },
  { email: 'nina.peintre@interimatch.fr', prenom: 'Nina', nom: 'Rossi', ville: 'Caluire-et-Cuire', codePostal: '69300', metiers: ['peintre'], competences: ['enduit', 'ponçage', 'peinture'], experienceAns: 2, rayonKm: 25 },
  { email: 'kevin.charpente@interimatch.fr', prenom: 'Kévin', nom: 'Petit', ville: 'Lyon', codePostal: '69009', metiers: ['charpentier'], competences: ['charpente', 'couverture', 'échafaudage'], experienceAns: 6, rayonKm: 45 },
  { email: 'yasmine.maconne@interimatch.fr', prenom: 'Yasmine', nom: 'Traoré', ville: 'Bron', codePostal: '69500', metiers: ['macon'], competences: ['carrelage', 'chape', 'étanchéité'], experienceAns: 4, rayonKm: 30 },
  { email: 'thomas.coffreur@interimatch.fr', prenom: 'Thomas', nom: 'Garcia', ville: 'Vénissieux', codePostal: '69200', metiers: ['coffreur'], competences: ['coffrage', 'béton', 'étayage'], experienceAns: 8, rayonKm: 55 },
  { email: 'clara.elec@interimatch.fr', prenom: 'Clara', nom: 'Nguyen', ville: 'Lyon', codePostal: '69006', metiers: ['electricien'], competences: ['VDI', 'fibre', 'baie'], experienceAns: 3, rayonKm: 35 },
  { email: 'mehdi.peintre@interimatch.fr', prenom: 'Mehdi', nom: 'Hadid', ville: 'Lyon', codePostal: '69004', metiers: ['peintre'], competences: ['façade', 'échafaudage', 'enduit'], experienceAns: 5, rayonKm: 40 },
  { email: 'lucas.macon@interimatch.fr', prenom: 'Lucas', nom: 'Bernard', ville: 'Décines-Charpieu', codePostal: '69150', metiers: ['macon'], competences: ['dallage', 'béton', 'nivellement'], experienceAns: 2, rayonKm: 60 },
  { email: 'sarah.elec@interimatch.fr', prenom: 'Sarah', nom: 'Dubois', ville: 'Écully', codePostal: '69130', metiers: ['electricien'], competences: ['dépannage', 'éclairage', 'TGBT'], experienceAns: 4, rayonKm: 30 },
  { email: 'hugo.charpentier@interimatch.fr', prenom: 'Hugo', nom: 'Lefevre', ville: 'Rillieux-la-Pape', codePostal: '69140', metiers: ['charpentier'], competences: ['ossature', 'isolation', 'bardage'], experienceAns: 5, rayonKm: 45 },
  { email: 'ines.coffreuse@interimatch.fr', prenom: 'Inès', nom: 'Martinez', ville: 'Saint-Priest', codePostal: '69800', metiers: ['coffreur', 'macon'], competences: ['coffrage', 'ferraillage', 'sécurité'], experienceAns: 3, rayonKm: 50 },
  { email: 'antoine.macon@interimatch.fr', prenom: 'Antoine', nom: 'Roux', ville: 'Tassin-la-Demi-Lune', codePostal: '69160', metiers: ['macon'], competences: ['enduit', 'projection', 'finition'], experienceAns: 6, rayonKm: 35 },
  { email: 'lea.poly@interimatch.fr', prenom: 'Léa', nom: 'Fontaine', ville: 'Lyon', codePostal: '69008', metiers: ['macon', 'peintre'], competences: ['manutention', 'béton', 'enduit'], experienceAns: 1, rayonKm: 25 },
  { email: 'omar.elec@interimatch.fr', prenom: 'Omar', nom: 'Diallo', ville: 'Villeurbanne', codePostal: '69100', metiers: ['electricien'], competences: ['armoire', 'automate', 'H0B0'], experienceAns: 9, rayonKm: 70 },
  { email: 'camille.peintre@interimatch.fr', prenom: 'Camille', nom: 'Blanc', ville: 'Lyon', codePostal: '69001', metiers: ['peintre'], competences: ['décoratif', 'ponçage', 'finition'], experienceAns: 4, rayonKm: 20 },
  { email: 'nathan.coffreur@interimatch.fr', prenom: 'Nathan', nom: 'Giraud', ville: 'Meyzieu', codePostal: '69330', metiers: ['coffreur'], competences: ['coffrage', 'courbe', 'béton'], experienceAns: 5, rayonKm: 55 },
  { email: 'aicha.maconne@interimatch.fr', prenom: 'Aïcha', nom: 'Sow', ville: 'Lyon', codePostal: '69005', metiers: ['macon'], competences: ['pierre', 'mortier', 'jointoiement'], experienceAns: 7, rayonKm: 30 },
  { email: 'paul.charpente@interimatch.fr', prenom: 'Paul', nom: 'Marchand', ville: 'Lyon', codePostal: '69002', metiers: ['charpentier', 'macon'], competences: ['soudure', 'assemblage', 'CACES'], experienceAns: 10, rayonKm: 80 },
];

/** Seed intérimaires BTP (skip si email déjà présent). */
router.post('/seed-interimaires', async (req, res) => {
  if (!assertSecret(req as any)) return res.status(401).json({ error: 'unauthorized' });

  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash('password123', 10);
  const created: { email: string; prenom: string; nom: string }[] = [];
  const skipped: string[] = [];

  const dispoDebut = new Date();
  dispoDebut.setDate(dispoDebut.getDate() - 7);
  const dispoFin = new Date();
  dispoFin.setMonth(dispoFin.getMonth() + 4);

  for (const p of INTERIMS_DEMO) {
    const exists = await prisma.user.findUnique({ where: { email: p.email } });
    if (exists) {
      skipped.push(p.email);
      continue;
    }
    await prisma.user.create({
      data: {
        email: p.email,
        passwordHash: hash,
        role: 'INTERIMAIRE',
        consentRgpd: true,
        consentAt: new Date(),
        interim: {
          create: {
            prenom: p.prenom,
            nom: p.nom,
            telephone: `06${String(10000000 + created.length * 111).slice(0, 8)}`,
            ville: p.ville,
            codePostal: p.codePostal,
            rayonKm: p.rayonKm,
            metiers: p.metiers,
            competences: p.competences,
            experienceAns: p.experienceAns,
            dispoDebut,
            dispoFin,
          },
        },
      },
    });
    created.push({ email: p.email, prenom: p.prenom, nom: p.nom });
  }

  res.status(201).json({
    ok: true,
    created: created.length,
    skipped: skipped.length,
    password: 'password123',
    interimaires: created,
  });
});

export default router;
