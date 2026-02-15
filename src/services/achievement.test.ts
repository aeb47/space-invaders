import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementService, GameState } from './achievement';

const STORAGE_KEY = 'space-invaders-achievements';

function defaultGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    totalAliensDestroyed: 0,
    totalGamesPlayed: 0,
    highestWave: 0,
    currentWave: 1,
    waveClearedNoDamage: false,
    waveAccuracy: 0,
    waveShotsFired: 0,
    waveClearTimeMs: Infinity,
    totalUfosDestroyed: 0,
    bossDefeatedThisWave: false,
    ufoPointsScored: 0,
    currentScore: 0,
    comboCount: 0,
    consecutiveNoDamageWaves: 0,
    isNumberOneOnLeaderboard: false,
    ...overrides,
  };
}

describe('AchievementService', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    AchievementService.resetInstance();
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
      const a = AchievementService.getInstance();
      const b = AchievementService.getInstance();
      expect(a).toBe(b);
    });

    it('resetInstance creates a new instance', () => {
      const a = AchievementService.getInstance();
      AchievementService.resetInstance();
      const b = AchievementService.getInstance();
      expect(a).not.toBe(b);
    });
  });

  describe('achievement definitions', () => {
    it('has 15 defined achievements', () => {
      const svc = AchievementService.getInstance();
      expect(svc.getAllAchievements()).toHaveLength(15);
    });

    it('each achievement has id, name, description', () => {
      const svc = AchievementService.getInstance();
      for (const a of svc.getAllAchievements()) {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.description).toBeTruthy();
      }
    });
  });

  describe('isUnlocked', () => {
    it('returns false initially for all achievements', () => {
      const svc = AchievementService.getInstance();
      for (const a of svc.getAllAchievements()) {
        expect(svc.isUnlocked(a.id)).toBe(false);
      }
    });
  });

  describe('unlock', () => {
    it('marks achievement as unlocked', () => {
      const svc = AchievementService.getInstance();
      svc.unlock('first-contact');
      expect(svc.isUnlocked('first-contact')).toBe(true);
    });

    it('returns true on first unlock', () => {
      const svc = AchievementService.getInstance();
      expect(svc.unlock('first-contact')).toBe(true);
    });

    it('returns false if already unlocked', () => {
      const svc = AchievementService.getInstance();
      svc.unlock('first-contact');
      expect(svc.unlock('first-contact')).toBe(false);
    });
  });

  describe('getUnlocked', () => {
    it('returns empty array initially', () => {
      const svc = AchievementService.getInstance();
      expect(svc.getUnlocked()).toEqual([]);
    });

    it('returns array of unlocked achievement IDs', () => {
      const svc = AchievementService.getInstance();
      svc.unlock('first-contact');
      svc.unlock('wave-rider');
      const unlocked = svc.getUnlocked();
      expect(unlocked).toContain('first-contact');
      expect(unlocked).toContain('wave-rider');
      expect(unlocked).toHaveLength(2);
    });
  });

  describe('progress', () => {
    it('getProgress returns 0 initially', () => {
      const svc = AchievementService.getInstance();
      expect(svc.getProgress('first-contact')).toBe(0);
    });

    it('setProgress updates progress', () => {
      const svc = AchievementService.getInstance();
      svc.setProgress('first-contact', 5);
      expect(svc.getProgress('first-contact')).toBe(5);
    });

    it('persists progress to localStorage', () => {
      const svc = AchievementService.getInstance();
      svc.setProgress('ufo-hunter', 7);
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.progress['ufo-hunter']).toBe(7);
    });
  });

  describe('persistence', () => {
    it('persists unlocks to localStorage', () => {
      const svc = AchievementService.getInstance();
      svc.unlock('first-contact');
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.unlocked).toContain('first-contact');
    });

    it('loads unlocked achievements from localStorage', () => {
      storage[STORAGE_KEY] = JSON.stringify({
        unlocked: ['first-contact', 'wave-rider'],
        progress: {},
      });
      const svc = AchievementService.getInstance();
      expect(svc.isUnlocked('first-contact')).toBe(true);
      expect(svc.isUnlocked('wave-rider')).toBe(true);
    });

    it('loads progress from localStorage', () => {
      storage[STORAGE_KEY] = JSON.stringify({
        unlocked: [],
        progress: { 'ufo-hunter': 5 },
      });
      const svc = AchievementService.getInstance();
      expect(svc.getProgress('ufo-hunter')).toBe(5);
    });

    it('handles corrupted localStorage gracefully', () => {
      storage[STORAGE_KEY] = '{broken!!!';
      const svc = AchievementService.getInstance();
      expect(svc.getUnlocked()).toEqual([]);
      expect(svc.getProgress('ufo-hunter')).toBe(0);
    });
  });

  describe('checkAchievements', () => {
    it('returns array of newly unlocked achievement IDs', () => {
      const svc = AchievementService.getInstance();
      const state = defaultGameState({ totalAliensDestroyed: 1 });
      const newly = svc.checkAchievements(state);
      expect(newly).toContain('first-contact');
    });

    it('does not re-unlock already unlocked achievements', () => {
      const svc = AchievementService.getInstance();
      svc.unlock('first-contact');
      const state = defaultGameState({ totalAliensDestroyed: 1 });
      const newly = svc.checkAchievements(state);
      expect(newly).not.toContain('first-contact');
    });

    // --- Individual achievement tests ---

    it('first-contact: unlocks when totalAliensDestroyed >= 1', () => {
      const svc = AchievementService.getInstance();
      // not yet
      svc.checkAchievements(defaultGameState({ totalAliensDestroyed: 0 }));
      expect(svc.isUnlocked('first-contact')).toBe(false);
      // now
      svc.checkAchievements(defaultGameState({ totalAliensDestroyed: 1 }));
      expect(svc.isUnlocked('first-contact')).toBe(true);
    });

    it('quarter-muncher: unlocks when totalGamesPlayed >= 25', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ totalGamesPlayed: 24 }));
      expect(svc.isUnlocked('quarter-muncher')).toBe(false);
      svc.checkAchievements(defaultGameState({ totalGamesPlayed: 25 }));
      expect(svc.isUnlocked('quarter-muncher')).toBe(true);
    });

    it('wave-rider: unlocks when highestWave >= 10', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ highestWave: 9 }));
      expect(svc.isUnlocked('wave-rider')).toBe(false);
      svc.checkAchievements(defaultGameState({ highestWave: 10 }));
      expect(svc.isUnlocked('wave-rider')).toBe(true);
    });

    it('perfect-wave: unlocks when a wave is cleared with no damage', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ waveClearedNoDamage: false }));
      expect(svc.isUnlocked('perfect-wave')).toBe(false);
      svc.checkAchievements(defaultGameState({ waveClearedNoDamage: true }));
      expect(svc.isUnlocked('perfect-wave')).toBe(true);
    });

    it('sharpshooter: unlocks when wave accuracy >= 90% with min 20 shots', () => {
      const svc = AchievementService.getInstance();
      // high accuracy but not enough shots
      svc.checkAchievements(defaultGameState({ waveAccuracy: 95, waveShotsFired: 10 }));
      expect(svc.isUnlocked('sharpshooter')).toBe(false);
      // enough shots but low accuracy
      svc.checkAchievements(defaultGameState({ waveAccuracy: 80, waveShotsFired: 25 }));
      expect(svc.isUnlocked('sharpshooter')).toBe(false);
      // both conditions met
      svc.checkAchievements(defaultGameState({ waveAccuracy: 90, waveShotsFired: 20 }));
      expect(svc.isUnlocked('sharpshooter')).toBe(true);
    });

    it('speed-demon: unlocks when wave cleared in under 12 seconds', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ waveClearTimeMs: 13000 }));
      expect(svc.isUnlocked('speed-demon')).toBe(false);
      svc.checkAchievements(defaultGameState({ waveClearTimeMs: 11000 }));
      expect(svc.isUnlocked('speed-demon')).toBe(true);
    });

    it('ufo-hunter: unlocks when totalUfosDestroyed >= 10', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ totalUfosDestroyed: 9 }));
      expect(svc.isUnlocked('ufo-hunter')).toBe(false);
      svc.checkAchievements(defaultGameState({ totalUfosDestroyed: 10 }));
      expect(svc.isUnlocked('ufo-hunter')).toBe(true);
    });

    it('boss-slayer: unlocks when a boss is defeated', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ bossDefeatedThisWave: false }));
      expect(svc.isUnlocked('boss-slayer')).toBe(false);
      svc.checkAchievements(defaultGameState({ bossDefeatedThisWave: true }));
      expect(svc.isUnlocked('boss-slayer')).toBe(true);
    });

    it('the-300-club: unlocks when a 300-point UFO is hit', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ ufoPointsScored: 150 }));
      expect(svc.isUnlocked('the-300-club')).toBe(false);
      svc.checkAchievements(defaultGameState({ ufoPointsScored: 300 }));
      expect(svc.isUnlocked('the-300-club')).toBe(true);
    });

    it('marathon-runner: unlocks when highestWave >= 20', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ highestWave: 19 }));
      expect(svc.isUnlocked('marathon-runner')).toBe(false);
      svc.checkAchievements(defaultGameState({ highestWave: 20 }));
      expect(svc.isUnlocked('marathon-runner')).toBe(true);
    });

    it('combo-master: unlocks when a 10-kill combo is achieved', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ comboCount: 9 }));
      expect(svc.isUnlocked('combo-master')).toBe(false);
      svc.checkAchievements(defaultGameState({ comboCount: 10 }));
      expect(svc.isUnlocked('combo-master')).toBe(true);
    });

    it('no-coin-needed: unlocks when score >= 50000', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ currentScore: 49999 }));
      expect(svc.isUnlocked('no-coin-needed')).toBe(false);
      svc.checkAchievements(defaultGameState({ currentScore: 50000 }));
      expect(svc.isUnlocked('no-coin-needed')).toBe(true);
    });

    it('admiral: unlocks when wave >= 13', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ currentWave: 12 }));
      expect(svc.isUnlocked('admiral')).toBe(false);
      svc.checkAchievements(defaultGameState({ currentWave: 13 }));
      expect(svc.isUnlocked('admiral')).toBe(true);
    });

    it('untouchable: unlocks when 3 consecutive waves without damage', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ consecutiveNoDamageWaves: 2 }));
      expect(svc.isUnlocked('untouchable')).toBe(false);
      svc.checkAchievements(defaultGameState({ consecutiveNoDamageWaves: 3 }));
      expect(svc.isUnlocked('untouchable')).toBe(true);
    });

    it('high-score-hero: unlocks when holding #1 on any leaderboard', () => {
      const svc = AchievementService.getInstance();
      svc.checkAchievements(defaultGameState({ isNumberOneOnLeaderboard: false }));
      expect(svc.isUnlocked('high-score-hero')).toBe(false);
      svc.checkAchievements(defaultGameState({ isNumberOneOnLeaderboard: true }));
      expect(svc.isUnlocked('high-score-hero')).toBe(true);
    });

    it('can unlock multiple achievements at once', () => {
      const svc = AchievementService.getInstance();
      const state = defaultGameState({
        totalAliensDestroyed: 1,
        totalGamesPlayed: 25,
        highestWave: 10,
      });
      const newly = svc.checkAchievements(state);
      expect(newly).toContain('first-contact');
      expect(newly).toContain('quarter-muncher');
      expect(newly).toContain('wave-rider');
    });
  });

  describe('reset', () => {
    it('clears all unlocks and progress', () => {
      const svc = AchievementService.getInstance();
      svc.unlock('first-contact');
      svc.setProgress('ufo-hunter', 5);
      svc.reset();
      expect(svc.getUnlocked()).toEqual([]);
      expect(svc.getProgress('ufo-hunter')).toBe(0);
    });

    it('persists reset to localStorage', () => {
      const svc = AchievementService.getInstance();
      svc.unlock('first-contact');
      svc.reset();
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.unlocked).toEqual([]);
      expect(saved.progress).toEqual({});
    });
  });
});
