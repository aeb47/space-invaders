import { describe, it, expect } from 'vitest';
import { CONFIG } from '../config';

// Import pure functions from ufo-logic (avoids pulling in excalibur)
import {
  getUfoPoints,
  getUfoSpeed,
  getUfoSpawnInterval,
  getUfoDirection,
} from './ufo-logic';

describe('UFO Mystery Ship — pure logic', () => {
  describe('getUfoPoints (deterministic scoring)', () => {
    it('cycles through pointsCycle based on shot count mod 4', () => {
      const cycle = CONFIG.ufo.pointsCycle;
      expect(getUfoPoints(0)).toBe(cycle[0]); // 50
      expect(getUfoPoints(1)).toBe(cycle[1]); // 100
      expect(getUfoPoints(2)).toBe(cycle[2]); // 150
      expect(getUfoPoints(3)).toBe(cycle[3]); // 300
    });

    it('wraps around after 4 shots', () => {
      const cycle = CONFIG.ufo.pointsCycle;
      expect(getUfoPoints(4)).toBe(cycle[0]); // 50 again
      expect(getUfoPoints(5)).toBe(cycle[1]); // 100
      expect(getUfoPoints(7)).toBe(cycle[3]); // 300
    });

    it('handles large shot counts', () => {
      const cycle = CONFIG.ufo.pointsCycle;
      expect(getUfoPoints(100)).toBe(cycle[0]); // 100 % 4 = 0
      expect(getUfoPoints(101)).toBe(cycle[1]); // 101 % 4 = 1
    });
  });

  describe('getUfoSpeed (wave scaling)', () => {
    it('returns base speed on wave 1', () => {
      expect(getUfoSpeed(1)).toBe(CONFIG.ufo.speed);
    });

    it('increases speed by 10% per wave after wave 1', () => {
      const base = CONFIG.ufo.speed;
      // Wave 2: base * (1 + 0.10 * 1) = base * 1.10
      expect(getUfoSpeed(2)).toBeCloseTo(base * 1.1);
      // Wave 3: base * (1 + 0.10 * 2) = base * 1.20
      expect(getUfoSpeed(3)).toBeCloseTo(base * 1.2);
    });

    it('scales linearly with wave number', () => {
      const base = CONFIG.ufo.speed;
      expect(getUfoSpeed(5)).toBeCloseTo(base * 1.4);
      expect(getUfoSpeed(10)).toBeCloseTo(base * 1.9);
    });
  });

  describe('getUfoSpawnInterval (wave scaling)', () => {
    it('returns a value within [min, max] on wave 1', () => {
      const interval = getUfoSpawnInterval(1);
      expect(interval.min).toBe(CONFIG.ufo.spawnIntervalMin);
      expect(interval.max).toBe(CONFIG.ufo.spawnIntervalMax);
    });

    it('decreases by 1s per wave (both min and max)', () => {
      const interval = getUfoSpawnInterval(3);
      const decrease = CONFIG.ufo.spawnIntervalDecreasePerWave * 2; // 2 waves of decrease
      expect(interval.min).toBe(CONFIG.ufo.spawnIntervalMin - decrease);
      expect(interval.max).toBe(CONFIG.ufo.spawnIntervalMax - decrease);
    });

    it('clamps min interval to configured minimum', () => {
      // At wave 20, the decrease would be 19 * 1000 = 19000
      // 20000 - 19000 = 1000, but min is 12000, so clamp
      const interval = getUfoSpawnInterval(20);
      expect(interval.min).toBe(CONFIG.ufo.minSpawnInterval);
    });

    it('max interval is always at least min interval', () => {
      const interval = getUfoSpawnInterval(50);
      expect(interval.max).toBeGreaterThanOrEqual(interval.min);
      expect(interval.min).toBe(CONFIG.ufo.minSpawnInterval);
    });
  });

  describe('getUfoDirection (alternating direction)', () => {
    it('returns 1 or -1', () => {
      const dir = getUfoDirection(0);
      expect([1, -1]).toContain(dir);
    });

    it('alternates direction based on spawn count', () => {
      const dir0 = getUfoDirection(0);
      const dir1 = getUfoDirection(1);
      const dir2 = getUfoDirection(2);
      expect(dir0).not.toBe(dir1);
      expect(dir0).toBe(dir2);
    });

    it('first spawn goes left-to-right (direction = 1)', () => {
      expect(getUfoDirection(0)).toBe(1);
    });

    it('second spawn goes right-to-left (direction = -1)', () => {
      expect(getUfoDirection(1)).toBe(-1);
    });
  });
});
