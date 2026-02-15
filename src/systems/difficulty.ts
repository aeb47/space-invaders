import { CONFIG, DifficultyTier, DifficultyLevel } from '../config';

const TIER_ORDER: DifficultyTier[] = ['recruit', 'soldier', 'veteran', 'commander', 'admiral'];

export class DifficultyTierSystem {
  getTier(wave: number): DifficultyTier {
    for (const tier of TIER_ORDER) {
      const { minWave, maxWave } = CONFIG.difficultyTiers[tier];
      if (wave >= minWave && wave <= maxWave) {
        return tier;
      }
    }
    return 'admiral';
  }

  getTierLabel(wave: number): string {
    const tier = this.getTier(wave);
    return tier.toUpperCase();
  }

  isDiveBombEnabled(wave: number): boolean {
    const tier = this.getTier(wave);
    const startTier = CONFIG.diveBomb.startTier;
    return this.tierIndex(tier) >= this.tierIndex(startTier);
  }

  isSplitFormationEnabled(wave: number): boolean {
    const tier = this.getTier(wave);
    const startTier = CONFIG.splitFormation.startTier;
    return this.tierIndex(tier) >= this.tierIndex(startTier);
  }

  isEscortEnabled(wave: number): boolean {
    const tier = this.getTier(wave);
    const startTier = CONFIG.escort.startTier;
    return this.tierIndex(tier) >= this.tierIndex(startTier);
  }

  getDiveBombChance(wave: number): number {
    return this.isDiveBombEnabled(wave) ? CONFIG.diveBomb.chance : 0;
  }

  getNewTierIfChanged(currentWave: number, previousWave: number): DifficultyTier | null {
    const currentTier = this.getTier(currentWave);
    const previousTier = this.getTier(previousWave);
    return currentTier !== previousTier ? currentTier : null;
  }

  private tierIndex(tier: DifficultyTier): number {
    return TIER_ORDER.indexOf(tier);
  }
}

export function getDifficultyConfig(level: DifficultyLevel) {
  return CONFIG.difficulty[level];
}

export function getEffectiveFireInterval(baseInterval: number, level: DifficultyLevel): number {
  return baseInterval + CONFIG.difficulty[level].alienFireIntervalBonus;
}

export function getEffectiveLives(level: DifficultyLevel): number {
  return CONFIG.difficulty[level].lives;
}

export function getEffectiveBulletSpeed(level: DifficultyLevel): number {
  return CONFIG.difficulty[level].alienBulletSpeed;
}
