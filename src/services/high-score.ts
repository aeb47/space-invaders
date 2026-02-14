const STORAGE_KEY = 'space-invaders-high-scores';
const MAX_SCORES = 5;

export interface ScoreEntry {
  score: number;
  initials: string;
}

export class HighScoreService {
  private static instance: HighScoreService;

  static getInstance(): HighScoreService {
    if (!HighScoreService.instance) {
      HighScoreService.instance = new HighScoreService();
    }
    return HighScoreService.instance;
  }

  private constructor() {}

  getScores(): ScoreEntry[] {
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

  getHighScore(): number {
    const scores = this.getScores();
    return scores.length > 0 ? scores[0].score : 0;
  }

  isHighScore(score: number): boolean {
    if (score <= 0) return false;
    const scores = this.getScores();
    return scores.length < MAX_SCORES || score > scores[scores.length - 1].score;
  }

  addScore(score: number, initials: string = 'AAA'): boolean {
    const scores = this.getScores();
    const qualifies =
      scores.length < MAX_SCORES ||
      score > scores[scores.length - 1].score;

    if (!qualifies) return false;

    scores.push({ score, initials });
    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, MAX_SCORES);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
    } catch {
      // localStorage may be unavailable; silently ignore
    }

    return true;
  }
}
