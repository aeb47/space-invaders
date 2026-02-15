import express from 'express';
import path from 'path';
import scoresRouter from './server/routes/scores';
import { initDb, closeDb } from './server/db';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API routes (before static files)
app.use(scoresRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB, then start listening
initDb().then(() => {
  const server = app.listen(port, () => {
    console.log(`Space Invaders running on port ${port}`);
  });

  function shutdown() {
    console.log('Shutting down...');
    closeDb();
    server.close();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}).catch((err: unknown) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
