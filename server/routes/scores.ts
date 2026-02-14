import { Router } from 'express';
import { getTopScores, addScore } from '../db';

const router = Router();

const MAX_SCORES = 5;

router.get('/api/scores', async (_req, res) => {
  const scores = await getTopScores();
  res.json({ scores });
});

router.post('/api/scores', async (req, res) => {
  const { score, initials } = req.body ?? {};

  // Validate initials: exactly 3 uppercase letters
  if (typeof initials !== 'string' || !/^[A-Z]{3}$/.test(initials)) {
    res.status(400).json({ error: 'initials must be exactly 3 uppercase letters' });
    return;
  }

  // Validate score: positive integer
  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
    res.status(400).json({ error: 'score must be a positive integer' });
    return;
  }

  // Only accept if it qualifies for top 5
  const current = await getTopScores();
  const qualifies =
    current.length < MAX_SCORES ||
    score > current[current.length - 1].score;

  if (!qualifies) {
    res.status(200).json({ success: false, scores: current });
    return;
  }

  const scores = await addScore(initials, score);
  res.json({ success: true, scores });
});

export default router;
