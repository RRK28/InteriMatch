import { encrypt, decrypt } from '../src/utils/crypto';

describe('crypto', () => {
  it('roundtrip', () => {
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
    const raw = 'FR7612345678901234567890123';
    const enc = encrypt(raw);
    expect(enc).not.toBe(raw);
    expect(decrypt(enc)).toBe(raw);
  });
});
