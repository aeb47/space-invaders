import { CONFIG } from '../config';

export type BossType = 'mothership' | 'commander' | 'admiral';

export type BossPhase = 1 | 2 | 3;

export interface AttackPattern {
  type: 'spread' | 'deploy' | 'laser' | 'homing' | 'shield-regen' | 'teleport' | 'ring' | 'gravity';
  bulletCount?: number;
  interval?: number;
}

const BOSS_TYPES: BossType[] = ['mothership', 'commander', 'admiral'];

// Phase thresholds as fraction of max HP
const PHASE_THRESHOLDS: Record<BossType, { phase2: number; phase3: number }> = {
  mothership: { phase2: 0.5, phase3: 0.25 },
  commander:  { phase2: 0.5, phase3: 0.27 },
  admiral:    { phase2: 0.5, phase3: 0.25 },
};

const ATTACK_PATTERNS: Record<BossType, Record<BossPhase, AttackPattern>> = {
  mothership: {
    1: { type: 'spread', bulletCount: CONFIG.boss.mothership.spreadBullets, interval: 1500 },
    2: { type: 'deploy', bulletCount: CONFIG.boss.mothership.miniAlienCount, interval: 2000 },
    3: { type: 'laser', interval: CONFIG.boss.mothership.laserWarningTime + CONFIG.boss.mothership.laserDuration },
  },
  commander: {
    1: { type: 'homing', interval: 2000 },
    2: { type: 'shield-regen', interval: CONFIG.boss.commander.shieldRegenTime },
    3: { type: 'homing', bulletCount: 3, interval: 1200 },
  },
  admiral: {
    1: { type: 'teleport', interval: CONFIG.boss.admiral.teleportInterval },
    2: { type: 'ring', bulletCount: CONFIG.boss.admiral.bulletRingCount, interval: 2500 },
    3: { type: 'gravity', interval: 3000 },
  },
};

export class BossFactory {
  static isBossWave(wave: number): boolean {
    return wave > 0 && wave % CONFIG.boss.schedule === 0;
  }

  static getBossType(wave: number): BossType {
    const bossIndex = (wave / CONFIG.boss.schedule - 1) % BOSS_TYPES.length;
    return BOSS_TYPES[bossIndex];
  }

  static getBossConfig(type: BossType) {
    return CONFIG.boss[type];
  }

  static getBossPoints(wave: number): number {
    // PRD: 500 × boss tier (wave 5 = 2500, wave 10 = 5000, etc.)
    return 500 * wave;
  }
}

export class BossState {
  public hp: number;
  public maxHp: number;
  public phase: BossPhase = 1;
  public bossType: BossType;
  public onPhaseChange?: (phase: BossPhase) => void;

  constructor(bossType: BossType, maxHp: number) {
    this.bossType = bossType;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    this.checkPhaseTransition();
  }

  isDefeated(): boolean {
    return this.hp <= 0;
  }

  getHpPercent(): number {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  getAttackPattern(): AttackPattern {
    return ATTACK_PATTERNS[this.bossType][this.phase];
  }

  private checkPhaseTransition(): void {
    const thresholds = PHASE_THRESHOLDS[this.bossType];
    const hpPercent = this.getHpPercent();
    let newPhase: BossPhase = 1;

    if (hpPercent <= thresholds.phase3) {
      newPhase = 3;
    } else if (hpPercent <= thresholds.phase2) {
      newPhase = 2;
    }

    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.onPhaseChange?.(newPhase);
    }
  }
}
