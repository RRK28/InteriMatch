# Déploiement Render (soutenance)

## État actuel
- ✅ Fichiers prêts (`render.yaml`, scripts build/start)
- ✅ Postgres free **interimatch-db** créé (expire ~21/10/2026)
- ⏳ Web Service : Render doit d’abord accéder au repo GitHub Epitech

## Étape critique — connecter GitHub à Render

1. Ouvre https://dashboard.render.com/account/github  
   (ou **Account Settings → Connected Accounts → GitHub**)
2. **Connect / Configure** GitHub
3. Autorise l’org **`EpitechMscProPromo2027`** (sinon repo invisible)
4. Si l’org a du **SAML SSO** : sur GitHub → Settings → Applications → Render → **Authorize** pour l’org

## Créer le Web Service

### Option A — Blueprint (simple)
1. https://dashboard.render.com/blueprints/new  
2. Choisis le repo `D-WEB-901-LYN-9-1-InteriMatch-4`  
3. Valide `render.yaml`  
   - Si Postgres existe déjà, Render peut proposer de le réutiliser / skip la 2e DB

### Option B — Web Service manuel
1. **New → Web Service** → repo InteriMatch  
2. Réglages :
   - Runtime : **Node**
   - Region : **Frankfurt**
   - Plan : **Free**
   - Build : `bash scripts/render-build.sh`
   - Start : `bash scripts/render-start.sh`
   - Health check : `/api/health`
3. Env vars :
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = Internal Database URL de **interimatch-db**  
     (Dashboard → interimatch-db → Connections → **Internal Database URL**)
   - `JWT_SECRET` = generate
   - `ENCRYPTION_KEY` = generate (n’importe quelle longue string)

Dashboard Postgres : https://dashboard.render.com/d/dpg-daoenibtqb8s73f1t0h0-a

## Après le 1er deploy
URL du type `https://interimatch-xxxx.onrender.com`

Comptes seed :
- `chantier@btp-lyon.fr` / `password123`
- `karim.macon@mail.com` / `password123`

## Avant la soutenance
Ouvre l’URL **2–3 min avant** (cold start free ~30–60s).

## Mongo (optionnel)
Sans `MONGO_URL` l’app marche (logs matching skippés). Atlas free si besoin.

## Sécurité
Si tu as collé une **API key Render** dans le chat → **révoque-la** et régénère :  
https://dashboard.render.com/u/settings#api-keys
