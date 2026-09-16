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
  await mongoose.connect(url);
  console.log('mongo ok');
}
