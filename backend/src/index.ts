import app from './app';
import { connectMongo } from './services/mongo';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectMongo();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('mongo pas dispo, logs matching désactivés:', msg);
  }

  app.listen(PORT, () => {
    console.log(`api sur :${PORT}`);
  });
}

start();
