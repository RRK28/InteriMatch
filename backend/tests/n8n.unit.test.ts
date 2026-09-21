import { notifyN8n } from '../src/services/n8n';
import { AutomationEvent, isMongoReady, connectMongo } from '../src/services/mongo';
import mongoose from 'mongoose';

describe('notifyN8n', () => {
  beforeAll(async () => {
    try {
      await connectMongo();
    } catch {
      // ok
    }
  });

  afterAll(async () => {
    await mongoose.disconnect().catch(() => {});
  });

  it('archive candidature dans mongo sans planter si n8n absent', async () => {
    delete process.env.N8N_WEBHOOK_URL;
    await expect(
      notifyN8n({
        type: 'candidature',
        email: 'test@example.com',
        mission: 'Mission test',
        score: 72,
      })
    ).resolves.toBeUndefined();

    if (!isMongoReady()) return;
    const last = await AutomationEvent.findOne({ type: 'candidature' }).sort({ createdAt: -1 });
    expect(last).toBeTruthy();
    expect(last!.deliveredToN8n).toBe(false);
  });

  it('marque deliveredToN8n si URL configurée (fetch mock)', async () => {
    process.env.N8N_WEBHOOK_URL = 'http://127.0.0.1:9/webhook-fake';
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);

    await notifyN8n({
      type: 'high_match',
      mission: 'Chantier Lyon',
      matches: [{ email: 'a@b.c', score: 88 }],
    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    delete process.env.N8N_WEBHOOK_URL;

    if (!isMongoReady()) return;
    const last = await AutomationEvent.findOne({ type: 'high_match' }).sort({ createdAt: -1 });
    expect(last?.deliveredToN8n).toBe(true);
  });
});
