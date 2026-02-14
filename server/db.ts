import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let client: Client;

export async function initDb(): Promise<void> {
  const url = process.env.LIBSQL_URL || 'file:./data/scores.db';

  // For local file URLs, ensure the directory exists
  if (url.startsWith('file:')) {
    const filePath = url.replace('file:', '');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  client = createClient({
    url,
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS high_scores (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      initials   TEXT    NOT NULL CHECK(length(initials) = 3),
      score      INTEGER NOT NULL CHECK(score > 0),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC)`
  );
}

export interface ScoreRow {
  initials: string;
  score: number;
}

const MAX_SCORES = 5;

export async function getTopScores(): Promise<ScoreRow[]> {
  const result = await client.execute({
    sql: 'SELECT initials, score FROM high_scores ORDER BY score DESC LIMIT ?',
    args: [MAX_SCORES],
  });
  return result.rows.map((row) => ({
    initials: row.initials as string,
    score: row.score as number,
  }));
}

export async function addScore(initials: string, score: number): Promise<ScoreRow[]> {
  await client.execute({
    sql: 'INSERT INTO high_scores (initials, score) VALUES (?, ?)',
    args: [initials, score],
  });
  return getTopScores();
}

export function closeDb(): void {
  client.close();
}
