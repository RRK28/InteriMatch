# InteriMatch

Plateforme d’intérim **BTP** : entreprises ↔ ouvriers, matching simple, tendances France Travail.

## Stack
- frontend : React + TS (Vite)
- backend : Express + TS
- Postgres (Prisma) + Mongo (logs matching)
- CLI `cli/` pour clean/import FT
- n8n dans `Workflow/`

## Lancer
```bash
docker compose up -d
cp backend/.env.example backend/.env
cd backend && npm i && npx prisma db push && npm run db:seed && npm run dev
# autre terminal
cd frontend && npm i && npm run dev
```

CLI samples :
```bash
cd cli && npm i
npm run start -- clean -i ../Ressources/samples/offres-btp-MIS-sample.json
```

API : http://localhost:4000 — front : http://localhost:5173

## Tests
```bash
cd backend && npm test
```

## Comptes seed
- `chantier@btp-lyon.fr` / `password123` (entreprise)
- `karim.macon@mail.com` / `password123` (intérimaire)

## Docs
- CDC : `Cachier-Des-Charges/`
- Étude marché : `Etudes-de-Marche/`
- Workflows : `Workflow/`
- Chiffrage : `Projet/chiffrage-reel.md`

Clés FT : `Ressources/.env.france-travail` (pas commit).
