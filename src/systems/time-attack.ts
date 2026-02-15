import { CONFIG } from '../config';

export interface TimeAttackResults {
  score: number;
  totalKills: number;
  highestCombo: number;
  accuracy: number;
  grade: string;
}

export class TimeAttackState {
  private remainingTime: number = CONFIG.timeAttack.duration;
  private score: number = 0;
  private combo: number = 0;
  private highestCombo: number = 0;
  private totalKills: number = 0;
  private totalShots: number = 0;
  private totalHits: number = 0;
  private timeSinceLastKill: number = 0;

  update(delta: number): void {
    this.remainingTime = Math.max(0, this.remainingTime - delta);
    this.timeSinceLastKill += delta;

    // Check combo timeout
    if (this.combo > 0 && this.timeSinceLastKill >= CONFIG.timeAttack.comboBreakMissTimeout) {
      this.resetCombo();
    }
  }

  recordKill(basePoints: number): void {
    this.combo++;
    this.totalKills++;
    this.totalHits++;
    this.timeSinceLastKill = 0;

    if (this.combo > this.highestCombo) {
      this.highestCombo = this.combo;
    }

    const multiplier = this.getMultiplier();
    this.score += basePoints * multiplier;
  }

  recordMiss(): void {
    this.totalShots++;
    this.resetCombo();
  }

  recordDeath(): void {
    this.resetCombo();
  }

  recordShot(): void {
    this.totalShots++;
  }

  getRemainingTime(): number {
    return this.remainingTime;
  }

  isTimeUp(): boolean {
    return this.remainingTime <= 0;
  }

  isWarning(): boolean {
    return this.remainingTime > 0 && this.remainingTime <= 10000;
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  getHighestCombo(): number {
    return this.highestCombo;
  }

  getMultiplier(): number {
    const thresholds = CONFIG.timeAttack.comboThresholds;
    let multiplier = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (this.combo >= thresholds[i]) {
        multiplier = i + 1;
      }
    }
    return Math.min(multiplier, CONFIG.timeAttack.maxMultiplier);
  }

  getResults(): TimeAttackResults {
    const accuracy = this.totalShots > 0
      ? Math.round((this.totalHits / this.totalShots) * 100)
      : 0;
    return {
      score: this.score,
      totalKills: this.totalKills,
      highestCombo: this.highestCombo,
      accuracy,
      grade: TimeAttackState.getGrade(this.score),
    };
  }

  static getGrade(score: number): string {
    const grades = CONFIG.timeAttack.grades;
    if (score >= grades.S) return 'S';
    if (score >= grades.A) return 'A';
    if (score >= grades.B) return 'B';
    if (score >= grades.C) return 'C';
    return 'D';
  }

  private resetCombo(): void {
    this.combo = 0;
  }
}
