import { CONFIG } from '../config';

export class WeaponSystem {
  private score = 0;
  private levelScore = 0;
  private currentLevel = 0;

  private readonly levels = CONFIG.weapon.levels;
  private readonly maxLevel = this.levels.length - 1;

  addScore(points: number): void {
    this.score += points;
    this.levelScore += points;
    while (
      this.currentLevel < this.maxLevel &&
      this.levelScore >= this.levels[this.currentLevel + 1].threshold
    ) {
      this.currentLevel++;
    }
  }

  getLevel(): number {
    return this.currentLevel;
  }

  getLevelName(): string {
    return this.levels[this.currentLevel].name;
  }

  getWeaponConfig(): typeof CONFIG.weapon.levels[number] {
    return this.levels[this.currentLevel];
  }

  levelDown(): void {
    if (this.currentLevel > 0) {
      this.currentLevel--;
      this.levelScore = this.levels[this.currentLevel].threshold;
    }
  }

  getProgress(): number {
    if (this.currentLevel >= this.maxLevel) {
      return 1.0;
    }
    const currentThreshold = this.levels[this.currentLevel].threshold;
    const nextThreshold = this.levels[this.currentLevel + 1].threshold;
    const range = nextThreshold - currentThreshold;
    const progress = (this.levelScore - currentThreshold) / range;
    return Math.min(Math.max(progress, 0), 1.0);
  }

  getBulletPattern(): string {
    return this.levels[this.currentLevel].pattern;
  }

  reset(): void {
    this.score = 0;
    this.levelScore = 0;
    this.currentLevel = 0;
  }
}
