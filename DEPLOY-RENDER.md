# Déploiement Render (soutenance)

Stack déployée : **1 Web Service** (API Express + front React) + **Postgres free** Render.  
Mongo est optionnel (Atlas) — sans Mongo l’app marche, juste pas de logs matching.

## Prérequis
1. Compte [Render](https://render.com) (GitHub lié au même compte que le repo Epitech si possible)
2. Accès au repo `D-WEB-901-LYN-9-1-InteriMatch-4`
3. ~5–10 min

## Déploiement Blueprint (recommandé)

1. Va sur https://dashboard.render.com  
2. **New → Blueprint**  
3. Connecte le repo `EpitechMscProPromo2027/D-WEB-901-LYN-9-1-InteriMatch-4`  
4. Render lit `render.yaml` → crée Postgres free + Web Service free  
5. **Apply** et attends le build (~3–5 min)

URL du type : `https://interimatch-xxxx.onrender.com`

## Après le 1er deploy — seed des comptes démo

Dans le dashboard Render → service **interimatch** → **Shell** (ou un one-off) :

```bash
cd backend && npx tsx prisma/seed.ts
```

Puis (optionnel) tendances FT :

```bash
cd backend && npx tsx scripts/sync-tendances.ts
```

Comptes :
- `chantier@btp-lyon.fr` / `password123`
- `karim.macon@mail.com` / `password123`

## Variables d’env utiles

| Variable | Obligatoire | Notes |
|---|---|---|
| `DATABASE_URL` | oui | auto via Blueprint |
| `JWT_SECRET` | oui | auto généré |
| `ENCRYPTION_KEY` | oui | auto généré (32+ chars) |
| `SERVE_FRONTEND` | oui | `1` |
| `MONGO_URL` | non | Atlas → `mongodb+srv://...` |
| `N8N_WEBHOOK_URL` | non | si tu branches n8n |

Si `ENCRYPTION_KEY` généré par Render est trop long/court, mets manuellement 32 caractères ex. :
`0123456789abcdef0123456789abcdef`

## MongoDB Atlas (optionnel, 2 min)

1. https://cloud.mongodb.com → cluster free M0  
2. Database Access → user/mdp  
3. Network Access → `0.0.0.0/0` (démo only)  
4. Connect → copier l’URI dans `MONGO_URL` sur Render → Redeploy

## Jour de la soutenance

Le free tier **s’endort après ~15 min** sans trafic.  
**Ouvre l’URL 1–2 minutes avant** le pitch (cold start ~30–60 s).

Check rapide :
- `https://TON-URL/api/health` → `{"ok":true}`
- Login entreprise → dashboard avec missions

## Déploiement manuel (sans Blueprint)

1. **New → PostgreSQL** → Free → créer  
2. **New → Web Service** → repo GitHub  
   - Runtime : Node  
   - Build : `chmod +x build.sh && ./build.sh`  
   - Start : `cd backend && npx prisma db push && node dist/src/index.js`  
   - Plan : Free  
3. Env : coller `DATABASE_URL` depuis la DB + `SERVE_FRONTEND=1` + secrets

## Limites free (à dire si on te demande)

- Web : sleep après inactivité, ~750 h/mois  
- Postgres free : **expire à 30 jours** (ok pour une soutenance)  
- Pas de disque persistant sur le web service

## Local vs prod

En local tu gardes Docker. En prod : une seule URL sert le front et `/api/*`.
