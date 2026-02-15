import { CONFIG } from '../config';

const STORAGE_KEY = 'space-invaders-settings';

export interface Settings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  masterVolume: CONFIG.audio.masterVolumeDefault,
  sfxVolume: CONFIG.audio.sfxVolumeDefault,
  musicVolume: CONFIG.audio.musicVolumeDefault,
  muted: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class SettingsService {
  private static instance: SettingsService;

  private masterVolume: number;
  private sfxVolume: number;
  private musicVolume: number;
  private muted: boolean;

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  static resetInstance(): void {
    SettingsService.instance = undefined as unknown as SettingsService;
  }

  private constructor() {
    const loaded = this.loadFromStorage();
    this.masterVolume = loaded.masterVolume;
    this.sfxVolume = loaded.sfxVolume;
    this.musicVolume = loaded.musicVolume;
    this.muted = loaded.muted;
  }

  private loadFromStorage(): Settings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        masterVolume: this.masterVolume,
        sfxVolume: this.sfxVolume,
        musicVolume: this.musicVolume,
        muted: this.muted,
      }));
    } catch {
      // localStorage may be unavailable; silently ignore
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setMasterVolume(value: number): void {
    this.masterVolume = clamp(value, 0.0, 1.0);
    this.persist();
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = clamp(value, 0.0, 1.0);
    this.persist();
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  setMusicVolume(value: number): void {
    this.musicVolume = clamp(value, 0.0, 1.0);
    this.persist();
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.persist();
  }

  getEffectiveSfxVolume(): number {
    if (this.muted) return 0;
    return this.sfxVolume * this.masterVolume;
  }

  getEffectiveMusicVolume(): number {
    if (this.muted) return 0;
    return this.musicVolume * this.masterVolume;
  }
}
