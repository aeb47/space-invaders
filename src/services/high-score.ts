const STORAGE_KEY = 'space-invaders-high-scores';
const MAX_SCORES = 5;

export interface ScoreEntry {
  score: number;
  initials: string;
}

export class HighScoreService {
  private static instance: HighScoreService;
  private cache: ScoreEntry[] = [];

  static getInstance(): HighScoreService {
    if (!HighScoreService.instance) {
      HighScoreService.instance = new HighScoreService();
    }
    return HighScoreService.instance;
  }

  private constructor() {
    // Seed cache from localStorage (instant, synchronous)
    this.cache = this.loadFromStorage();
    // Then refresh from server in background
    this.fetchFromServer();
  }

  getScores(): ScoreEntry[] {
    return [...this.cache];
  }

  getHighScore(): number {
    return this.cache.length > 0 ? this.cache[0].score : 0;
  }

  isHighScore(score: number): boolean {
    if (score <= 0) return false;
    return this.cache.length < MAX_SCORES || score > this.cache[this.cache.length - 1].score;
  }

  addScore(score: number, initials: string = 'AAA'): boolean {
    const qualifies =
      this.cache.length < MAX_SCORES ||
      score > this.cache[this.cache.length - 1].score;

    if (!qualifies) return false;

    // Update cache immediately (synchronous)
    this.cache.push({ score, initials });
    this.cache.sort((a, b) => b.score - a.score);
    this.cache = this.cache.slice(0, MAX_SCORES);

    // Persist to localStorage as offline backup
    this.saveToStorage();

    // Fire-and-forget POST to server
    this.postToServer(score, initials);

    return true;
  }

  /** Refresh cache from server. Call when title screen activates. */
  refreshScores(): void {
    this.fetchFromServer();
  }

  // ---- Private helpers ----

  private loadFromStorage(): ScoreEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: ScoreEntry[] = JSON.parse(raw);
      return parsed
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SCORES);
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch {
      // localStorage may be unavailable; silently ignore
    }
  }

  private async fetchFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/scores');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.scores)) {
        this.cache = (data.scores as ScoreEntry[])
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_SCORES);
        this.saveToStorage();
      }
    } catch {
      // Server unreachable — keep using cached/localStorage data
    }
  }

  private async postToServer(score: number, initials: string): Promise<void> {
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, initials }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.scores && Array.isArray(data.scores)) {
        this.cache = (data.scores as ScoreEntry[])
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_SCORES);
        this.saveToStorage();
      }
    } catch {
      // Server unreachable — score is already in cache and localStorage
    }
  }
}
