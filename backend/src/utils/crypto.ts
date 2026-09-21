import crypto from 'crypto';

const ALGO = 'aes-256-cbc';

function keyBuf() {
  const k = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
  return crypto.createHash('sha256').update(k).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, keyBuf(), iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  return iv.toString('hex') + ':' + enc;
}

export function decrypt(payload: string): string {
  const [ivHex, data] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGO, keyBuf(), Buffer.from(ivHex, 'hex'));
  let dec = decipher.update(data, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}
