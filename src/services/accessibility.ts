const STORAGE_KEY = 'space-invaders-accessibility';

interface ColorPalette {
  shield: string;
  alienBullet: string;
  powerUpSpread: string;
  powerUpRapid: string;
  powerUpShield: string;
  powerUpMultiplier: string;
}

const STANDARD_PALETTE: ColorPalette = {
  shield: '#00ff00',
  alienBullet: '#ff0000',
  powerUpSpread: '#00ffff',
  powerUpRapid: '#ff0000',
  powerUpShield: '#00ff00',
  powerUpMultiplier: '#ffff00',
};

const COLORBLIND_PALETTE: ColorPalette = {
  shield: '#0088ff',
  alienBullet: '#ff8800',
  powerUpSpread: '#00ffff',
  powerUpRapid: '#ff8800',
  powerUpShield: '#0088ff',
  powerUpMultiplier: '#cc00ff',
};

interface StoredSettings {
  highContrast: boolean;
  colorblind: boolean;
  reducedMotion: boolean;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private highContrast = false;
  private colorblind = false;
  private reducedMotion = false;

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  static resetInstance(): void {
    AccessibilityService.instance = undefined as unknown as AccessibilityService;
  }

  private constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: StoredSettings = JSON.parse(raw);
        this.highContrast = data.highContrast ?? false;
        this.colorblind = data.colorblind ?? false;
        this.reducedMotion = data.reducedMotion ?? false;
      }
    } catch {
      // Ignore corrupt data
    }
  }

  private save(): void {
    try {
      const data: StoredSettings = {
        highContrast: this.highContrast,
        colorblind: this.colorblind,
        reducedMotion: this.reducedMotion,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable
    }
  }

  // High Contrast
  isHighContrastEnabled(): boolean {
    return this.highContrast;
  }

  setHighContrast(enabled: boolean): void {
    this.highContrast = enabled;
    this.save();
  }

  // Colorblind
  isColorblindEnabled(): boolean {
    return this.colorblind;
  }

  setColorblind(enabled: boolean): void {
    this.colorblind = enabled;
    this.save();
  }

  getShieldColor(): string {
    return this.colorblind ? COLORBLIND_PALETTE.shield : STANDARD_PALETTE.shield;
  }

  getAlienBulletColor(): string {
    return this.colorblind ? COLORBLIND_PALETTE.alienBullet : STANDARD_PALETTE.alienBullet;
  }

  getColorPalette(): ColorPalette {
    return this.colorblind ? { ...COLORBLIND_PALETTE } : { ...STANDARD_PALETTE };
  }

  // Reduced Motion
  isReducedMotionEnabled(): boolean {
    return this.reducedMotion;
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
    this.save();
  }

  getShakeIntensity(): number {
    return this.reducedMotion ? 0 : 1.0;
  }

  shouldShowParticles(): boolean {
    return !this.reducedMotion;
  }
}
