import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from '../db';
import { ScoresRepository } from './scores';

describe('ScoresRepository', () => {
  let db: Database.Database;
  let repo: ScoresRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    initSchema(db);
    repo = new ScoresRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('submitScore', () => {
    it('inserts a valid score', () => {
      const result = repo.submitScore({
        initials: 'ABC',
        score: 5000,
        wave: 8,
        mode: 'standard',
        difficulty: 'veteran',
        ship: 'classic',
        accuracy: 72.5,
        ipHash: 'abc123',
      });
      expect(result.success).toBe(true);
      expect(result.id).toBeGreaterThan(0);
    });

    it('rejects score with invalid initials', () => {
      const result = repo.submitScore({
        initials: '',
        score: 5000,
        wave: 8,
        mode: 'standard',
        difficulty: 'veteran',
        ship: 'classic',
        ipHash: 'abc123',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('initials');
    });

    it('rejects negative score', () => {
      const result = repo.submitScore({
        initials: 'ABC',
        score: -100,
        wave: 1,
        mode: 'standard',
        difficulty: 'veteran',
        ship: 'classic',
        ipHash: 'abc123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects impossibly high score for wave', () => {
      // Max possible: ~55 aliens * 30pts * wave = 1650 per wave, generous limit
      const result = repo.submitScore({
        initials: 'ABC',
        score: 999999,
        wave: 1,
        mode: 'standard',
        difficulty: 'veteran',
        ship: 'classic',
        ipHash: 'abc123',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('score');
    });

    it('accepts daily challenge scores with seed', () => {
      const result = repo.submitScore({
        initials: 'ABC',
        score: 5000,
        wave: 8,
        mode: 'daily',
        difficulty: 'veteran',
        ship: 'classic',
        dailySeed: '2026-02-15',
        ipHash: 'abc123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getLeaderboard', () => {
    beforeEach(() => {
      // Insert some test scores
      const scores = [
        { initials: 'AAA', score: 10000, wave: 15, mode: 'standard' },
        { initials: 'BBB', score: 8000, wave: 12, mode: 'standard' },
        { initials: 'CCC', score: 6000, wave: 9, mode: 'standard' },
        { initials: 'DDD', score: 4000, wave: 6, mode: 'standard' },
        { initials: 'EEE', score: 2000, wave: 3, mode: 'standard' },
        { initials: 'FFF', score: 7000, wave: 10, mode: 'endless' },
      ];
      for (const s of scores) {
        repo.submitScore({
          ...s,
          difficulty: 'veteran',
          ship: 'classic',
          ipHash: 'test',
        });
      }
    });

    it('returns scores sorted by score descending', () => {
      const results = repo.getLeaderboard({ mode: 'standard', limit: 50 });
      expect(results).toHaveLength(5);
      expect(results[0].score).toBe(10000);
      expect(results[4].score).toBe(2000);
    });

    it('filters by mode', () => {
      const standard = repo.getLeaderboard({ mode: 'standard', limit: 50 });
      expect(standard).toHaveLength(5);
      const endless = repo.getLeaderboard({ mode: 'endless', limit: 50 });
      expect(endless).toHaveLength(1);
    });

    it('respects limit', () => {
      const results = repo.getLeaderboard({ mode: 'standard', limit: 3 });
      expect(results).toHaveLength(3);
    });

    it('includes rank numbers', () => {
      const results = repo.getLeaderboard({ mode: 'standard', limit: 50 });
      expect(results[0].rank).toBe(1);
      expect(results[1].rank).toBe(2);
    });
  });

  describe('getDailyLeaderboard', () => {
    it('filters by daily seed', () => {
      repo.submitScore({
        initials: 'AAA',
        score: 5000,
        wave: 8,
        mode: 'daily',
        difficulty: 'veteran',
        ship: 'classic',
        dailySeed: '2026-02-15',
        ipHash: 'test',
      });
      repo.submitScore({
        initials: 'BBB',
        score: 3000,
        wave: 5,
        mode: 'daily',
        difficulty: 'veteran',
        ship: 'classic',
        dailySeed: '2026-02-14',
        ipHash: 'test',
      });

      const results = repo.getDailyLeaderboard('2026-02-15', 50);
      expect(results).toHaveLength(1);
      expect(results[0].initials).toBe('AAA');
    });
  });

  describe('anti-cheat: rate limiting', () => {
    it('getRecentSubmissionCount counts recent submissions', () => {
      repo.submitScore({
        initials: 'ABC',
        score: 1000,
        wave: 3,
        mode: 'standard',
        difficulty: 'veteran',
        ship: 'classic',
        ipHash: 'samehash',
      });
      const count = repo.getRecentSubmissionCount('samehash', 60);
      expect(count).toBe(1);
    });
  });
});
