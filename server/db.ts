import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/scores.db';

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create table and index
db.exec(`
  CREATE TABLE IF NOT EXISTS high_scores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    initials   TEXT    NOT NULL CHECK(length(initials) = 3),
    score      INTEGER NOT NULL CHECK(score > 0),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
`);

export interface ScoreRow {
  id: number;
  initials: string;
  score: number;
  created_at: string;
}

const MAX_SCORES = 5;

const stmtGetTop = db.prepare<[number], ScoreRow>(
  `SELECT id, initials, score, created_at FROM high_scores ORDER BY score DESC LIMIT ?`
);

const stmtInsert = db.prepare<[string, number]>(
  `INSERT INTO high_scores (initials, score) VALUES (?, ?)`
);

export function getTopScores(): ScoreRow[] {
  return stmtGetTop.all(MAX_SCORES);
}

export function addScore(initials: string, score: number): ScoreRow[] {
  stmtInsert.run(initials, score);
  return getTopScores();
}

export function closeDb(): void {
  db.close();
}
