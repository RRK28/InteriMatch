/**
 * Parcours critiques contre l'API réelle (docker + seed).
 */
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/services/db';

let dbOk = false;
let entrepriseToken = '';
let interimToken = '';
let missionId = '';

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
    console.warn('DB indispo — tests parcours skippés');
  }
});

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
});

describe('parcours auth / mission / matching', () => {
  it('health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('login entreprise', async () => {
    if (!dbOk) return;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'chantier@btp-lyon.fr', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    entrepriseToken = res.body.token;
  });

  it('login interim', async () => {
    if (!dbOk) return;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'karim.macon@mail.com', password: 'password123' });
    expect(res.status).toBe(200);
    interimToken = res.body.token;
  });

  it('refuse mauvais mdp', async () => {
    if (!dbOk) return;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'chantier@btp-lyon.fr', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('listing missions ouvertes public', async () => {
    if (!dbOk) return;
    const res = await request(app).get('/api/missions?status=OUVERTE');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    missionId = res.body.find((m: any) => m.metier === 'macon')?.id || res.body[0].id;
  });

  it('détail public sans fuite candidatures', async () => {
    if (!dbOk) return;
    const res = await request(app).get(`/api/missions/${missionId}`);
    expect(res.status).toBe(200);
    expect(res.body.candidatures).toBeUndefined();
    expect(res.body.nbCandidatures).toBeDefined();
  });

  it('entreprise voit les candidatures', async () => {
    if (!dbOk) return;
    const res = await request(app)
      .get(`/api/missions/${missionId}`)
      .set('Authorization', `Bearer ${entrepriseToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.candidatures)).toBe(true);
  });

  it('matching for-me pour interim', async () => {
    if (!dbOk) return;
    const res = await request(app)
      .get('/api/matching/for-me')
      .set('Authorization', `Bearer ${interimToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('création mission entreprise', async () => {
    if (!dbOk) return;
    const debut = new Date();
    debut.setDate(debut.getDate() + 7);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 21);
    const res = await request(app)
      .post('/api/missions')
      .set('Authorization', `Bearer ${entrepriseToken}`)
      .send({
        titre: 'Test auto maçon',
        description: 'mission test jest',
        metier: 'macon',
        competences: ['coffrage'],
        ville: 'Lyon',
        codePostal: '69003',
        dateDebut: debut.toISOString().slice(0, 10),
        dateFin: fin.toISOString().slice(0, 10),
        remuneration: 15,
      });
    expect(res.status).toBe(201);
    expect(res.body.epiObligatoires?.length).toBeGreaterThan(0);
  });
});
