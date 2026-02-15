import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CosmeticsService } from './cosmetics';

const STORAGE_KEY = 'space-invaders-cosmetics';

describe('CosmeticsService', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    CosmeticsService.resetInstance();
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
      const a = CosmeticsService.getInstance();
      const b = CosmeticsService.getInstance();
      expect(a).toBe(b);
    });

    it('resetInstance creates a fresh instance', () => {
      const a = CosmeticsService.getInstance();
      CosmeticsService.resetInstance();
      const b = CosmeticsService.getInstance();
      expect(a).not.toBe(b);
    });
  });

  describe('getUnlockedTrails', () => {
    it('returns default initially', () => {
      const svc = CosmeticsService.getInstance();
      expect(svc.getUnlockedTrails()).toEqual(['default']);
    });
  });

  describe('getUnlockedExplosions', () => {
    it('returns default initially', () => {
      const svc = CosmeticsService.getInstance();
      expect(svc.getUnlockedExplosions()).toEqual(['default']);
    });
  });

  describe('getUnlockedBackgrounds', () => {
    it('returns deep-space initially', () => {
      const svc = CosmeticsService.getInstance();
      expect(svc.getUnlockedBackgrounds()).toEqual(['deep-space']);
    });
  });

  describe('unlockTrail', () => {
    it('adds to unlocked list', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockTrail('blue-plasma');
      expect(svc.getUnlockedTrails()).toContain('blue-plasma');
    });

    it('does not duplicate', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockTrail('default');
      expect(svc.getUnlockedTrails().filter((t) => t === 'default').length).toBe(1);
    });

    it('persists to localStorage', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockTrail('red-laser');
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.unlockedTrails).toContain('red-laser');
    });
  });

  describe('unlockExplosion', () => {
    it('adds to unlocked list', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockExplosion('pixel-burst');
      expect(svc.getUnlockedExplosions()).toContain('pixel-burst');
    });
  });

  describe('unlockBackground', () => {
    it('adds to unlocked list', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockBackground('nebula');
      expect(svc.getUnlockedBackgrounds()).toContain('nebula');
    });
  });

  describe('getSelectedTrail / setSelectedTrail', () => {
    it('returns default initially', () => {
      const svc = CosmeticsService.getInstance();
      expect(svc.getSelectedTrail()).toBe('default');
    });

    it('changes when set to unlocked trail', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockTrail('green-retro');
      const result = svc.setSelectedTrail('green-retro');
      expect(result).toBe(true);
      expect(svc.getSelectedTrail()).toBe('green-retro');
    });

    it('returns false when set to locked trail', () => {
      const svc = CosmeticsService.getInstance();
      const result = svc.setSelectedTrail('rainbow');
      expect(result).toBe(false);
      expect(svc.getSelectedTrail()).toBe('default');
    });
  });

  describe('getSelectedExplosion / setSelectedExplosion', () => {
    it('returns default initially', () => {
      const svc = CosmeticsService.getInstance();
      expect(svc.getSelectedExplosion()).toBe('default');
    });

    it('changes when set to unlocked explosion', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockExplosion('fireworks');
      const result = svc.setSelectedExplosion('fireworks');
      expect(result).toBe(true);
      expect(svc.getSelectedExplosion()).toBe('fireworks');
    });

    it('returns false when set to locked explosion', () => {
      const svc = CosmeticsService.getInstance();
      const result = svc.setSelectedExplosion('vaporize');
      expect(result).toBe(false);
      expect(svc.getSelectedExplosion()).toBe('default');
    });
  });

  describe('getSelectedBackground / setSelectedBackground', () => {
    it('returns deep-space initially', () => {
      const svc = CosmeticsService.getInstance();
      expect(svc.getSelectedBackground()).toBe('deep-space');
    });

    it('changes when set to unlocked background', () => {
      const svc = CosmeticsService.getInstance();
      svc.unlockBackground('synthwave');
      const result = svc.setSelectedBackground('synthwave');
      expect(result).toBe(true);
      expect(svc.getSelectedBackground()).toBe('synthwave');
    });

    it('returns false when set to locked background', () => {
      const svc = CosmeticsService.getInstance();
      const result = svc.setSelectedBackground('retro-crt');
      expect(result).toBe(false);
      expect(svc.getSelectedBackground()).toBe('deep-space');
    });
  });

  describe('checkUnlocks', () => {
    it('unlocks trails based on lifetime score thresholds', () => {
      const svc = CosmeticsService.getInstance();
      // trailUnlockScores: [0, 10000, 25000, 50000, 100000]
      // bulletTrails: ['default', 'blue-plasma', 'red-laser', 'green-retro', 'rainbow']
      svc.checkUnlocks(10000, 0);
      expect(svc.getUnlockedTrails()).toContain('default');
      expect(svc.getUnlockedTrails()).toContain('blue-plasma');
      expect(svc.getUnlockedTrails()).not.toContain('red-laser');
    });

    it('unlocks multiple trails at higher scores', () => {
      const svc = CosmeticsService.getInstance();
      svc.checkUnlocks(50000, 0);
      expect(svc.getUnlockedTrails()).toContain('default');
      expect(svc.getUnlockedTrails()).toContain('blue-plasma');
      expect(svc.getUnlockedTrails()).toContain('red-laser');
      expect(svc.getUnlockedTrails()).toContain('green-retro');
      expect(svc.getUnlockedTrails()).not.toContain('rainbow');
    });

    it('unlocks all trails at max score', () => {
      const svc = CosmeticsService.getInstance();
      svc.checkUnlocks(100000, 0);
      expect(svc.getUnlockedTrails()).toEqual(
        expect.arrayContaining(['default', 'blue-plasma', 'red-laser', 'green-retro', 'rainbow'])
      );
    });

    it('unlocks backgrounds based on play time minutes', () => {
      const svc = CosmeticsService.getInstance();
      // backgroundUnlockMinutes: [0, 60, 180, 300, 600]
      // backgrounds: ['deep-space', 'nebula', 'asteroid-field', 'retro-crt', 'synthwave']
      svc.checkUnlocks(0, 60);
      expect(svc.getUnlockedBackgrounds()).toContain('deep-space');
      expect(svc.getUnlockedBackgrounds()).toContain('nebula');
      expect(svc.getUnlockedBackgrounds()).not.toContain('asteroid-field');
    });

    it('unlocks all backgrounds at max play time', () => {
      const svc = CosmeticsService.getInstance();
      svc.checkUnlocks(0, 600);
      expect(svc.getUnlockedBackgrounds()).toEqual(
        expect.arrayContaining(['deep-space', 'nebula', 'asteroid-field', 'retro-crt', 'synthwave'])
      );
    });
  });

  describe('persistence', () => {
    it('loads state from localStorage', () => {
      storage[STORAGE_KEY] = JSON.stringify({
        unlockedTrails: ['default', 'blue-plasma'],
        unlockedExplosions: ['default', 'fireworks'],
        unlockedBackgrounds: ['deep-space', 'nebula'],
        selectedTrail: 'blue-plasma',
        selectedExplosion: 'fireworks',
        selectedBackground: 'nebula',
      });
      const svc = CosmeticsService.getInstance();
      expect(svc.getUnlockedTrails()).toEqual(['default', 'blue-plasma']);
      expect(svc.getSelectedTrail()).toBe('blue-plasma');
      expect(svc.getSelectedExplosion()).toBe('fireworks');
      expect(svc.getSelectedBackground()).toBe('nebula');
    });

    it('handles corrupted localStorage gracefully', () => {
      storage[STORAGE_KEY] = 'not-valid-json!!!';
      const svc = CosmeticsService.getInstance();
      expect(svc.getUnlockedTrails()).toEqual(['default']);
      expect(svc.getSelectedTrail()).toBe('default');
    });
  });
});
