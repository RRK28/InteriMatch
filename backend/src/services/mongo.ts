import mongoose from 'mongoose';

const MatchingLogSchema = new mongoose.Schema(
  {
    missionId: String,
    interimId: String,
    score: Number,
    details: Object,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'matching_logs' }
);

const AutomationEventSchema = new mongoose.Schema(
  {
    type: String,
    payload: Object,
    deliveredToN8n: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'automation_events' }
);

export const MatchingLog =
  mongoose.models.MatchingLog || mongoose.model('MatchingLog', MatchingLogSchema);

export const AutomationEvent =
  mongoose.models.AutomationEvent ||
  mongoose.model('AutomationEvent', AutomationEventSchema);

let lastMongoError: string | null = null;

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getMongoStatus() {
  return {
    ready: isMongoReady(),
    state: mongoose.connection.readyState,
    configured: Boolean(process.env.MONGO_URL),
    lastError: lastMongoError,
  };
}

export async function connectMongo() {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/interimatch';
  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 15000,
    });
    lastMongoError = null;
    console.log('mongo ok');
  } catch (err) {
    lastMongoError = err instanceof Error ? err.message : String(err);
    console.warn('mongo pas dispo:', lastMongoError);
    throw err;
  }
}

/** Tentative de reco si le boot a raté (ex. cold start Atlas). */
export async function ensureMongo() {
  if (isMongoReady()) return true;
  if (!process.env.MONGO_URL) {
    lastMongoError = 'MONGO_URL manquant';
    return false;
  }
  try {
    if (mongoose.connection.readyState === 0) {
      await connectMongo();
    }
    return isMongoReady();
  } catch {
    return false;
  }
}
