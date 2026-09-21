import app from './app';
import { connectMongo } from './services/mongo';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectMongo();
  } catch {
    console.warn('mongo pas dispo, logs matching désactivés');
  }

  app.listen(PORT, () => {
    console.log(`api sur :${PORT}`);
  });
}

start();
