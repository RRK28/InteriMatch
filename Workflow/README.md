# Automations n8n — InteriMatch (Brevo / mails)

Aligné CDC : **mailing via Brevo** (pas Discord).

| Fichier | Déclencheur | Action |
|---|---|---|
| `n8n-notify-match.json` | Webhook API | Mail match ≥ 80 % **ou** confirmation candidature |
| `n8n-relance-missions.json` | Cron journalier | Appelle l’API → mail relance entreprise |

## Setup Brevo (≈ 10 min)

1. Compte [Brevo](https://app.brevo.com) → **SMTP & API** → créer une clé API
2. **Senders** → vérifier un email expéditeur (ex. ton adresse perso pour le POC)
3. **Ne jamais committer la clé** dans le repo Git

## Setup n8n

```bash
npx n8n
# ou n8n Cloud
```

Import des 2 JSON → Variables n8n :

| Variable | Exemple |
|---|---|
| `BREVO_API_KEY` | `xkeysib-…` (colle la clé **dans n8n**, pas dans Git) |
| `BREVO_SENDER_EMAIL` | l’email vérifié dans Brevo |
| `INTERIMATCH_API_URL` | `https://interimatch-2q0a.onrender.com` |
| `WEBHOOK_SECRET` | même valeur que Render / `.env` |

Activer le workflow notify → copier l’URL webhook production → Render :

```
N8N_WEBHOOK_URL=https://xxx.app.n8n.cloud/webhook/interimatch-notify
WEBHOOK_SECRET=change-me
```

## Démo
1. Matching entreprise (score ≥ 80) → mail Brevo
2. Candidature intérimaire → mail de confirmation
3. Relance : `POST /api/webhooks/relance-missions` puis Execute sur le workflow cron

Même sans n8n branché, l’API archive les events dans Mongo (`GET /api/matching/automations`).
