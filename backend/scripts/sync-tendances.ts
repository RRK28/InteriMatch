import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const file = path.join(__dirname, '../../data/cleaned/tendances.json');
  if (!fs.existsSync(file)) {
    console.error('pas de data/cleaned/tendances.json — lance la CLI clean avant');
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    metier: string;
    zone: string;
    nbOffres: number;
    salaireMed: number | null;
  }[];

  for (const r of rows) {
    await prisma.tendanceMetier.upsert({
      where: { metier_zone: { metier: r.metier, zone: r.zone } },
      create: {
        metier: r.metier,
        zone: r.zone,
        nbOffres: r.nbOffres,
        salaireMed: r.salaireMed,
      },
      update: { nbOffres: r.nbOffres, salaireMed: r.salaireMed },
    });
  }
  console.log(`sync ok: ${rows.length} tendances`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
