import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.candidature.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.tendanceMetier.deleteMany();
  await prisma.interimProfile.deleteMany();
  await prisma.entrepriseProfile.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  const entreprise = await prisma.user.create({
    data: {
      email: 'chantier@btp-lyon.fr',
      passwordHash: hash,
      role: 'ENTREPRISE',
      consentRgpd: true,
      consentAt: new Date(),
      entreprise: {
        create: {
          raisonSociale: 'BTP Lyon Constructions',
          siret: '12345678900012',
          ville: 'Lyon',
          codePostal: '69003',
          description: 'Gros œuvre et rénovation',
        },
      },
    },
  });

  const interim1 = await prisma.user.create({
    data: {
      email: 'karim.macon@mail.com',
      passwordHash: hash,
      role: 'INTERIMAIRE',
      consentRgpd: true,
      consentAt: new Date(),
      interim: {
        create: {
          prenom: 'Karim',
          nom: 'Benali',
          ville: 'Villeurbanne',
          codePostal: '69100',
          metiers: ['macon', 'coffreur'],
          competences: ['coffrage', 'béton', 'fondations'],
          experienceAns: 4,
          dispoDebut: new Date('2026-09-20'),
          dispoFin: new Date('2026-12-31'),
        },
      },
    },
  });

  const interim2 = await prisma.user.create({
    data: {
      email: 'lea.peintre@mail.com',
      passwordHash: hash,
      role: 'INTERIMAIRE',
      consentRgpd: true,
      consentAt: new Date(),
      interim: {
        create: {
          prenom: 'Léa',
          nom: 'Martin',
          ville: 'Lyon',
          codePostal: '69007',
          metiers: ['peintre'],
          competences: ['enduit', 'ponçage'],
          experienceAns: 2,
          dispoDebut: new Date('2026-09-15'),
          dispoFin: new Date('2026-11-30'),
        },
      },
    },
  });

  await prisma.mission.create({
    data: {
      entrepriseId: entreprise.id,
      titre: 'Maçon coffreur — chantier Part-Dieu',
      description: 'Coffrage banche et coulage dalle R+2. EPI fournis sur place, mutualisation outil possible.',
      metier: 'macon',
      competences: ['coffrage', 'béton'],
      ville: 'Lyon',
      codePostal: '69003',
      dateDebut: new Date('2026-10-01'),
      dateFin: new Date('2026-11-15'),
      remuneration: 15.5,
      epiObligatoires: ['casque', 'chaussures de sécurité', 'gants', 'lunettes'],
      status: 'OUVERTE',
    },
  });

  await prisma.mission.create({
    data: {
      entrepriseId: entreprise.id,
      titre: 'Peintre intérieur — rénovation T4',
      description: 'Enduit + 2 couches. Mutualisation échafaudage avec autre équipe.',
      metier: 'peintre',
      competences: ['enduit', 'finition'],
      ville: 'Lyon',
      codePostal: '69007',
      dateDebut: new Date('2026-09-25'),
      dateFin: new Date('2026-10-10'),
      remuneration: 14,
      epiObligatoires: ['masque', 'gants', 'chaussures de sécurité'],
      status: 'OUVERTE',
    },
  });

  await prisma.tendanceMetier.createMany({
    data: [
      { metier: 'macon', zone: '69', nbOffres: 420, salaireMed: 14.5 },
      { metier: 'coffreur', zone: '69', nbOffres: 180, salaireMed: 15.2 },
      { metier: 'electricien', zone: '69', nbOffres: 95, salaireMed: 16 },
      { metier: 'macon', zone: '38', nbOffres: 210, salaireMed: 14.2 },
      { metier: 'peintre', zone: '69', nbOffres: 70, salaireMed: 13.8 },
    ],
  });

  console.log('seed ok');
  console.log('comptes: chantier@btp-lyon.fr / karim.macon@mail.com / lea.peintre@mail.com — password123');
  void interim1;
  void interim2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
