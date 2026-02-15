const STORAGE_KEY = 'space-invaders-stats';
const MAX_RECENT_SCORES = 10;

export interface LifetimeStats {
  totalGamesPlayed: number;
  totalPlayTimeMs: number;
  totalAliensDestroyed: number;
  totalShotsFired: number;
  totalShotsHit: number;
  highestScore: number;
  highestWave: number;
  totalUfosDestroyed: number;
  totalBossesDefeated: number;
  totalPowerUpsCollected: number;
  recentScores: number[];
}

export interface SessionStats {
  score: number;
  wave: number;
  playTimeMs: number;
}

const DEFAULT_STATS: LifetimeStats = {
  totalGamesPlayed: 0,
  totalPlayTimeMs: 0,
  totalAliensDestroyed: 0,
  totalShotsFired: 0,
  totalShotsHit: 0,
  highestScore: 0,
  highestWave: 0,
  totalUfosDestroyed: 0,
  totalBossesDefeated: 0,
  totalPowerUpsCollected: 0,
  recentScores: [],
};

export class StatsService {
  private static instance: StatsService;

  static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  static resetInstance(): void {
    StatsService.instance = undefined as unknown as StatsService;
  }

  private constructor() {}

  getStats(): LifetimeStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATS, recentScores: [] };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATS,
        ...parsed,
        recentScores: Array.isArray(parsed.recentScores)
          ? [...parsed.recentScores]
          : [],
      };
    } catch {
      return { ...DEFAULT_STATS, recentScores: [] };
    }
  }

  private save(stats: LifetimeStats): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // localStorage may be unavailable; silently ignore
    }
  }

  recordGameEnd(session: SessionStats): void {
    const stats = this.getStats();
    stats.totalGamesPlayed += 1;
    stats.totalPlayTimeMs += session.playTimeMs;
    stats.highestScore = Math.max(stats.highestScore, session.score);
    stats.highestWave = Math.max(stats.highestWave, session.wave);
    stats.recentScores.push(session.score);
    if (stats.recentScores.length > MAX_RECENT_SCORES) {
      stats.recentScores = stats.recentScores.slice(
        stats.recentScores.length - MAX_RECENT_SCORES
      );
    }
    this.save(stats);
  }

  recordShot(hit: boolean): void {
    const stats = this.getStats();
    stats.totalShotsFired += 1;
    if (hit) {
      stats.totalShotsHit += 1;
    }
    this.save(stats);
  }

  recordAlienKill(): void {
    const stats = this.getStats();
    stats.totalAliensDestroyed += 1;
    this.save(stats);
  }

  recordUfoKill(): void {
    const stats = this.getStats();
    stats.totalUfosDestroyed += 1;
    this.save(stats);
  }

  recordBossKill(): void {
    const stats = this.getStats();
    stats.totalBossesDefeated += 1;
    this.save(stats);
  }

  recordPowerUpCollect(): void {
    const stats = this.getStats();
    stats.totalPowerUpsCollected += 1;
    this.save(stats);
  }

  getAccuracy(): number {
    const stats = this.getStats();
    if (stats.totalShotsFired === 0) return 0;
    return (stats.totalShotsHit / stats.totalShotsFired) * 100;
  }

  getAverageScore(): number {
    const stats = this.getStats();
    if (stats.recentScores.length === 0) return 0;
    const sum = stats.recentScores.reduce((a, b) => a + b, 0);
    return sum / stats.recentScores.length;
  }

  reset(confirm: boolean): void {
    if (!confirm) return;
    this.save({ ...DEFAULT_STATS, recentScores: [] });
  }
}
