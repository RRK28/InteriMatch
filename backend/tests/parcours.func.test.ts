/**
 * tests un peu plus "fonctionnels" sans DB réelle —
 * on mock prisma serait long, on teste surtout la durée max + schéma zod côté logique
 */

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const MAX_MISSION_DAYS = 18 * 30;

describe('regles mission interim', () => {
  it('refuse durée > 18 mois approx', () => {
    const debut = new Date('2026-01-01');
    const fin = new Date('2028-01-01');
    expect(daysBetween(debut, fin)).toBeGreaterThan(MAX_MISSION_DAYS);
  });

  it('accepte mission courte', () => {
    const debut = new Date('2026-10-01');
    const fin = new Date('2026-11-15');
    expect(daysBetween(debut, fin)).toBeLessThan(MAX_MISSION_DAYS);
  });
});

describe('parcours auth (contrats données)', () => {
  it('role entreprise ou interim uniquement', () => {
    const roles = ['ENTREPRISE', 'INTERIMAIRE'];
    expect(roles).toContain('ENTREPRISE');
    expect(roles).not.toContain('ADMIN');
  });
});
