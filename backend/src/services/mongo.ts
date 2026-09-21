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

export const MatchingLog =
  mongoose.models.MatchingLog || mongoose.model('MatchingLog', MatchingLogSchema);

export async function connectMongo() {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/interimatch';
  // timeout court sinon ça bloque le boot si docker est down
  await mongoose.connect(url, { serverSelectionTimeoutMS: 2500 });
  console.log('mongo ok');
}
