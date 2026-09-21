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

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectMongo() {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/interimatch';
  // Atlas depuis Render free peut être lent au cold start
  await mongoose.connect(url, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log('mongo ok');
}
