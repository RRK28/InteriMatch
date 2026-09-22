type BrevoSend = {
  to: string;
  subject: string;
  html: string;
};

/** Envoi mail transactionnel Brevo (direct depuis l’API). */
export async function sendBrevoMail({ to, subject, html }: BrevoSend): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL || 'leglitcher692@gmail.com';
  if (!apiKey || !to) return false;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'InteriMatch', email: sender },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('brevo error', res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.warn('brevo fetch failed', e);
    return false;
  }
}
