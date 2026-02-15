import { CONFIG, PowerUpType } from '../config';

const typeEntries = Object.entries(CONFIG.powerUp.types) as [PowerUpType, typeof CONFIG.powerUp.types[PowerUpType]][];

/**
 * Weighted random selection of a power-up type.
 */
export function selectPowerUpType(): PowerUpType {
  const roll = Math.random();
  let cumulative = 0;
  for (const [type, info] of typeEntries) {
    cumulative += info.weight;
    if (roll < cumulative) return type;
  }
  // Fallback (should not reach due to weights summing to 1.0)
  return typeEntries[typeEntries.length - 1][0];
}

/**
 * Determines whether a power-up should drop based on wave number.
 * Base chance: 8%, increases by 1% per wave (after wave 1), capped at 15%.
 */
export function shouldDropPowerUp(wave: number): boolean {
  const chance = Math.min(
    CONFIG.powerUp.dropChanceBase + (wave - 1) * CONFIG.powerUp.dropChanceIncreasePerWave,
    CONFIG.powerUp.maxDropChance,
  );
  return Math.random() < chance;
}

/**
 * Pure-logic class managing the active power-up state.
 * No Excalibur dependency — easy to test and serialize.
 */
export class PowerUpState {
  private activeType: PowerUpType | null = null;
  private remainingTime: number = 0;

  getActive(): PowerUpType | null {
    return this.activeType;
  }

  getRemainingTime(): number {
    return this.remainingTime;
  }

  activate(type: PowerUpType, duration: number): void {
    this.activeType = type;
    this.remainingTime = duration;
  }

  update(delta: number): void {
    if (this.activeType === null) return;
    // Shield has duration 0 and is permanent until consumed
    if (this.activeType === 'shield') return;

    this.remainingTime = Math.max(0, this.remainingTime - delta);
    if (this.remainingTime <= 0) {
      this.activeType = null;
      this.remainingTime = 0;
    }
  }

  isExpiring(): boolean {
    if (this.activeType === null) return false;
    if (this.activeType === 'shield') return false;
    return this.remainingTime > 0 && this.remainingTime < CONFIG.powerUp.expiryWarningTime;
  }

  getScoreMultiplier(): number {
    return this.activeType === 'multiplier' ? 2 : 1;
  }

  isShieldActive(): boolean {
    return this.activeType === 'shield';
  }

  consumeShield(): void {
    if (this.activeType === 'shield') {
      this.activeType = null;
      this.remainingTime = 0;
    }
  }

  reset(): void {
    this.activeType = null;
    this.remainingTime = 0;
  }
}
