import { AutomationEvent, isMongoReady } from './mongo';
import { sendBrevoMail } from './brevo';

export type N8nPayload =
  | {
      type: 'high_match';
      mission: string;
      missionId?: string;
      matches: { email: string; score: number }[];
    }
  | {
      type: 'candidature';
      email: string;
      mission: string;
      missionId?: string;
      score: number;
    }
  | {
      type: 'relance';
      email: string;
      mission: string;
      missionId?: string;
      count: number;
      score?: number;
    };

function mailFromPayload(payload: N8nPayload): { to: string; subject: string; html: string } | null {
  if (payload.type === 'high_match') {
    const to = payload.matches[0]?.email;
    if (!to) return null;
    return {
      to,
      subject: `Nouveau match > 80% — ${payload.mission}`,
      html: `<p>Bonjour,</p><p>Une mission <strong>${payload.mission}</strong> correspond à ton profil (score ≥ 80%).</p><p>Connecte-toi sur InteriMatch.</p>`,
    };
  }
  if (payload.type === 'relance') {
    return {
      to: payload.email,
      subject: 'Relance — mission encore ouverte sur InteriMatch',
      html: `<p>Bonjour,</p><p>Tu as des missions encore ouvertes : <strong>${payload.mission}</strong>.</p><p>Connecte-toi sur InteriMatch pour les mettre à jour.</p>`,
    };
  }
  return {
    to: payload.email,
    subject: `Candidature reçue — ${payload.mission}`,
    html: `<p>Bonjour,</p><p>Candidature pour <strong>${payload.mission}</strong> enregistrée (score ${payload.score}/100).</p>`,
  };
}

/** Archive Mongo + mail Brevo direct (bon destinataire) + webhook n8n (démo automation). */
export async function notifyN8n(payload: N8nPayload): Promise<{ brevo: boolean; n8n: boolean }> {
  let brevoOk = false;
  let n8nOk = false;

  const mail = mailFromPayload(payload);
  if (mail) {
    brevoOk = await sendBrevoMail(mail);
  }

  const url = process.env.N8N_WEBHOOK_URL;
  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      n8nOk = res.ok;
    } catch {
      n8nOk = false;
    }
  }

  if (isMongoReady()) {
    try {
      await AutomationEvent.create({
        type: payload.type,
        payload: { ...payload, brevoTo: mail?.to, brevoOk, n8nOk },
        deliveredToN8n: n8nOk,
      });
    } catch {
      // ignore
    }
  }

  return { brevo: brevoOk, n8n: n8nOk };
}
