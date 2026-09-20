import { scoreMatch } from '../src/services/matching';

describe('scoreMatch', () => {
  const mission = {
    metier: 'macon',
    competences: ['coffrage', 'béton'],
    ville: 'Lyon',
    codePostal: '69003',
    dateDebut: new Date('2026-10-01'),
    dateFin: new Date('2026-11-01'),
  };

  it('score haut si profil aligné', () => {
    const r = scoreMatch(mission, {
      metiers: ['macon', 'coffreur'],
      competences: ['coffrage', 'béton', 'fondations'],
      ville: 'Villeurbanne',
      codePostal: '69100',
      dispoDebut: new Date('2026-09-01'),
      dispoFin: new Date('2026-12-01'),
    });
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it('score bas si mauvais métier', () => {
    const r = scoreMatch(mission, {
      metiers: ['peintre'],
      competences: ['enduit'],
      ville: 'Paris',
      codePostal: '75001',
    });
    expect(r.score).toBeLessThan(50);
  });

  it('normalise accents', () => {
    const r = scoreMatch(
      { ...mission, metier: 'maçon' },
      { metiers: ['macon'], competences: ['coffrage', 'béton'], codePostal: '69003' }
    );
    expect(r.details.metier).toBe(40);
  });
});
