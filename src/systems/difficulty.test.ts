import { describe, it, expect, beforeEach } from 'vitest';
import { CONFIG } from '../config';
import {
  DifficultyTierSystem,
  getDifficultyConfig,
  getEffectiveFireInterval,
  getEffectiveLives,
  getEffectiveBulletSpeed,
} from './difficulty';

describe('DifficultyTierSystem', () => {
  let system: DifficultyTierSystem;

  beforeEach(() => {
    system = new DifficultyTierSystem();
  });

  describe('getTier', () => {
    it('returns recruit for wave 1', () => {
      expect(system.getTier(1)).toBe('recruit');
    });

    it('returns soldier for wave 4', () => {
      expect(system.getTier(4)).toBe('soldier');
    });

    it('returns veteran for wave 7', () => {
      expect(system.getTier(7)).toBe('veteran');
    });

    it('returns commander for wave 10', () => {
      expect(system.getTier(10)).toBe('commander');
    });

    it('returns admiral for wave 13', () => {
      expect(system.getTier(13)).toBe('admiral');
    });

    it('returns admiral for wave 99', () => {
      expect(system.getTier(99)).toBe('admiral');
    });
  });

  describe('getTierLabel', () => {
    it('returns uppercase tier name for wave 1', () => {
      expect(system.getTierLabel(1)).toBe('RECRUIT');
    });

    it('returns uppercase tier name for wave 7', () => {
      expect(system.getTierLabel(7)).toBe('VETERAN');
    });

    it('returns uppercase tier name for wave 13', () => {
      expect(system.getTierLabel(13)).toBe('ADMIRAL');
    });
  });

  describe('isDiveBombEnabled', () => {
    it('returns false for wave 1', () => {
      expect(system.isDiveBombEnabled(1)).toBe(false);
    });

    it('returns false for wave 6', () => {
      expect(system.isDiveBombEnabled(6)).toBe(false);
    });

    it('returns true for wave 7', () => {
      expect(system.isDiveBombEnabled(7)).toBe(true);
    });

    it('returns true for wave 10', () => {
      expect(system.isDiveBombEnabled(10)).toBe(true);
    });
  });

  describe('isSplitFormationEnabled', () => {
    it('returns false for wave 1', () => {
      expect(system.isSplitFormationEnabled(1)).toBe(false);
    });

    it('returns false for wave 9', () => {
      expect(system.isSplitFormationEnabled(9)).toBe(false);
    });

    it('returns true for wave 10', () => {
      expect(system.isSplitFormationEnabled(10)).toBe(true);
    });

    it('returns true for wave 13', () => {
      expect(system.isSplitFormationEnabled(13)).toBe(true);
    });
  });

  describe('isEscortEnabled', () => {
    it('returns false for wave 1', () => {
      expect(system.isEscortEnabled(1)).toBe(false);
    });

    it('returns false for wave 12', () => {
      expect(system.isEscortEnabled(12)).toBe(false);
    });

    it('returns true for wave 13', () => {
      expect(system.isEscortEnabled(13)).toBe(true);
    });

    it('returns true for wave 20', () => {
      expect(system.isEscortEnabled(20)).toBe(true);
    });
  });

  describe('getDiveBombChance', () => {
    it('returns 0 for waves where dive bomb is disabled', () => {
      expect(system.getDiveBombChance(1)).toBe(0);
    });

    it('returns CONFIG.diveBomb.chance for waves where dive bomb is enabled', () => {
      expect(system.getDiveBombChance(7)).toBe(CONFIG.diveBomb.chance);
    });
  });

  describe('getNewTierIfChanged', () => {
    it('returns new tier name when tier changes', () => {
      expect(system.getNewTierIfChanged(4, 3)).toBe('soldier');
    });

    it('returns null when tier stays the same', () => {
      expect(system.getNewTierIfChanged(5, 4)).toBeNull();
    });

    it('returns new tier when transitioning to veteran', () => {
      expect(system.getNewTierIfChanged(7, 6)).toBe('veteran');
    });

    it('returns null when staying in recruit tier', () => {
      expect(system.getNewTierIfChanged(2, 1)).toBeNull();
    });
  });
});

describe('DifficultyLevel', () => {
  describe('getDifficultyConfig', () => {
    it('returns recruit settings', () => {
      const config = getDifficultyConfig('recruit');
      expect(config.lives).toBe(5);
      expect(config.alienFireIntervalBonus).toBe(500);
      expect(config.alienBulletSpeed).toBe(100);
      expect(config.shieldBlockHp).toBe(4);
      expect(config.ufoPointsMultiplier).toBe(2);
      expect(config.label).toBe('RECRUIT');
    });

    it('returns veteran settings', () => {
      const config = getDifficultyConfig('veteran');
      expect(config.lives).toBe(3);
      expect(config.alienFireIntervalBonus).toBe(0);
      expect(config.alienBulletSpeed).toBe(150);
      expect(config.shieldBlockHp).toBe(3);
      expect(config.ufoPointsMultiplier).toBe(1);
    });

    it('returns admiral settings', () => {
      const config = getDifficultyConfig('admiral');
      expect(config.lives).toBe(2);
      expect(config.alienFireIntervalBonus).toBe(-200);
      expect(config.alienBulletSpeed).toBe(200);
      expect(config.shieldBlockHp).toBe(0);
      expect(config.ufoPointsMultiplier).toBe(1);
    });
  });

  describe('getEffectiveFireInterval', () => {
    it('adds bonus for recruit difficulty', () => {
      const baseInterval = 1500;
      expect(getEffectiveFireInterval(baseInterval, 'recruit')).toBe(2000);
    });

    it('returns base interval for veteran difficulty', () => {
      const baseInterval = 1500;
      expect(getEffectiveFireInterval(baseInterval, 'veteran')).toBe(1500);
    });

    it('subtracts penalty for admiral difficulty', () => {
      const baseInterval = 1500;
      expect(getEffectiveFireInterval(baseInterval, 'admiral')).toBe(1300);
    });
  });

  describe('getEffectiveLives', () => {
    it('returns 5 for recruit', () => {
      expect(getEffectiveLives('recruit')).toBe(5);
    });

    it('returns 3 for veteran', () => {
      expect(getEffectiveLives('veteran')).toBe(3);
    });

    it('returns 2 for admiral', () => {
      expect(getEffectiveLives('admiral')).toBe(2);
    });
  });

  describe('getEffectiveBulletSpeed', () => {
    it('returns 100 for recruit', () => {
      expect(getEffectiveBulletSpeed('recruit')).toBe(100);
    });

    it('returns 150 for veteran', () => {
      expect(getEffectiveBulletSpeed('veteran')).toBe(150);
    });

    it('returns 200 for admiral', () => {
      expect(getEffectiveBulletSpeed('admiral')).toBe(200);
    });
  });
});
