import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database;

export function getDb(dbPath?: string): Database.Database {
  if (!db) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'data', 'scores.db');
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

export function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      initials TEXT NOT NULL,
      score INTEGER NOT NULL,
      wave INTEGER NOT NULL,
      mode TEXT NOT NULL DEFAULT 'standard',
      difficulty TEXT NOT NULL DEFAULT 'veteran',
      ship TEXT NOT NULL DEFAULT 'classic',
      accuracy REAL,
      daily_seed TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_hash TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_scores_mode_score ON scores(mode, score DESC);
    CREATE INDEX IF NOT EXISTS idx_scores_daily ON scores(daily_seed, score DESC);
    CREATE INDEX IF NOT EXISTS idx_scores_created ON scores(created_at);
  `);
}

export async function initDb(): Promise<void> {
  getDb();
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = undefined as unknown as Database.Database;
  }
}

// For testing: create an in-memory database
export function createTestDb(): Database.Database {
  const testDb = new Database(':memory:');
  testDb.pragma('journal_mode = WAL');
  initSchema(testDb);
  return testDb;
}
