import Database from 'better-sqlite3';

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
