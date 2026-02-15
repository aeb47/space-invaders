import { CONFIG } from '../config';

const STORAGE_KEY = 'space-invaders-daily-attempts';
// Epoch for challenge numbering: Jan 1 2026
const EPOCH_DATE = new Date('2026-01-01T00:00:00Z');

interface DailyAttempt {
  official: boolean;
  score: number;
}

type AttemptRecord = Record<string, DailyAttempt>;

export class DailyChallengeService {
  private static instance: DailyChallengeService;
  private attempts: AttemptRecord = {};

  static getInstance(): DailyChallengeService {
    if (!DailyChallengeService.instance) {
      DailyChallengeService.instance = new DailyChallengeService();
    }
    return DailyChallengeService.instance;
  }

  static resetInstance(): void {
    DailyChallengeService.instance = undefined as unknown as DailyChallengeService;
  }

  private constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.attempts = JSON.parse(raw);
      }
    } catch {
      this.attempts = {};
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.attempts));
    } catch {
      // localStorage may be unavailable
    }
  }

  /**
   * Hash a date string into a deterministic positive integer seed.
   */
  static getSeedForDate(dateStr: string): number {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const char = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) || 1; // Ensure positive
  }

  /**
   * Create a seeded PRNG (mulberry32 algorithm).
   */
  static createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s |= 0;
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /**
   * Get the daily modifier for a given date.
   */
  static getDailyModifier(dateStr: string): string {
    const seed = DailyChallengeService.getSeedForDate(dateStr);
    const rng = DailyChallengeService.createSeededRandom(seed);
    const index = Math.floor(rng() * CONFIG.daily.modifiers.length);
    return CONFIG.daily.modifiers[index];
  }

  /**
   * Get the challenge number (days since epoch).
   */
  static getDailyChallengeNumber(dateStr: string): number {
    const date = new Date(dateStr + 'T00:00:00Z');
    const diff = date.getTime() - EPOCH_DATE.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  }

  /**
   * Generate share text for a daily challenge result.
   */
  static generateShareText(dateStr: string, score: number, wave: number, comboMax: number): string {
    const num = DailyChallengeService.getDailyChallengeNumber(dateStr);
    const stars = DailyChallengeService.getStarRating(wave);
    const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const formattedScore = score.toLocaleString();
    return `SPACE INVADERS DAILY #${num}\n${starStr}\nScore: ${formattedScore} | Wave: ${wave} | Combo: ${comboMax}`;
  }

  private static getStarRating(wave: number): number {
    const thresholds = CONFIG.share.starThresholds;
    if (wave >= thresholds[3]) return 5;
    if (wave >= thresholds[2]) return 4;
    if (wave >= thresholds[1]) return 3;
    if (wave >= thresholds[0]) return 2;
    return 1;
  }

  hasOfficialAttempt(dateStr: string): boolean {
    return this.attempts[dateStr]?.official === true;
  }

  getOfficialScore(dateStr: string): number | null {
    const attempt = this.attempts[dateStr];
    if (attempt?.official) return attempt.score;
    return null;
  }

  recordAttempt(dateStr: string, score: number, official: boolean): void {
    if (official) {
      this.attempts[dateStr] = { official: true, score };
    } else if (!this.attempts[dateStr]?.official) {
      // Only record practice if no official exists
      this.attempts[dateStr] = { official: false, score };
    }
    this.save();
  }
}
