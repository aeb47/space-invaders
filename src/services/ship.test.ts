import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShipService } from './ship';

const STORAGE_KEY = 'space-invaders-ships';

describe('ShipService', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    ShipService.resetInstance();
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
      const a = ShipService.getInstance();
      const b = ShipService.getInstance();
      expect(a).toBe(b);
    });

    it('resetInstance creates a fresh instance', () => {
      const a = ShipService.getInstance();
      ShipService.resetInstance();
      const b = ShipService.getInstance();
      expect(a).not.toBe(b);
    });
  });

  describe('getAvailableShips', () => {
    it('returns at least classic by default', () => {
      const svc = ShipService.getInstance();
      const ships = svc.getAvailableShips();
      expect(ships).toContain('classic');
    });

    it('returns all ship type keys from config', () => {
      const svc = ShipService.getInstance();
      const ships = svc.getAvailableShips();
      expect(ships).toContain('classic');
      expect(ships).toContain('interceptor');
      expect(ships).toContain('fortress');
      expect(ships).toContain('sniper');
      expect(ships).toContain('ghost');
    });
  });

  describe('getShipConfig', () => {
    it('returns the config for classic ship', () => {
      const svc = ShipService.getInstance();
      const config = svc.getShipConfig('classic');
      expect(config.speed).toBe(200);
      expect(config.fireCooldown).toBe(150);
      expect(config.maxBullets).toBe(3);
      expect(config.startingLives).toBe(3);
      expect(config.special).toBe('none');
    });

    it('returns the config for interceptor ship', () => {
      const svc = ShipService.getInstance();
      const config = svc.getShipConfig('interceptor');
      expect(config.speed).toBe(280);
      expect(config.fireCooldown).toBe(120);
      expect(config.maxBullets).toBe(2);
    });
  });

  describe('isUnlocked', () => {
    it('returns true for classic by default', () => {
      const svc = ShipService.getInstance();
      expect(svc.isUnlocked('classic')).toBe(true);
    });

    it('returns false for other ships by default', () => {
      const svc = ShipService.getInstance();
      expect(svc.isUnlocked('interceptor')).toBe(false);
      expect(svc.isUnlocked('fortress')).toBe(false);
      expect(svc.isUnlocked('sniper')).toBe(false);
      expect(svc.isUnlocked('ghost')).toBe(false);
    });
  });

  describe('unlockShip', () => {
    it('makes a ship available', () => {
      const svc = ShipService.getInstance();
      expect(svc.isUnlocked('interceptor')).toBe(false);
      svc.unlockShip('interceptor');
      expect(svc.isUnlocked('interceptor')).toBe(true);
    });

    it('persists unlock to localStorage', () => {
      const svc = ShipService.getInstance();
      svc.unlockShip('fortress');
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.unlocked).toContain('fortress');
    });
  });

  describe('getSelectedShip', () => {
    it('returns classic by default', () => {
      const svc = ShipService.getInstance();
      expect(svc.getSelectedShip()).toBe('classic');
    });
  });

  describe('setSelectedShip', () => {
    it('changes selected ship when unlocked', () => {
      const svc = ShipService.getInstance();
      svc.unlockShip('interceptor');
      const result = svc.setSelectedShip('interceptor');
      expect(result).toBe(true);
      expect(svc.getSelectedShip()).toBe('interceptor');
    });

    it('returns false when trying to select a locked ship', () => {
      const svc = ShipService.getInstance();
      const result = svc.setSelectedShip('ghost');
      expect(result).toBe(false);
      expect(svc.getSelectedShip()).toBe('classic');
    });

    it('persists selection to localStorage', () => {
      const svc = ShipService.getInstance();
      svc.unlockShip('sniper');
      svc.setSelectedShip('sniper');
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.selected).toBe('sniper');
    });
  });

  describe('persistence', () => {
    it('loads unlocked ships from localStorage', () => {
      storage[STORAGE_KEY] = JSON.stringify({
        unlocked: ['classic', 'interceptor', 'ghost'],
        selected: 'interceptor',
      });
      const svc = ShipService.getInstance();
      expect(svc.isUnlocked('interceptor')).toBe(true);
      expect(svc.isUnlocked('ghost')).toBe(true);
      expect(svc.getSelectedShip()).toBe('interceptor');
    });

    it('handles corrupted localStorage gracefully', () => {
      storage[STORAGE_KEY] = 'not-valid-json!!!';
      const svc = ShipService.getInstance();
      expect(svc.getSelectedShip()).toBe('classic');
      expect(svc.isUnlocked('classic')).toBe(true);
    });
  });
});
