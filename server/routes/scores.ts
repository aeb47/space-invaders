import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { getDb } from '../db';

export interface ScoreSubmission {
  initials: string;
  score: number;
  wave: number;
  mode: string;
  difficulty: string;
  ship: string;
  accuracy?: number;
  dailySeed?: string;
  ipHash: string;
}

export interface ScoreResult {
  success: boolean;
  id?: number;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  initials: string;
  score: number;
  wave: number;
  mode: string;
  difficulty: string;
  ship: string;
  accuracy: number | null;
  createdAt: string;
}

export interface LeaderboardQuery {
  mode: string;
  limit: number;
  period?: 'daily' | 'weekly' | 'alltime';
}

// Max plausible score per wave (55 aliens * 30pts max + 300 UFO + buffers)
const MAX_SCORE_PER_WAVE = 3000;

export class ScoresRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  submitScore(submission: ScoreSubmission): ScoreResult {
    // Validate initials
    if (!submission.initials || submission.initials.length < 1 || submission.initials.length > 3) {
      return { success: false, error: 'Invalid initials: must be 1-3 characters' };
    }

    // Validate score
    if (submission.score < 0) {
      return { success: false, error: 'Invalid score: must be non-negative' };
    }

    // Anti-cheat: reject impossibly high scores
    const maxPlausible = submission.wave * MAX_SCORE_PER_WAVE;
    if (submission.score > maxPlausible) {
      return { success: false, error: `Invalid score: ${submission.score} too high for wave ${submission.wave}` };
    }

    // Validate wave
    if (submission.wave < 1) {
      return { success: false, error: 'Invalid wave: must be >= 1' };
    }

    const stmt = this.db.prepare(`
      INSERT INTO scores (initials, score, wave, mode, difficulty, ship, accuracy, daily_seed, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      submission.initials.toUpperCase(),
      submission.score,
      submission.wave,
      submission.mode,
      submission.difficulty,
      submission.ship,
      submission.accuracy ?? null,
      submission.dailySeed ?? null,
      submission.ipHash,
    );

    return { success: true, id: Number(result.lastInsertRowid) };
  }

  getLeaderboard(query: LeaderboardQuery): LeaderboardEntry[] {
    let dateFilter = '';
    if (query.period === 'daily') {
      dateFilter = "AND created_at >= datetime('now', '-1 day')";
    } else if (query.period === 'weekly') {
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    }

    const stmt = this.db.prepare(`
      SELECT id, initials, score, wave, mode, difficulty, ship, accuracy, created_at as createdAt
      FROM scores
      WHERE mode = ? ${dateFilter}
      ORDER BY score DESC
      LIMIT ?
    `);

    const rows = stmt.all(query.mode, query.limit) as Omit<LeaderboardEntry, 'rank'>[];
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }

  getDailyLeaderboard(seed: string, limit: number): LeaderboardEntry[] {
    const stmt = this.db.prepare(`
      SELECT id, initials, score, wave, mode, difficulty, ship, accuracy, created_at as createdAt
      FROM scores
      WHERE mode = 'daily' AND daily_seed = ?
      ORDER BY score DESC
      LIMIT ?
    `);

    const rows = stmt.all(seed, limit) as Omit<LeaderboardEntry, 'rank'>[];
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }

  getRecentSubmissionCount(ipHash: string, seconds: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM scores
      WHERE ip_hash = ? AND created_at >= datetime('now', '-' || ? || ' seconds')
    `);
    const row = stmt.get(ipHash, seconds) as { count: number };
    return row.count;
  }
}

const router = Router();

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

router.post('/api/scores', (req: Request, res: Response) => {
  const repo = new ScoresRepository(getDb());
  const ipHash = hashIp(req.ip || '0.0.0.0');

  const rateCount = repo.getRecentSubmissionCount(ipHash, 60);
  if (rateCount >= 5) {
    res.status(429).json({ success: false, error: 'Too many submissions. Try again later.' });
    return;
  }

  const result = repo.submitScore({
    initials: req.body.initials,
    score: req.body.score,
    wave: req.body.wave,
    mode: req.body.mode || 'standard',
    difficulty: req.body.difficulty || 'veteran',
    ship: req.body.ship || 'classic',
    accuracy: req.body.accuracy,
    dailySeed: req.body.dailySeed,
    ipHash,
  });

  res.status(result.success ? 201 : 400).json(result);
});

router.get('/api/scores', (req: Request, res: Response) => {
  const repo = new ScoresRepository(getDb());
  const mode = (req.query.mode as string) || 'standard';
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const period = req.query.period as 'daily' | 'weekly' | 'alltime' | undefined;

  const entries = repo.getLeaderboard({ mode, limit, period });
  res.json(entries);
});

router.get('/api/scores/daily', (req: Request, res: Response) => {
  const repo = new ScoresRepository(getDb());
  const seed = req.query.seed as string;
  if (!seed) {
    res.status(400).json({ error: 'seed query parameter is required' });
    return;
  }
  const limit = Math.min(Number(req.query.limit) || 10, 100);

  const entries = repo.getDailyLeaderboard(seed, limit);
  res.json(entries);
});

export default router;
