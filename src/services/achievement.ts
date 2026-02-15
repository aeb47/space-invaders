const STORAGE_KEY = 'space-invaders-achievements';

export interface GameState {
  totalAliensDestroyed: number;
  totalGamesPlayed: number;
  highestWave: number;
  currentWave: number;
  waveClearedNoDamage: boolean;
  waveAccuracy: number;
  waveShotsFired: number;
  waveClearTimeMs: number;
  totalUfosDestroyed: number;
  bossDefeatedThisWave: boolean;
  ufoPointsScored: number;
  currentScore: number;
  comboCount: number;
  consecutiveNoDamageWaves: number;
  isNumberOneOnLeaderboard: boolean;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  condition: (state: GameState) => boolean;
}

interface AchievementData {
  unlocked: string[];
  progress: Record<string, number>;
}

const DEFAULT_DATA: AchievementData = {
  unlocked: [],
  progress: {},
};

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-contact',
    name: 'First Contact',
    description: 'Destroy your first alien',
    condition: (s) => s.totalAliensDestroyed >= 1,
  },
  {
    id: 'quarter-muncher',
    name: 'Quarter Muncher',
    description: 'Play 25 games',
    condition: (s) => s.totalGamesPlayed >= 25,
  },
  {
    id: 'wave-rider',
    name: 'Wave Rider',
    description: 'Reach wave 10',
    condition: (s) => s.highestWave >= 10,
  },
  {
    id: 'perfect-wave',
    name: 'Perfect Wave',
    description: 'Clear a wave without taking damage',
    condition: (s) => s.waveClearedNoDamage,
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Achieve 90% accuracy in a wave with at least 20 shots',
    condition: (s) => s.waveAccuracy >= 90 && s.waveShotsFired >= 20,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Clear a wave in under 12 seconds',
    condition: (s) => s.waveClearTimeMs < 12000,
  },
  {
    id: 'ufo-hunter',
    name: 'UFO Hunter',
    description: 'Destroy 10 UFOs',
    condition: (s) => s.totalUfosDestroyed >= 10,
  },
  {
    id: 'boss-slayer',
    name: 'Boss Slayer',
    description: 'Defeat a boss',
    condition: (s) => s.bossDefeatedThisWave,
  },
  {
    id: 'the-300-club',
    name: 'The 300 Club',
    description: 'Hit a 300-point UFO',
    condition: (s) => s.ufoPointsScored >= 300,
  },
  {
    id: 'marathon-runner',
    name: 'Marathon Runner',
    description: 'Reach wave 20',
    condition: (s) => s.highestWave >= 20,
  },
  {
    id: 'combo-master',
    name: 'Combo Master',
    description: 'Achieve a 10-kill combo',
    condition: (s) => s.comboCount >= 10,
  },
  {
    id: 'no-coin-needed',
    name: 'No Coin Needed',
    description: 'Score 50,000 points',
    condition: (s) => s.currentScore >= 50000,
  },
  {
    id: 'admiral',
    name: 'Admiral',
    description: 'Reach wave 13',
    condition: (s) => s.currentWave >= 13,
  },
  {
    id: 'untouchable',
    name: 'Untouchable',
    description: 'Complete 3 consecutive waves without taking damage',
    condition: (s) => s.consecutiveNoDamageWaves >= 3,
  },
  {
    id: 'high-score-hero',
    name: 'High Score Hero',
    description: 'Hold the #1 spot on a leaderboard',
    condition: (s) => s.isNumberOneOnLeaderboard,
  },
];

export class AchievementService {
  private static instance: AchievementService;

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  static resetInstance(): void {
    AchievementService.instance = undefined as unknown as AchievementService;
  }

  private data: AchievementData;

  private constructor() {
    this.data = this.load();
  }

  private load(): AchievementData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { unlocked: [], progress: {} };
      const parsed = JSON.parse(raw);
      return {
        unlocked: Array.isArray(parsed.unlocked) ? [...parsed.unlocked] : [],
        progress:
          parsed.progress && typeof parsed.progress === 'object'
            ? { ...parsed.progress }
            : {},
      };
    } catch {
      return { unlocked: [], progress: {} };
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // localStorage may be unavailable; silently ignore
    }
  }

  getAllAchievements(): AchievementDef[] {
    return ACHIEVEMENTS;
  }

  isUnlocked(id: string): boolean {
    return this.data.unlocked.includes(id);
  }

  unlock(id: string): boolean {
    if (this.isUnlocked(id)) return false;
    this.data.unlocked.push(id);
    this.save();
    return true;
  }

  getUnlocked(): string[] {
    return [...this.data.unlocked];
  }

  getProgress(id: string): number {
    return this.data.progress[id] ?? 0;
  }

  setProgress(id: string, value: number): void {
    this.data.progress[id] = value;
    this.save();
  }

  checkAchievements(state: GameState): string[] {
    const newlyUnlocked: string[] = [];
    for (const achievement of ACHIEVEMENTS) {
      if (this.isUnlocked(achievement.id)) continue;
      if (achievement.condition(state)) {
        this.unlock(achievement.id);
        newlyUnlocked.push(achievement.id);
      }
    }
    return newlyUnlocked;
  }

  reset(): void {
    this.data = { unlocked: [], progress: {} };
    this.save();
  }
}
