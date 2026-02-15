import { CONFIG, CosmeticBulletTrail, CosmeticExplosionStyle, CosmeticBackground } from '../config';

const STORAGE_KEY = 'space-invaders-cosmetics';

interface CosmeticsData {
  unlockedTrails: string[];
  unlockedExplosions: string[];
  unlockedBackgrounds: string[];
  selectedTrail: string;
  selectedExplosion: string;
  selectedBackground: string;
}

const DEFAULT_DATA: CosmeticsData = {
  unlockedTrails: ['default'],
  unlockedExplosions: ['default'],
  unlockedBackgrounds: ['deep-space'],
  selectedTrail: 'default',
  selectedExplosion: 'default',
  selectedBackground: 'deep-space',
};

export class CosmeticsService {
  private static instance: CosmeticsService;

  static getInstance(): CosmeticsService {
    if (!CosmeticsService.instance) {
      CosmeticsService.instance = new CosmeticsService();
    }
    return CosmeticsService.instance;
  }

  static resetInstance(): void {
    CosmeticsService.instance = undefined as unknown as CosmeticsService;
  }

  private constructor() {}

  private load(): CosmeticsData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.cloneDefaults();
      const parsed = JSON.parse(raw);
      return {
        unlockedTrails: Array.isArray(parsed.unlockedTrails) ? [...parsed.unlockedTrails] : [...DEFAULT_DATA.unlockedTrails],
        unlockedExplosions: Array.isArray(parsed.unlockedExplosions) ? [...parsed.unlockedExplosions] : [...DEFAULT_DATA.unlockedExplosions],
        unlockedBackgrounds: Array.isArray(parsed.unlockedBackgrounds) ? [...parsed.unlockedBackgrounds] : [...DEFAULT_DATA.unlockedBackgrounds],
        selectedTrail: parsed.selectedTrail ?? DEFAULT_DATA.selectedTrail,
        selectedExplosion: parsed.selectedExplosion ?? DEFAULT_DATA.selectedExplosion,
        selectedBackground: parsed.selectedBackground ?? DEFAULT_DATA.selectedBackground,
      };
    } catch {
      return this.cloneDefaults();
    }
  }

  private cloneDefaults(): CosmeticsData {
    return {
      ...DEFAULT_DATA,
      unlockedTrails: [...DEFAULT_DATA.unlockedTrails],
      unlockedExplosions: [...DEFAULT_DATA.unlockedExplosions],
      unlockedBackgrounds: [...DEFAULT_DATA.unlockedBackgrounds],
    };
  }

  private save(data: CosmeticsData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable; silently ignore
    }
  }

  getUnlockedTrails(): string[] {
    return this.load().unlockedTrails;
  }

  getUnlockedExplosions(): string[] {
    return this.load().unlockedExplosions;
  }

  getUnlockedBackgrounds(): string[] {
    return this.load().unlockedBackgrounds;
  }

  unlockTrail(name: CosmeticBulletTrail | string): void {
    const data = this.load();
    if (!data.unlockedTrails.includes(name)) {
      data.unlockedTrails.push(name);
    }
    this.save(data);
  }

  unlockExplosion(name: CosmeticExplosionStyle | string): void {
    const data = this.load();
    if (!data.unlockedExplosions.includes(name)) {
      data.unlockedExplosions.push(name);
    }
    this.save(data);
  }

  unlockBackground(name: CosmeticBackground | string): void {
    const data = this.load();
    if (!data.unlockedBackgrounds.includes(name)) {
      data.unlockedBackgrounds.push(name);
    }
    this.save(data);
  }

  getSelectedTrail(): string {
    return this.load().selectedTrail;
  }

  setSelectedTrail(name: CosmeticBulletTrail | string): boolean {
    const data = this.load();
    if (!data.unlockedTrails.includes(name)) return false;
    data.selectedTrail = name;
    this.save(data);
    return true;
  }

  getSelectedExplosion(): string {
    return this.load().selectedExplosion;
  }

  setSelectedExplosion(name: CosmeticExplosionStyle | string): boolean {
    const data = this.load();
    if (!data.unlockedExplosions.includes(name)) return false;
    data.selectedExplosion = name;
    this.save(data);
    return true;
  }

  getSelectedBackground(): string {
    return this.load().selectedBackground;
  }

  setSelectedBackground(name: CosmeticBackground | string): boolean {
    const data = this.load();
    if (!data.unlockedBackgrounds.includes(name)) return false;
    data.selectedBackground = name;
    this.save(data);
    return true;
  }

  checkUnlocks(lifetimeScore: number, playTimeMinutes: number): void {
    const data = this.load();
    const { bulletTrails, trailUnlockScores, backgrounds, backgroundUnlockMinutes } = CONFIG.cosmetics;

    // Unlock trails based on score thresholds
    for (let i = 0; i < trailUnlockScores.length; i++) {
      if (lifetimeScore >= trailUnlockScores[i] && !data.unlockedTrails.includes(bulletTrails[i])) {
        data.unlockedTrails.push(bulletTrails[i]);
      }
    }

    // Unlock backgrounds based on play time thresholds
    for (let i = 0; i < backgroundUnlockMinutes.length; i++) {
      if (playTimeMinutes >= backgroundUnlockMinutes[i] && !data.unlockedBackgrounds.includes(backgrounds[i])) {
        data.unlockedBackgrounds.push(backgrounds[i]);
      }
    }

    this.save(data);
  }
}
