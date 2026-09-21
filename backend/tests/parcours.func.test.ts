/**
 * Parcours critiques contre l'API réelle (docker + seed).
 */
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/services/db';
import { connectMongo, isMongoReady } from '../src/services/mongo';
import mongoose from 'mongoose';

let dbOk = false;
let mongoOk = false;
let entrepriseToken = '';
let interimToken = '';
let missionId = '';
let createdMissionId = '';

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
    console.warn('DB indispo — tests parcours skippés');
  }

  try {
    await connectMongo();
    mongoOk = isMongoReady();
  } catch {
    mongoOk = false;
    console.warn('Mongo indispo — logs matching skippés');
  }
});

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
  await mongoose.disconnect().catch(() => {});
});

describe('parcours auth / mission / matching', () => {
  it('health expose postgres / mongo / n8n', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.postgres).toBe('boolean');
    expect(typeof res.body.mongo).toBe('boolean');
    expect(typeof res.body.n8nConfigured).toBe('boolean');
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
    missionId = res.body.find((m: { metier: string }) => m.metier === 'macon')?.id || res.body[0].id;
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

  it('matching mission + logs mongo', async () => {
    if (!dbOk) return;
    const res = await request(app)
      .get(`/api/matching/mission/${missionId}`)
      .set('Authorization', `Bearer ${entrepriseToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('score');

    if (!mongoOk) return;
    const logs = await request(app)
      .get('/api/matching/logs')
      .set('Authorization', `Bearer ${entrepriseToken}`);
    expect(logs.status).toBe(200);
    expect(logs.body.count).toBeGreaterThan(0);

    const autos = await request(app)
      .get('/api/matching/automations')
      .set('Authorization', `Bearer ${entrepriseToken}`);
    expect(autos.status).toBe(200);
    // high_match seulement si un score ≥ 80
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
    createdMissionId = res.body.id;
  });

  it('candidature interim déclenche automation', async () => {
    if (!dbOk || !createdMissionId) return;
    const res = await request(app)
      .post(`/api/missions/${createdMissionId}/candidater`)
      .set('Authorization', `Bearer ${interimToken}`)
      .send({ message: 'dispo immédiatement' });
    expect([201, 409]).toContain(res.status);

    if (!mongoOk || res.status !== 201) return;
    const autos = await request(app)
      .get('/api/matching/automations')
      .set('Authorization', `Bearer ${entrepriseToken}`);
    expect(autos.status).toBe(200);
    const types = (autos.body.events || []).map((e: { type: string }) => e.type);
    expect(types).toContain('candidature');
  });

  it('webhook relance missions', async () => {
    if (!dbOk) return;
    const res = await request(app)
      .post('/api/webhooks/relance-missions')
      .set('x-webhook-secret', process.env.WEBHOOK_SECRET || 'change-me')
      .send({ days: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.missions)).toBe(true);
  });

  it('webhook refuse mauvais secret', async () => {
    if (!dbOk || !process.env.WEBHOOK_SECRET) return;
    const res = await request(app)
      .post('/api/webhooks/relance-missions')
      .set('x-webhook-secret', 'wrong-secret')
      .send({ days: 7 });
    expect(res.status).toBe(401);
  });
});
