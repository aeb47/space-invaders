import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChallengeService, ChallengeDefinition, ChallengeRating } from './challenge';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
});

describe('ChallengeService', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    ChallengeService.resetInstance();
  });

  const service = () => ChallengeService.getInstance();

  describe('challenge definitions', () => {
    it('has 10 challenges defined', () => {
      expect(service().getChallenges()).toHaveLength(10);
    });

    it('each challenge has required fields', () => {
      for (const c of service().getChallenges()) {
        expect(c.id).toBeDefined();
        expect(c.name).toBeDefined();
        expect(c.description).toBeDefined();
        expect(c.bronze).toBeDefined();
        expect(c.silver).toBeDefined();
        expect(c.gold).toBeDefined();
      }
    });

    it('challenges have sequential IDs 1-10', () => {
      const ids = service().getChallenges().map(c => c.id);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('challenge names match PRD', () => {
      const names = service().getChallenges().map(c => c.name);
      expect(names[0]).toBe('Boot Camp');
      expect(names[1]).toBe('Sharpshooter');
      expect(names[2]).toBe('Speed Run');
      expect(names[3]).toBe('No Miss');
      expect(names[4]).toBe('Bullet Hell');
      expect(names[5]).toBe('Last Stand');
      expect(names[6]).toBe('UFO Hunt');
      expect(names[7]).toBe('Boss Rush');
      expect(names[8]).toBe('Minimalist');
      expect(names[9]).toBe('ADMIRAL Trial');
    });
  });

  describe('unlock progression', () => {
    it('challenges 1-3 are unlocked by default', () => {
      expect(service().isUnlocked(1)).toBe(true);
      expect(service().isUnlocked(2)).toBe(true);
      expect(service().isUnlocked(3)).toBe(true);
    });

    it('challenges 4+ are locked by default', () => {
      expect(service().isUnlocked(4)).toBe(false);
      expect(service().isUnlocked(10)).toBe(false);
    });

    it('completing challenge 3 with bronze unlocks challenge 4', () => {
      service().setRating(3, 'bronze');
      expect(service().isUnlocked(4)).toBe(true);
    });

    it('completing challenge N with any rating unlocks N+1', () => {
      service().setRating(3, 'bronze');
      service().setRating(4, 'silver');
      service().setRating(5, 'gold');
      expect(service().isUnlocked(6)).toBe(true);
    });
  });

  describe('ratings', () => {
    it('getRating returns null for unrated challenge', () => {
      expect(service().getRating(1)).toBeNull();
    });

    it('setRating stores the rating', () => {
      service().setRating(1, 'gold');
      expect(service().getRating(1)).toBe('gold');
    });

    it('setRating upgrades but does not downgrade', () => {
      service().setRating(1, 'silver');
      service().setRating(1, 'bronze'); // should not downgrade
      expect(service().getRating(1)).toBe('silver');
    });

    it('setRating does upgrade from bronze to gold', () => {
      service().setRating(1, 'bronze');
      service().setRating(1, 'gold');
      expect(service().getRating(1)).toBe('gold');
    });
  });

  describe('evaluateResult', () => {
    it('Boot Camp: clear wave = bronze', () => {
      const rating = service().evaluateResult(1, { wavesCleared: 1, livesRemaining: 1 });
      expect(rating).toBe('bronze');
    });

    it('Boot Camp: clear with 3+ lives = silver', () => {
      const rating = service().evaluateResult(1, { wavesCleared: 1, livesRemaining: 3 });
      expect(rating).toBe('silver');
    });

    it('Boot Camp: clear with 5 lives = gold', () => {
      const rating = service().evaluateResult(1, { wavesCleared: 1, livesRemaining: 5 });
      expect(rating).toBe('gold');
    });

    it('Boot Camp: no wave cleared = null', () => {
      const rating = service().evaluateResult(1, { wavesCleared: 0, livesRemaining: 0 });
      expect(rating).toBeNull();
    });

    it('Sharpshooter: 90%+ accuracy = gold', () => {
      const rating = service().evaluateResult(2, { wavesCleared: 1, accuracy: 92 });
      expect(rating).toBe('gold');
    });

    it('Sharpshooter: 70%+ accuracy = silver', () => {
      const rating = service().evaluateResult(2, { wavesCleared: 1, accuracy: 75 });
      expect(rating).toBe('silver');
    });

    it('Speed Run: under 60s = gold', () => {
      const rating = service().evaluateResult(3, { wavesCleared: 3, timeSeconds: 55 });
      expect(rating).toBe('gold');
    });

    it('Speed Run: under 90s = silver', () => {
      const rating = service().evaluateResult(3, { wavesCleared: 3, timeSeconds: 85 });
      expect(rating).toBe('silver');
    });

    it('Speed Run: under 120s = bronze', () => {
      const rating = service().evaluateResult(3, { wavesCleared: 3, timeSeconds: 110 });
      expect(rating).toBe('bronze');
    });
  });

  describe('persistence', () => {
    it('ratings persist across instances', () => {
      service().setRating(1, 'gold');
      service().setRating(2, 'silver');
      ChallengeService.resetInstance();
      expect(ChallengeService.getInstance().getRating(1)).toBe('gold');
      expect(ChallengeService.getInstance().getRating(2)).toBe('silver');
    });
  });

  describe('getCompletionStats', () => {
    it('counts completed challenges', () => {
      service().setRating(1, 'bronze');
      service().setRating(2, 'gold');
      const stats = service().getCompletionStats();
      expect(stats.completed).toBe(2);
      expect(stats.total).toBe(10);
      expect(stats.goldCount).toBe(1);
    });
  });
});
