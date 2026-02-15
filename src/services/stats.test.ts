import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatsService } from './stats';

const STORAGE_KEY = 'space-invaders-stats';

describe('StatsService', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    StatsService.resetInstance();
    storage = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  describe('singleton', () => {
    it('returns the same instance', () => {
      const a = StatsService.getInstance();
      const b = StatsService.getInstance();
      expect(a).toBe(b);
    });

    it('resetInstance creates a new instance', () => {
      const a = StatsService.getInstance();
      StatsService.resetInstance();
      const b = StatsService.getInstance();
      expect(a).not.toBe(b);
    });
  });

  describe('getStats', () => {
    it('returns defaults when localStorage is empty', () => {
      const svc = StatsService.getInstance();
      const stats = svc.getStats();
      expect(stats.totalGamesPlayed).toBe(0);
      expect(stats.totalPlayTimeMs).toBe(0);
      expect(stats.totalAliensDestroyed).toBe(0);
      expect(stats.totalShotsFired).toBe(0);
      expect(stats.totalShotsHit).toBe(0);
      expect(stats.highestScore).toBe(0);
      expect(stats.highestWave).toBe(0);
      expect(stats.totalUfosDestroyed).toBe(0);
      expect(stats.totalBossesDefeated).toBe(0);
      expect(stats.totalPowerUpsCollected).toBe(0);
      expect(stats.recentScores).toEqual([]);
    });

    it('returns saved stats from localStorage', () => {
      storage[STORAGE_KEY] = JSON.stringify({
        totalGamesPlayed: 5,
        totalAliensDestroyed: 100,
        highestScore: 5000,
        recentScores: [5000, 3000, 1000],
      });
      const svc = StatsService.getInstance();
      const stats = svc.getStats();
      expect(stats.totalGamesPlayed).toBe(5);
      expect(stats.totalAliensDestroyed).toBe(100);
      expect(stats.highestScore).toBe(5000);
      expect(stats.recentScores).toEqual([5000, 3000, 1000]);
    });

    it('returns defaults when localStorage has corrupted data', () => {
      storage[STORAGE_KEY] = '{broken json!!!';
      const svc = StatsService.getInstance();
      const stats = svc.getStats();
      expect(stats.totalGamesPlayed).toBe(0);
      expect(stats.recentScores).toEqual([]);
    });

    it('merges partial saved data with defaults', () => {
      storage[STORAGE_KEY] = JSON.stringify({ totalGamesPlayed: 3 });
      const svc = StatsService.getInstance();
      const stats = svc.getStats();
      expect(stats.totalGamesPlayed).toBe(3);
      expect(stats.totalShotsFired).toBe(0);
      expect(stats.recentScores).toEqual([]);
    });
  });

  describe('recordGameEnd', () => {
    it('increments totalGamesPlayed', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 100, wave: 2, playTimeMs: 5000 });
      expect(svc.getStats().totalGamesPlayed).toBe(1);
    });

    it('accumulates play time', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 100, wave: 1, playTimeMs: 3000 });
      svc.recordGameEnd({ score: 200, wave: 2, playTimeMs: 4000 });
      expect(svc.getStats().totalPlayTimeMs).toBe(7000);
    });

    it('tracks highest score', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 500, wave: 1, playTimeMs: 1000 });
      svc.recordGameEnd({ score: 300, wave: 2, playTimeMs: 1000 });
      expect(svc.getStats().highestScore).toBe(500);
    });

    it('tracks highest wave', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 100, wave: 5, playTimeMs: 1000 });
      svc.recordGameEnd({ score: 200, wave: 3, playTimeMs: 1000 });
      expect(svc.getStats().highestWave).toBe(5);
    });

    it('stores recent scores (max 10)', () => {
      const svc = StatsService.getInstance();
      for (let i = 1; i <= 12; i++) {
        svc.recordGameEnd({ score: i * 100, wave: 1, playTimeMs: 1000 });
      }
      const stats = svc.getStats();
      expect(stats.recentScores).toHaveLength(10);
      // Most recent scores should be kept (last 10)
      expect(stats.recentScores[stats.recentScores.length - 1]).toBe(1200);
      expect(stats.recentScores[0]).toBe(300);
    });

    it('persists after recordGameEnd', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 999, wave: 3, playTimeMs: 2000 });
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.highestScore).toBe(999);
    });
  });

  describe('recordShot', () => {
    it('increments totalShotsFired on miss', () => {
      const svc = StatsService.getInstance();
      svc.recordShot(false);
      expect(svc.getStats().totalShotsFired).toBe(1);
      expect(svc.getStats().totalShotsHit).toBe(0);
    });

    it('increments both totalShotsFired and totalShotsHit on hit', () => {
      const svc = StatsService.getInstance();
      svc.recordShot(true);
      expect(svc.getStats().totalShotsFired).toBe(1);
      expect(svc.getStats().totalShotsHit).toBe(1);
    });
  });

  describe('recordAlienKill', () => {
    it('increments totalAliensDestroyed', () => {
      const svc = StatsService.getInstance();
      svc.recordAlienKill();
      svc.recordAlienKill();
      expect(svc.getStats().totalAliensDestroyed).toBe(2);
    });
  });

  describe('recordUfoKill', () => {
    it('increments totalUfosDestroyed', () => {
      const svc = StatsService.getInstance();
      svc.recordUfoKill();
      expect(svc.getStats().totalUfosDestroyed).toBe(1);
    });
  });

  describe('recordBossKill', () => {
    it('increments totalBossesDefeated', () => {
      const svc = StatsService.getInstance();
      svc.recordBossKill();
      expect(svc.getStats().totalBossesDefeated).toBe(1);
    });
  });

  describe('recordPowerUpCollect', () => {
    it('increments totalPowerUpsCollected', () => {
      const svc = StatsService.getInstance();
      svc.recordPowerUpCollect();
      svc.recordPowerUpCollect();
      svc.recordPowerUpCollect();
      expect(svc.getStats().totalPowerUpsCollected).toBe(3);
    });
  });

  describe('getAccuracy', () => {
    it('returns 0 when no shots fired', () => {
      const svc = StatsService.getInstance();
      expect(svc.getAccuracy()).toBe(0);
    });

    it('computes accuracy percentage', () => {
      const svc = StatsService.getInstance();
      svc.recordShot(true);
      svc.recordShot(true);
      svc.recordShot(false);
      svc.recordShot(false);
      expect(svc.getAccuracy()).toBeCloseTo(50);
    });

    it('returns 100 when all shots hit', () => {
      const svc = StatsService.getInstance();
      svc.recordShot(true);
      svc.recordShot(true);
      expect(svc.getAccuracy()).toBe(100);
    });
  });

  describe('getAverageScore', () => {
    it('returns 0 when no recent scores', () => {
      const svc = StatsService.getInstance();
      expect(svc.getAverageScore()).toBe(0);
    });

    it('computes average of recent scores', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 100, wave: 1, playTimeMs: 1000 });
      svc.recordGameEnd({ score: 200, wave: 1, playTimeMs: 1000 });
      svc.recordGameEnd({ score: 300, wave: 1, playTimeMs: 1000 });
      expect(svc.getAverageScore()).toBe(200);
    });
  });

  describe('reset', () => {
    it('does nothing without confirmation parameter', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 500, wave: 3, playTimeMs: 5000 });
      svc.reset(false);
      expect(svc.getStats().totalGamesPlayed).toBe(1);
    });

    it('clears all stats when confirmed', () => {
      const svc = StatsService.getInstance();
      svc.recordGameEnd({ score: 500, wave: 3, playTimeMs: 5000 });
      svc.recordShot(true);
      svc.recordAlienKill();
      svc.reset(true);
      const stats = svc.getStats();
      expect(stats.totalGamesPlayed).toBe(0);
      expect(stats.totalShotsFired).toBe(0);
      expect(stats.totalAliensDestroyed).toBe(0);
      expect(stats.highestScore).toBe(0);
      expect(stats.recentScores).toEqual([]);
    });
  });
});
