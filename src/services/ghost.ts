export interface GhostFrame {
  x: number;
  firing: boolean;
}

export interface ScoreMilestone {
  score: number;
  frameIndex: number;
}

export interface GhostRecording {
  frames: GhostFrame[];
  scoreMilestones: ScoreMilestone[];
}

interface StoredGhost {
  recording: GhostRecording;
  score: number;
}

export class GhostRecorder {
  private frames: GhostFrame[] = [];
  private scoreMilestones: ScoreMilestone[] = [];

  recordFrame(x: number, firing: boolean): void {
    this.frames.push({ x, firing });
  }

  recordScoreMilestone(score: number, frameIndex: number): void {
    this.scoreMilestones.push({ score, frameIndex });
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  getRecording(): GhostRecording {
    return {
      frames: [...this.frames],
      scoreMilestones: [...this.scoreMilestones],
    };
  }

  reset(): void {
    this.frames = [];
    this.scoreMilestones = [];
  }
}

export class GhostPlayback {
  private recording: GhostRecording;
  private currentFrame: number = 0;

  constructor(recording: GhostRecording) {
    this.recording = recording;
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  getPosition(): number {
    if (this.recording.frames.length === 0) return 0;
    return this.recording.frames[this.currentFrame].x;
  }

  isFiring(): boolean {
    if (this.recording.frames.length === 0) return false;
    return this.recording.frames[this.currentFrame].firing;
  }

  advance(): void {
    if (this.currentFrame < this.recording.frames.length - 1) {
      this.currentFrame++;
    }
  }

  isFinished(): boolean {
    return this.currentFrame >= this.recording.frames.length - 1;
  }

  getGhostScore(): number {
    let score = 0;
    for (const milestone of this.recording.scoreMilestones) {
      if (milestone.frameIndex <= this.currentFrame) {
        score = milestone.score;
      } else {
        break;
      }
    }
    return score;
  }

  getScoreDelta(playerScore: number): number {
    return playerScore - this.getGhostScore();
  }

  reset(): void {
    this.currentFrame = 0;
  }
}

export class GhostStorage {
  private static getKey(mode: string): string {
    return `space-invaders-ghost-${mode}`;
  }

  static save(mode: string, recording: GhostRecording, score: number): void {
    const existing = GhostStorage.load(mode);
    if (existing && existing.score >= score) {
      return; // Only save if new score is higher
    }
    try {
      const data: StoredGhost = { recording, score };
      localStorage.setItem(GhostStorage.getKey(mode), JSON.stringify(data));
    } catch {
      // localStorage may be unavailable
    }
  }

  static load(mode: string): StoredGhost | null {
    try {
      const raw = localStorage.getItem(GhostStorage.getKey(mode));
      if (!raw) return null;
      return JSON.parse(raw) as StoredGhost;
    } catch {
      return null;
    }
  }

  static clear(mode: string): void {
    try {
      localStorage.removeItem(GhostStorage.getKey(mode));
    } catch {
      // localStorage may be unavailable
    }
  }
}
