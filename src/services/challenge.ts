const STORAGE_KEY = 'space-invaders-challenges';

export type ChallengeRating = 'bronze' | 'silver' | 'gold';

const RATING_ORDER: Record<ChallengeRating, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

export interface ChallengeResult {
  wavesCleared?: number;
  livesRemaining?: number;
  accuracy?: number;
  timeSeconds?: number;
  kills?: number;
  score?: number;
  bossesDefeated?: number;
  survivalSeconds?: number;
}

export interface ChallengeDefinition {
  id: number;
  name: string;
  description: string;
  bronze: string;
  silver: string;
  gold: string;
  evaluate: (result: ChallengeResult) => ChallengeRating | null;
}

const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 1,
    name: 'Boot Camp',
    description: 'Standard wave, 5 lives',
    bronze: 'Clear wave',
    silver: 'Clear with 3+ lives',
    gold: 'Clear with 5 lives',
    evaluate: (r) => {
      if (!r.wavesCleared || r.wavesCleared < 1) return null;
      if ((r.livesRemaining ?? 0) >= 5) return 'gold';
      if ((r.livesRemaining ?? 0) >= 3) return 'silver';
      return 'bronze';
    },
  },
  {
    id: 2,
    name: 'Sharpshooter',
    description: 'Only 30 bullets for the entire wave',
    bronze: 'Clear wave',
    silver: '70% accuracy',
    gold: '90% accuracy',
    evaluate: (r) => {
      if (!r.wavesCleared || r.wavesCleared < 1) return null;
      if ((r.accuracy ?? 0) >= 90) return 'gold';
      if ((r.accuracy ?? 0) >= 70) return 'silver';
      return 'bronze';
    },
  },
  {
    id: 3,
    name: 'Speed Run',
    description: 'Clear 3 waves as fast as possible',
    bronze: 'Under 120s',
    silver: 'Under 90s',
    gold: 'Under 60s',
    evaluate: (r) => {
      if (!r.wavesCleared || r.wavesCleared < 3) return null;
      if ((r.timeSeconds ?? Infinity) < 60) return 'gold';
      if ((r.timeSeconds ?? Infinity) < 90) return 'silver';
      if ((r.timeSeconds ?? Infinity) < 120) return 'bronze';
      return null;
    },
  },
  {
    id: 4,
    name: 'No Miss',
    description: '1 life, standard wave',
    bronze: 'Reach 20 kills',
    silver: 'Reach 40 kills',
    gold: 'Clear wave',
    evaluate: (r) => {
      if (r.wavesCleared && r.wavesCleared >= 1) return 'gold';
      if ((r.kills ?? 0) >= 40) return 'silver';
      if ((r.kills ?? 0) >= 20) return 'bronze';
      return null;
    },
  },
  {
    id: 5,
    name: 'Bullet Hell',
    description: 'Triple alien fire rate',
    bronze: 'Survive 60s',
    silver: 'Survive 120s',
    gold: 'Clear wave',
    evaluate: (r) => {
      if (r.wavesCleared && r.wavesCleared >= 1) return 'gold';
      if ((r.survivalSeconds ?? 0) >= 120) return 'silver';
      if ((r.survivalSeconds ?? 0) >= 60) return 'bronze';
      return null;
    },
  },
  {
    id: 6,
    name: 'Last Stand',
    description: 'Start at wave 10, 1 life, no shields',
    bronze: 'Reach 10 kills',
    silver: 'Reach 30 kills',
    gold: 'Clear wave',
    evaluate: (r) => {
      if (r.wavesCleared && r.wavesCleared >= 1) return 'gold';
      if ((r.kills ?? 0) >= 30) return 'silver';
      if ((r.kills ?? 0) >= 10) return 'bronze';
      return null;
    },
  },
  {
    id: 7,
    name: 'UFO Hunt',
    description: 'UFOs spawn every 5s, only UFO kills count',
    bronze: 'Score 500',
    silver: 'Score 1500',
    gold: 'Score 3000',
    evaluate: (r) => {
      if ((r.score ?? 0) >= 3000) return 'gold';
      if ((r.score ?? 0) >= 1500) return 'silver';
      if ((r.score ?? 0) >= 500) return 'bronze';
      return null;
    },
  },
  {
    id: 8,
    name: 'Boss Rush',
    description: '3 bosses back-to-back, 5 lives',
    bronze: 'Beat 1 boss',
    silver: 'Beat 2 bosses',
    gold: 'Beat all 3',
    evaluate: (r) => {
      if ((r.bossesDefeated ?? 0) >= 3) return 'gold';
      if ((r.bossesDefeated ?? 0) >= 2) return 'silver';
      if ((r.bossesDefeated ?? 0) >= 1) return 'bronze';
      return null;
    },
  },
  {
    id: 9,
    name: 'Minimalist',
    description: 'Max 1 bullet on screen, no power-ups',
    bronze: 'Clear 1 wave',
    silver: 'Clear 3 waves',
    gold: 'Clear 5 waves',
    evaluate: (r) => {
      if ((r.wavesCleared ?? 0) >= 5) return 'gold';
      if ((r.wavesCleared ?? 0) >= 3) return 'silver';
      if ((r.wavesCleared ?? 0) >= 1) return 'bronze';
      return null;
    },
  },
  {
    id: 10,
    name: 'ADMIRAL Trial',
    description: 'Wave 13+ settings from start, 2 lives',
    bronze: 'Survive 60s',
    silver: 'Survive 120s',
    gold: 'Clear wave',
    evaluate: (r) => {
      if (r.wavesCleared && r.wavesCleared >= 1) return 'gold';
      if ((r.survivalSeconds ?? 0) >= 120) return 'silver';
      if ((r.survivalSeconds ?? 0) >= 60) return 'bronze';
      return null;
    },
  },
];

