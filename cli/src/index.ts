#!/usr/bin/env node
/**
 * CLI InteriMatch — import / clean offres France Travail (BTP / MIS)
 * usage:
 *   npm run start -- clean -i ../Ressources/samples/offres-btp-MIS-sample.json
 *   npm run start -- fetch --mots macon --mis
 */
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../Ressources/.env.france-travail') });
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const program = new Command();
program.name('im-ft').description('import & clean France Travail pour InteriMatch');

const METIER_MAP: Record<string, string> = {
  macon: 'macon',
  maçon: 'macon',
  'macon traditionnel': 'macon',
  coffreur: 'coffreur',
  bancheur: 'coffreur',
  electricien: 'electricien',
  peintre: 'peintre',
  charpentier: 'charpentier',
  manoeuvre: 'manoeuvre',
};

function normTitle(t: string) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(h\/f\)/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectMetier(intitule: string, romeLibelle?: string): string {
  const blob = normTitle(`${intitule} ${romeLibelle || ''}`);
  for (const [k, v] of Object.entries(METIER_MAP)) {
    if (blob.includes(normTitle(k))) return v;
  }
  return 'autre';
}

function parseSalaire(libelle?: string): number | null {
  if (!libelle) return null;
  const nums = libelle.match(/(\d+[.,]?\d*)/g);
  if (!nums || !nums.length) return null;
  const vals = nums.map((n) => parseFloat(n.replace(',', '.')));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

type RawOffre = {
  id: string;
  intitule: string;
  typeContrat?: string;
  lieuTravail?: { libelle?: string; codePostal?: string };
  romeLibelle?: string;
  salaire?: { libelle?: string };
  competences?: { libelle: string }[];
  dateCreation?: string;
};

export function cleanOffres(raw: RawOffre[]) {
  const seen = new Set<string>();
  const cleaned = [];

  for (const o of raw) {
    if (!o.id || seen.has(o.id)) continue;
    seen.add(o.id);

    const cp = o.lieuTravail?.codePostal || '';
    const zone = cp.slice(0, 2) || '??';
    const metier = detectMetier(o.intitule, o.romeLibelle);

    cleaned.push({
      id: o.id,
      titre: o.intitule.trim(),
      titreNorm: normTitle(o.intitule),
      metier,
      typeContrat: o.typeContrat || null,
      ville: o.lieuTravail?.libelle || null,
      codePostal: cp || null,
      zone,
      salaireEstime: parseSalaire(o.salaire?.libelle),
      competences: (o.competences || []).map((c) => c.libelle),
      dateCreation: o.dateCreation || null,
    });
  }

  return cleaned;
}

export function buildTendances(cleaned: ReturnType<typeof cleanOffres>) {
  const map = new Map<string, { metier: string; zone: string; nbOffres: number; salaires: number[] }>();

  for (const o of cleaned) {
    if (o.metier === 'autre') continue;
    const key = `${o.metier}|${o.zone}`;
    if (!map.has(key)) map.set(key, { metier: o.metier, zone: o.zone, nbOffres: 0, salaires: [] });
    const row = map.get(key)!;
    row.nbOffres++;
    if (o.salaireEstime) row.salaires.push(o.salaireEstime);
  }

  return [...map.values()]
    .map((r) => ({
      metier: r.metier,
      zone: r.zone,
      nbOffres: r.nbOffres,
      salaireMed: r.salaires.length
        ? Math.round((r.salaires.reduce((a, b) => a + b, 0) / r.salaires.length) * 100) / 100
        : null,
    }))
    .sort((a, b) => b.nbOffres - a.nbOffres);
}

program
  .command('clean')
  .requiredOption('-i, --input <file>', 'json sample FT')
  .option('-o, --out <dir>', 'output dir', path.join(__dirname, '../../data/cleaned'))
  .action((opts) => {
    const raw = JSON.parse(fs.readFileSync(opts.input, 'utf8'));
    const resultats: RawOffre[] = raw.resultats || raw;
    const cleaned = cleanOffres(resultats);
    const tendances = buildTendances(cleaned);

    fs.mkdirSync(opts.out, { recursive: true });
    fs.writeFileSync(path.join(opts.out, 'offres-clean.json'), JSON.stringify(cleaned, null, 2));
    fs.writeFileSync(path.join(opts.out, 'tendances.json'), JSON.stringify(tendances, null, 2));
    console.log(`ok: ${cleaned.length} offres, ${tendances.length} tendances -> ${opts.out}`);
  });

program
  .command('fetch')
  .option('--mots <kw>', 'mots clés', 'BTP')
  .option('--mis', 'filtre typeContrat=MIS')
  .option('-o, --out <file>', 'fichier brut')
  .action(async (opts) => {
    const clientId = process.env.FT_CLIENT_ID;
    const clientSecret = process.env.FT_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error('manque FT_CLIENT_ID / FT_CLIENT_SECRET (voir Ressources/.env.france-travail)');
      process.exit(1);
    }

    const tokenRes = await fetch(
      'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'api_offresdemploiv2 o2dsoffre',
        }),
      }
    );
    if (!tokenRes.ok) {
      console.error('token fail', await tokenRes.text());
      process.exit(1);
    }
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    // sleep anti 429
    await new Promise((r) => setTimeout(r, 800));

    const params = new URLSearchParams({ motsCles: opts.mots, range: '0-9' });
    if (opts.mis) params.set('typeContrat', 'MIS');

    const searchRes = await fetch(
      `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!searchRes.ok) {
      console.error('search fail', searchRes.status, await searchRes.text());
      process.exit(1);
    }
    const data = await searchRes.json();
    const out =
      opts.out ||
      path.join(__dirname, '../../data/raw', `ft-${opts.mots.replace(/\s+/g, '-')}.json`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(data, null, 2));
    console.log('écrit', out);
  });

program.parse();
