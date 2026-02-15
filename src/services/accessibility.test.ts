import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccessibilityService } from './accessibility';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
});

describe('AccessibilityService', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    AccessibilityService.resetInstance();
  });

  const service = () => AccessibilityService.getInstance();

  it('is a singleton', () => {
    expect(service()).toBe(service());
  });

  describe('high contrast mode', () => {
    it('is off by default', () => {
      expect(service().isHighContrastEnabled()).toBe(false);
    });

    it('can be toggled on', () => {
      service().setHighContrast(true);
      expect(service().isHighContrastEnabled()).toBe(true);
    });

    it('can be toggled off', () => {
      service().setHighContrast(true);
      service().setHighContrast(false);
      expect(service().isHighContrastEnabled()).toBe(false);
    });
  });

  describe('colorblind mode', () => {
    it('is off by default', () => {
      expect(service().isColorblindEnabled()).toBe(false);
    });

    it('can be enabled', () => {
      service().setColorblind(true);
      expect(service().isColorblindEnabled()).toBe(true);
    });

    it('getShieldColor returns green normally', () => {
      expect(service().getShieldColor()).toBe('#00ff00');
    });

    it('getShieldColor returns blue in colorblind mode', () => {
      service().setColorblind(true);
      expect(service().getShieldColor()).toBe('#0088ff');
    });

    it('getAlienBulletColor returns red normally', () => {
      expect(service().getAlienBulletColor()).toBe('#ff0000');
    });

    it('getAlienBulletColor returns orange in colorblind mode', () => {
      service().setColorblind(true);
      expect(service().getAlienBulletColor()).toBe('#ff8800');
    });
  });

  describe('reduced motion', () => {
    it('is off by default', () => {
      expect(service().isReducedMotionEnabled()).toBe(false);
    });

    it('can be enabled', () => {
      service().setReducedMotion(true);
      expect(service().isReducedMotionEnabled()).toBe(true);
    });

    it('getShakeIntensity returns 1.0 normally', () => {
      expect(service().getShakeIntensity()).toBe(1.0);
    });

    it('getShakeIntensity returns 0 with reduced motion', () => {
      service().setReducedMotion(true);
      expect(service().getShakeIntensity()).toBe(0);
    });

    it('shouldShowParticles returns true normally', () => {
      expect(service().shouldShowParticles()).toBe(true);
    });

    it('shouldShowParticles returns false with reduced motion', () => {
      service().setReducedMotion(true);
      expect(service().shouldShowParticles()).toBe(false);
    });
  });

  describe('persistence', () => {
    it('settings persist across instances', () => {
      service().setHighContrast(true);
      service().setColorblind(true);
      service().setReducedMotion(true);
      AccessibilityService.resetInstance();
      const s = AccessibilityService.getInstance();
      expect(s.isHighContrastEnabled()).toBe(true);
      expect(s.isColorblindEnabled()).toBe(true);
      expect(s.isReducedMotionEnabled()).toBe(true);
    });
  });

  describe('getColorPalette', () => {
    it('returns standard palette by default', () => {
      const palette = service().getColorPalette();
      expect(palette.shield).toBe('#00ff00');
      expect(palette.alienBullet).toBe('#ff0000');
      expect(palette.powerUpMultiplier).toBe('#ffff00');
    });

    it('returns colorblind-safe palette when enabled', () => {
      service().setColorblind(true);
      const palette = service().getColorPalette();
      expect(palette.shield).toBe('#0088ff');
      expect(palette.alienBullet).toBe('#ff8800');
      expect(palette.powerUpMultiplier).toBe('#cc00ff');
    });
  });
});
