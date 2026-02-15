import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from './settings';

const STORAGE_KEY = 'space-invaders-settings';

describe('SettingsService', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    SettingsService.resetInstance();
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
      const a = SettingsService.getInstance();
      const b = SettingsService.getInstance();
      expect(a).toBe(b);
    });

    it('resetInstance clears the singleton', () => {
      const a = SettingsService.getInstance();
      SettingsService.resetInstance();
      const b = SettingsService.getInstance();
      expect(a).not.toBe(b);
    });
  });

  describe('default values', () => {
    it('has correct defaults', () => {
      const svc = SettingsService.getInstance();
      expect(svc.getMasterVolume()).toBe(0.80);
      expect(svc.getSfxVolume()).toBe(1.00);
      expect(svc.getMusicVolume()).toBe(0.70);
      expect(svc.isMuted()).toBe(false);
    });
  });

  describe('setMasterVolume', () => {
    it('updates value and persists to localStorage', () => {
      const svc = SettingsService.getInstance();
      svc.setMasterVolume(0.5);
      expect(svc.getMasterVolume()).toBe(0.5);
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.masterVolume).toBe(0.5);
    });

    it('clamps value to 0.0 minimum', () => {
      const svc = SettingsService.getInstance();
      svc.setMasterVolume(-0.5);
      expect(svc.getMasterVolume()).toBe(0.0);
    });

    it('clamps value to 1.0 maximum', () => {
      const svc = SettingsService.getInstance();
      svc.setMasterVolume(1.5);
      expect(svc.getMasterVolume()).toBe(1.0);
    });
  });

  describe('setSfxVolume', () => {
    it('updates value and persists to localStorage', () => {
      const svc = SettingsService.getInstance();
      svc.setSfxVolume(0.6);
      expect(svc.getSfxVolume()).toBe(0.6);
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.sfxVolume).toBe(0.6);
    });

    it('clamps value to 0.0-1.0 range', () => {
      const svc = SettingsService.getInstance();
      svc.setSfxVolume(-1);
      expect(svc.getSfxVolume()).toBe(0.0);
      svc.setSfxVolume(2);
      expect(svc.getSfxVolume()).toBe(1.0);
    });
  });

  describe('setMusicVolume', () => {
    it('updates value and persists to localStorage', () => {
      const svc = SettingsService.getInstance();
      svc.setMusicVolume(0.3);
      expect(svc.getMusicVolume()).toBe(0.3);
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.musicVolume).toBe(0.3);
    });

    it('clamps value to 0.0-1.0 range', () => {
      const svc = SettingsService.getInstance();
      svc.setMusicVolume(-0.1);
      expect(svc.getMusicVolume()).toBe(0.0);
      svc.setMusicVolume(1.1);
      expect(svc.getMusicVolume()).toBe(1.0);
    });
  });

  describe('toggleMute', () => {
    it('toggles from unmuted to muted', () => {
      const svc = SettingsService.getInstance();
      svc.toggleMute();
      expect(svc.isMuted()).toBe(true);
    });

    it('toggles from muted to unmuted', () => {
      storage[STORAGE_KEY] = JSON.stringify({ muted: true });
      const svc = SettingsService.getInstance();
      svc.toggleMute();
      expect(svc.isMuted()).toBe(false);
    });

    it('persists mute state', () => {
      const svc = SettingsService.getInstance();
      svc.toggleMute();
      const saved = JSON.parse(storage[STORAGE_KEY]);
      expect(saved.muted).toBe(true);
    });
  });

  describe('getEffectiveSfxVolume', () => {
    it('returns sfxVolume * masterVolume', () => {
      const svc = SettingsService.getInstance();
      svc.setMasterVolume(0.5);
      svc.setSfxVolume(0.8);
      expect(svc.getEffectiveSfxVolume()).toBeCloseTo(0.4);
    });

    it('returns 0 when muted', () => {
      const svc = SettingsService.getInstance();
      svc.setMasterVolume(0.5);
      svc.setSfxVolume(0.8);
      svc.toggleMute();
      expect(svc.getEffectiveSfxVolume()).toBe(0);
    });

    it('uses default values correctly', () => {
      const svc = SettingsService.getInstance();
      // masterVolume=0.80, sfxVolume=1.00 => 0.80
      expect(svc.getEffectiveSfxVolume()).toBeCloseTo(0.80);
    });
  });

  describe('getEffectiveMusicVolume', () => {
    it('returns musicVolume * masterVolume', () => {
      const svc = SettingsService.getInstance();
      svc.setMasterVolume(0.5);
      svc.setMusicVolume(0.6);
      expect(svc.getEffectiveMusicVolume()).toBeCloseTo(0.3);
    });

    it('returns 0 when muted', () => {
      const svc = SettingsService.getInstance();
      svc.setMasterVolume(0.5);
      svc.setMusicVolume(0.6);
      svc.toggleMute();
      expect(svc.getEffectiveMusicVolume()).toBe(0);
    });

    it('uses default values correctly', () => {
      const svc = SettingsService.getInstance();
      // masterVolume=0.80, musicVolume=0.70 => 0.56
      expect(svc.getEffectiveMusicVolume()).toBeCloseTo(0.56);
    });
  });

  describe('localStorage loading', () => {
    it('loads settings from localStorage on construction', () => {
      storage[STORAGE_KEY] = JSON.stringify({
        masterVolume: 0.5,
        sfxVolume: 0.6,
        musicVolume: 0.3,
        muted: true,
      });
      const svc = SettingsService.getInstance();
      expect(svc.getMasterVolume()).toBe(0.5);
      expect(svc.getSfxVolume()).toBe(0.6);
      expect(svc.getMusicVolume()).toBe(0.3);
      expect(svc.isMuted()).toBe(true);
    });

    it('returns defaults when localStorage has corrupted data', () => {
      storage[STORAGE_KEY] = 'not-valid-json!!!';
      const svc = SettingsService.getInstance();
      expect(svc.getMasterVolume()).toBe(0.80);
      expect(svc.getSfxVolume()).toBe(1.00);
      expect(svc.getMusicVolume()).toBe(0.70);
      expect(svc.isMuted()).toBe(false);
    });

    it('merges partial saved data with defaults', () => {
      storage[STORAGE_KEY] = JSON.stringify({ masterVolume: 0.2 });
      const svc = SettingsService.getInstance();
      expect(svc.getMasterVolume()).toBe(0.2);
      expect(svc.getSfxVolume()).toBe(1.0);
      expect(svc.getMusicVolume()).toBe(0.7);
      expect(svc.isMuted()).toBe(false);
    });
  });

  describe('persistence across instances', () => {
    it('settings persist across singleton resets', () => {
      const svc1 = SettingsService.getInstance();
      svc1.setMasterVolume(0.3);
      svc1.setSfxVolume(0.4);
      svc1.setMusicVolume(0.5);
      svc1.toggleMute();

      SettingsService.resetInstance();

      const svc2 = SettingsService.getInstance();
      expect(svc2.getMasterVolume()).toBe(0.3);
      expect(svc2.getSfxVolume()).toBe(0.4);
      expect(svc2.getMusicVolume()).toBe(0.5);
      expect(svc2.isMuted()).toBe(true);
    });
  });
});