interface StoredData {
  ratings: Record<number, ChallengeRating>;
}

export class ChallengeService {
  private static instance: ChallengeService;
  private ratings: Map<number, ChallengeRating> = new Map();

  static getInstance(): ChallengeService {
    if (!ChallengeService.instance) {
      ChallengeService.instance = new ChallengeService();
    }
    return ChallengeService.instance;
  }

  static resetInstance(): void {
    ChallengeService.instance = undefined as unknown as ChallengeService;
  }

  private constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: StoredData = JSON.parse(raw);
        for (const [id, rating] of Object.entries(data.ratings)) {
          this.ratings.set(Number(id), rating as ChallengeRating);
        }
      }
    } catch {
      // Ignore corrupt data
    }
  }

  private save(): void {
    try {
      const data: StoredData = {
        ratings: Object.fromEntries(this.ratings),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable
    }
  }

  getChallenges(): ChallengeDefinition[] {
    return CHALLENGES;
  }

  getChallenge(id: number): ChallengeDefinition | undefined {
    return CHALLENGES.find(c => c.id === id);
  }

  isUnlocked(id: number): boolean {
    // Challenges 1-3 always unlocked
    if (id <= 3) return true;
    // Challenge N requires at least bronze on N-1
    return this.ratings.has(id - 1);
  }

  getRating(id: number): ChallengeRating | null {
    return this.ratings.get(id) ?? null;
  }

  setRating(id: number, rating: ChallengeRating): void {
    const existing = this.ratings.get(id);
    if (existing && RATING_ORDER[existing] >= RATING_ORDER[rating]) {
      return; // Don't downgrade
    }
    this.ratings.set(id, rating);
    this.save();
  }

  evaluateResult(id: number, result: ChallengeResult): ChallengeRating | null {
    const challenge = this.getChallenge(id);
    if (!challenge) return null;
    return challenge.evaluate(result);
  }

  getCompletionStats(): { completed: number; total: number; goldCount: number } {
    let goldCount = 0;
    for (const rating of this.ratings.values()) {
      if (rating === 'gold') goldCount++;
    }
    return {
      completed: this.ratings.size,
      total: CHALLENGES.length,
      goldCount,
    };
  }
}
