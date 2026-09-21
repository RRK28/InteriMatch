# Déploiement Render (soutenance)

## Prérequis
- Compte Render
- Repo GitHub déjà poussé (`main`)
- (optionnel) Mongo Atlas si tu veux les logs matching

## Déploiement Blueprint (recommandé)

1. Va sur https://dashboard.render.com/blueprints
2. **New Blueprint Instance**
3. Connecte le repo `D-WEB-901-LYN-9-1-InteriMatch-4`
4. Render lit `render.yaml` → crée Postgres free + Web Service free
5. Deploy

URL finale du type : `https://interimatch-xxxx.onrender.com`

## Comptes démo (après 1er deploy / seed)
- `chantier@btp-lyon.fr` / `password123`
- `karim.macon@mail.com` / `password123`

## Avant la soutenance
Le free tier **s’endort** après ~15 min. Ouvre l’URL **2–3 min avant** pour réveiller le service.

## Mongo (optionnel)
1. Crée un cluster free sur https://cloud.mongodb.com
2. Dans Render → service → Environment → `MONGO_URL` = connection string Atlas

Sans Mongo, l’app tourne quand même (logs matching skippés).

## Limites free
- Postgres free : ~30 jours puis expire
- Web free : cold start ~30–60s
- 750 h instance / mois

## Fichiers utiles
- `render.yaml` — blueprint
- `scripts/render-build.sh` — install + build front/back + prisma + seed
- `scripts/render-start.sh` — démarre l’API (sert aussi le front buildé)
