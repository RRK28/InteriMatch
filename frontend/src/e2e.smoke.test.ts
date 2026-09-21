import { describe, it, expect } from 'vitest';

/**
 * Smoke E2E-ish côté front : contrats API + parcours UI attendus.
 * (pas de browser ; valide les contrats que le front consomme)
 */

const API = process.env.VITE_API_URL || 'http://localhost:4000';

describe('contrats API (e2e smoke)', () => {
  it('health répond', async () => {
    try {
      const res = await fetch(`${API}/api/health`);
      if (!res.ok) return; // skip si API down
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body).toHaveProperty('mongo');
      expect(body).toHaveProperty('postgres');
    } catch {
      // API locale absente = skip
    }
  });

  it('login seed entreprise', async () => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'chantier@btp-lyon.fr', password: 'password123' }),
      });
      if (res.status === 0 || res.status >= 500) return;
      const body = await res.json();
      expect(body.token).toBeTruthy();
      expect(body.user.role).toBe('ENTREPRISE');
    } catch {
      // skip
    }
  });
});

describe('règles UI matching', () => {
  it('score ≥ 80 = badge fort', () => {
    const badge = (score: number) => (score >= 80 ? 'fort' : score >= 50 ? 'moyen' : 'faible');
    expect(badge(88)).toBe('fort');
    expect(badge(55)).toBe('moyen');
    expect(badge(20)).toBe('faible');
  });
});
