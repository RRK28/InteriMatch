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

## Mongo (requis pour logs matching + preuve n8n)

### Local
`docker compose up -d` → `MONGO_URL=mongodb://localhost:27017/interimatch`

### Prod (Atlas free — 5 min)
1. https://cloud.mongodb.com → **Build a Database** → **M0 Free** → région proche (Frankfurt)
2. Database Access → user `interimatch` + mot de passe
3. Network Access → **Allow Access from Anywhere** `0.0.0.0/0` (Render free n’a pas d’IP fixe)
4. Connect → Drivers → copie l’URI :
   `mongodb+srv://interimatch:MOTDEPASSE@cluster0.xxxxx.mongodb.net/interimatch?retryWrites=true&w=majority`
5. Render → Environment → `MONGO_URL` = cette URI → **Manual Deploy**

Vérif : `GET /api/health` → `"mongo": true`  
Démo logs : login entreprise puis `GET /api/matching/logs` et `GET /api/matching/automations`

## n8n
Voir `Workflow/README.md` (mails **Brevo**, comme le CDC). Sur Render : `N8N_WEBHOOK_URL` + `WEBHOOK_SECRET`.
La clé Brevo se configure **dans n8n** (`BREVO_API_KEY`), jamais dans le repo Git.

## OAuth Google / Microsoft (Passport)

Sans ces variables, les boutons SSO restent masqués (auth email/mdp OK).

### Google
1. https://console.cloud.google.com/apis/credentials → Create OAuth client (Web)
2. Authorized redirect URIs :
   - `http://localhost:4000/api/auth/google/callback`
   - `https://TON-APP.onrender.com/api/auth/google/callback`
3. Env Render :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL` = `https://TON-APP.onrender.com/api/auth/google/callback`

### Microsoft
1. https://portal.azure.com → App registrations → New registration
2. Redirect URI (Web) :
   - `http://localhost:4000/api/auth/microsoft/callback`
   - `https://TON-APP.onrender.com/api/auth/microsoft/callback`
3. Certificates & secrets → New client secret
4. API permissions : Microsoft Graph `User.Read` (+ admin consent si besoin)
5. Env Render :
   - `MICROSOFT_CLIENT_ID` (Application ID)
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_CALLBACK_URL` = `https://TON-APP.onrender.com/api/auth/microsoft/callback`

- Sur login/register : choisir le rôle (intérimaire / entreprise) puis Google ou Microsoft.

## Démo FT (soutenance)
Sur la page **Tendances** :
- 5 clics rapides sur le titre **ou**
- petit point quasi invisible en bas à droite

→ panneau requête / brut / nettoyé / champs gardés vs jetés.
