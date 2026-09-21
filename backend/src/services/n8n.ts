import { AutomationEvent, isMongoReady } from './mongo';

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
    };

/** Envoie vers n8n si configuré + archive l'événement dans Mongo (preuve soutenance). */
export async function notifyN8n(payload: N8nPayload): Promise<void> {
  if (isMongoReady()) {
    try {
      await AutomationEvent.create({
        type: payload.type,
        payload,
        deliveredToN8n: Boolean(process.env.N8N_WEBHOOK_URL),
      });
    } catch {
      // mongo down = ignore
    }
  }

  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // n8n down = ignore (best effort)
  }
}
