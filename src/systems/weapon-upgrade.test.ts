import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponSystem } from './weapon-upgrade';

describe('WeaponSystem', () => {
  let ws: WeaponSystem;

  beforeEach(() => {
    ws = new WeaponSystem();
  });

  describe('initial state', () => {
    it('starts at level 0 (Standard)', () => {
      expect(ws.getLevel()).toBe(0);
      expect(ws.getLevelName()).toBe('Standard');
    });
  });

  describe('getLevel', () => {
    it('returns current level index', () => {
      expect(ws.getLevel()).toBe(0);
    });
  });

  describe('getLevelName', () => {
    it('returns the level name string', () => {
      expect(ws.getLevelName()).toBe('Standard');
    });
  });

  describe('getWeaponConfig', () => {
    it('returns the config for current level', () => {
      const config = ws.getWeaponConfig();
      expect(config.name).toBe('Standard');
      expect(config.bulletSpeed).toBe(400);
      expect(config.fireCooldown).toBe(150);
      expect(config.maxBullets).toBe(3);
      expect(config.pattern).toBe('single');
    });
  });

  describe('addScore', () => {
    it('adds to upgrade progress', () => {
      ws.addScore(100);
      expect(ws.getLevel()).toBe(0); // still Standard, under 500
    });

    it('upgrades to level 1 at 500 points', () => {
      ws.addScore(500);
      expect(ws.getLevel()).toBe(1);
      expect(ws.getLevelName()).toBe('Accelerated');
    });

    it('upgrades to level 2 at 1500 total', () => {
      ws.addScore(500);  // total 500 -> level 1
      ws.addScore(1000); // total 1500 -> level 2
      expect(ws.getLevel()).toBe(2);
      expect(ws.getLevelName()).toBe('Double');
    });

    it('cannot exceed level 4 (Plasma)', () => {
      ws.addScore(10000); // way above threshold
      expect(ws.getLevel()).toBe(4);
      expect(ws.getLevelName()).toBe('Plasma');
    });
  });

  describe('level thresholds', () => {
    it('level 0 = Standard at threshold 0', () => {
      expect(ws.getLevel()).toBe(0);
      expect(ws.getLevelName()).toBe('Standard');
    });

    it('level 1 = Accelerated at threshold 500', () => {
      ws.addScore(500);
      expect(ws.getLevel()).toBe(1);
      expect(ws.getLevelName()).toBe('Accelerated');
    });

    it('level 2 = Double at threshold 1500', () => {
      ws.addScore(1500);
      expect(ws.getLevel()).toBe(2);
      expect(ws.getLevelName()).toBe('Double');
    });

    it('level 3 = Piercing at threshold 3500', () => {
      ws.addScore(3500);
      expect(ws.getLevel()).toBe(3);
      expect(ws.getLevelName()).toBe('Piercing');
    });

    it('level 4 = Plasma at threshold 6000', () => {
      ws.addScore(6000);
      expect(ws.getLevel()).toBe(4);
      expect(ws.getLevelName()).toBe('Plasma');
    });
  });

  describe('levelDown', () => {
    it('decreases level by 1', () => {
      ws.addScore(1500); // level 2
      ws.levelDown();
      expect(ws.getLevel()).toBe(1);
      expect(ws.getLevelName()).toBe('Accelerated');
    });

    it('does not go below level 0', () => {
      ws.levelDown();
      expect(ws.getLevel()).toBe(0);
      expect(ws.getLevelName()).toBe('Standard');
    });

    it('keeps accumulated score', () => {
      ws.addScore(1500); // level 2
      ws.levelDown();    // level 1, but score still 1500
      expect(ws.getLevel()).toBe(1);
      // Adding 0 should not change level since score is still 1500
      // but level was manually set down
      ws.addScore(0);
      expect(ws.getLevel()).toBe(1);
    });
  });

  describe('getProgress', () => {
    it('returns fraction toward next level (0.0 to 1.0)', () => {
      // At 0 points, next threshold is 500 -> progress = 0/500 = 0
      expect(ws.getProgress()).toBe(0);
    });

    it('returns partial progress', () => {
      ws.addScore(250);
      // 250 out of 500 needed -> 0.5
      expect(ws.getProgress()).toBeCloseTo(0.5);
    });

    it('returns 1.0 at max level', () => {
      ws.addScore(6000);
      expect(ws.getProgress()).toBe(1.0);
    });
  });

  describe('getBulletPattern', () => {
    it('returns single for Standard', () => {
      expect(ws.getBulletPattern()).toBe('single');
    });

    it('returns single for Accelerated', () => {
      ws.addScore(500);
      expect(ws.getBulletPattern()).toBe('single');
    });

    it('returns double for Double', () => {
      ws.addScore(1500);
      expect(ws.getBulletPattern()).toBe('double');
    });

    it('returns piercing for Piercing', () => {
      ws.addScore(3500);
      expect(ws.getBulletPattern()).toBe('piercing');
    });

    it('returns plasma for Plasma', () => {
      ws.addScore(6000);
      expect(ws.getBulletPattern()).toBe('plasma');
    });
  });

  describe('reset', () => {
    it('resets to level 0 with 0 score', () => {
      ws.addScore(3500);
      expect(ws.getLevel()).toBe(3);
      ws.reset();
      expect(ws.getLevel()).toBe(0);
      expect(ws.getLevelName()).toBe('Standard');
      expect(ws.getProgress()).toBe(0);
    });
  });

  describe('fire pattern configs', () => {
    it('Standard has pattern single', () => {
      const config = ws.getWeaponConfig();
      expect(config.pattern).toBe('single');
    });

    it('Accelerated has pattern single, speed 500, cooldown 100', () => {
      ws.addScore(500);
      const config = ws.getWeaponConfig();
      expect(config.pattern).toBe('single');
      expect(config.bulletSpeed).toBe(500);
      expect(config.fireCooldown).toBe(100);
    });

    it('Double has pattern double', () => {
      ws.addScore(1500);
      const config = ws.getWeaponConfig();
      expect(config.pattern).toBe('double');
    });

    it('Piercing has pattern piercing', () => {
      ws.addScore(3500);
      const config = ws.getWeaponConfig();
      expect(config.pattern).toBe('piercing');
    });

    it('Plasma has pattern plasma', () => {
      ws.addScore(6000);
      const config = ws.getWeaponConfig();
      expect(config.pattern).toBe('plasma');
    });
  });
});
