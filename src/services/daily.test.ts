import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyChallengeService } from './daily';
import { CONFIG } from '../config';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
});

describe('DailyChallengeService', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    DailyChallengeService.resetInstance();
  });

  it('is a singleton', () => {
    const a = DailyChallengeService.getInstance();
    const b = DailyChallengeService.getInstance();
    expect(a).toBe(b);
  });

  describe('getSeedForDate', () => {
    it('returns a deterministic number for a date string', () => {
      const seed1 = DailyChallengeService.getSeedForDate('2026-02-15');
      const seed2 = DailyChallengeService.getSeedForDate('2026-02-15');
      expect(seed1).toBe(seed2);
    });

    it('returns different seeds for different dates', () => {
      const seed1 = DailyChallengeService.getSeedForDate('2026-02-15');
      const seed2 = DailyChallengeService.getSeedForDate('2026-02-16');
      expect(seed1).not.toBe(seed2);
    });

    it('returns a positive integer', () => {
      const seed = DailyChallengeService.getSeedForDate('2026-01-01');
      expect(seed).toBeGreaterThan(0);
      expect(Number.isInteger(seed)).toBe(true);
    });
  });

  describe('seededRandom', () => {
    it('produces deterministic sequence for a given seed', () => {
      const rng1 = DailyChallengeService.createSeededRandom(42);
      const rng2 = DailyChallengeService.createSeededRandom(42);
      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];
      expect(seq1).toEqual(seq2);
    });

    it('produces values between 0 and 1', () => {
      const rng = DailyChallengeService.createSeededRandom(123);
      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('produces different values for different seeds', () => {
      const rng1 = DailyChallengeService.createSeededRandom(1);
      const rng2 = DailyChallengeService.createSeededRandom(2);
      expect(rng1()).not.toBe(rng2());
    });
  });

  describe('getDailyModifier', () => {
    it('returns a modifier from the CONFIG list', () => {
      const modifier = DailyChallengeService.getDailyModifier('2026-02-15');
      expect(CONFIG.daily.modifiers).toContain(modifier);
    });

    it('returns same modifier for same date', () => {
      const m1 = DailyChallengeService.getDailyModifier('2026-02-15');
      const m2 = DailyChallengeService.getDailyModifier('2026-02-15');
      expect(m1).toBe(m2);
    });

    it('may return different modifier for different date', () => {
      // Check that at least some dates get different modifiers
      const modifiers = new Set<string>();
      for (let d = 1; d <= 30; d++) {
        const date = `2026-02-${String(d).padStart(2, '0')}`;
        modifiers.add(DailyChallengeService.getDailyModifier(date));
      }
      expect(modifiers.size).toBeGreaterThan(1);
    });
  });

  describe('daily attempt tracking', () => {
    const service = () => DailyChallengeService.getInstance();

    it('hasOfficialAttempt returns false initially', () => {
      expect(service().hasOfficialAttempt('2026-02-15')).toBe(false);
    });

    it('recordAttempt marks official attempt', () => {
      service().recordAttempt('2026-02-15', 5000, true);
      expect(service().hasOfficialAttempt('2026-02-15')).toBe(true);
    });

    it('getOfficialScore returns the official attempt score', () => {
      service().recordAttempt('2026-02-15', 5000, true);
      expect(service().getOfficialScore('2026-02-15')).toBe(5000);
    });

    it('getOfficialScore returns null for practice attempts', () => {
      service().recordAttempt('2026-02-15', 3000, false);
      expect(service().getOfficialScore('2026-02-15')).toBeNull();
    });

    it('persists across instances', () => {
      service().recordAttempt('2026-02-15', 5000, true);
      DailyChallengeService.resetInstance();
      expect(DailyChallengeService.getInstance().hasOfficialAttempt('2026-02-15')).toBe(true);
      expect(DailyChallengeService.getInstance().getOfficialScore('2026-02-15')).toBe(5000);
    });

    it('tracks different dates independently', () => {
      service().recordAttempt('2026-02-15', 5000, true);
      expect(service().hasOfficialAttempt('2026-02-16')).toBe(false);
    });
  });

  describe('getDailyChallengeNumber', () => {
    it('returns a positive number', () => {
      const num = DailyChallengeService.getDailyChallengeNumber('2026-02-15');
      expect(num).toBeGreaterThan(0);
    });

    it('increments day over day', () => {
      const n1 = DailyChallengeService.getDailyChallengeNumber('2026-02-15');
      const n2 = DailyChallengeService.getDailyChallengeNumber('2026-02-16');
      expect(n2).toBe(n1 + 1);
    });
  });

  describe('generateShareText', () => {
    it('includes challenge number, stars, score, and wave', () => {
      const text = DailyChallengeService.generateShareText('2026-02-15', 5000, 8, 14);
      expect(text).toContain('SPACE INVADERS DAILY');
      expect(text).toContain('5,000');
      expect(text).toContain('Wave: 8');
    });

    it('includes correct star rating', () => {
      const text3 = DailyChallengeService.generateShareText('2026-02-15', 5000, 8, 0);
      expect(text3).toContain('★');
    });
  });
});
