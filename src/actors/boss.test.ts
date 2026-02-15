import { describe, it, expect, beforeEach } from 'vitest';
import { BossFactory, BossState, BossPhase } from './boss';
import { CONFIG } from '../config';

describe('BossFactory', () => {
  it('isBossWave returns true for multiples of boss schedule', () => {
    expect(BossFactory.isBossWave(5)).toBe(true);
    expect(BossFactory.isBossWave(10)).toBe(true);
    expect(BossFactory.isBossWave(15)).toBe(true);
    expect(BossFactory.isBossWave(20)).toBe(true);
  });

  it('isBossWave returns false for non-boss waves', () => {
    expect(BossFactory.isBossWave(1)).toBe(false);
    expect(BossFactory.isBossWave(3)).toBe(false);
    expect(BossFactory.isBossWave(7)).toBe(false);
    expect(BossFactory.isBossWave(12)).toBe(false);
  });

  it('getBossType returns correct boss for wave', () => {
    expect(BossFactory.getBossType(5)).toBe('mothership');
    expect(BossFactory.getBossType(10)).toBe('commander');
    expect(BossFactory.getBossType(15)).toBe('admiral');
    expect(BossFactory.getBossType(20)).toBe('mothership');  // cycles
    expect(BossFactory.getBossType(25)).toBe('commander');
  });

  it('getBossConfig returns correct config for each type', () => {
    const mothership = BossFactory.getBossConfig('mothership');
    expect(mothership.hp).toBe(CONFIG.boss.mothership.hp);
    expect(mothership.width).toBe(CONFIG.boss.mothership.width);

    const commander = BossFactory.getBossConfig('commander');
    expect(commander.hp).toBe(CONFIG.boss.commander.hp);

    const admiral = BossFactory.getBossConfig('admiral');
    expect(admiral.hp).toBe(CONFIG.boss.admiral.hp);
  });

  it('getBossPoints returns correct points per boss tier', () => {
    expect(BossFactory.getBossPoints(5)).toBe(2500);
    expect(BossFactory.getBossPoints(10)).toBe(5000);
    expect(BossFactory.getBossPoints(15)).toBe(7500);
    expect(BossFactory.getBossPoints(20)).toBe(10000);
  });
});

describe('BossState', () => {
  let state: BossState;

  beforeEach(() => {
    state = new BossState('mothership', 20);
  });

  it('starts at full HP', () => {
    expect(state.hp).toBe(20);
    expect(state.maxHp).toBe(20);
  });

  it('starts in phase 1', () => {
    expect(state.phase).toBe(1);
  });

  it('takeDamage reduces HP', () => {
    state.takeDamage(5);
    expect(state.hp).toBe(15);
  });

  it('takeDamage does not go below 0', () => {
    state.takeDamage(25);
    expect(state.hp).toBe(0);
  });

  it('isDefeated returns true when HP is 0', () => {
    expect(state.isDefeated()).toBe(false);
    state.takeDamage(20);
    expect(state.isDefeated()).toBe(true);
  });

  it('getHpPercent returns correct fraction', () => {
    expect(state.getHpPercent()).toBe(1.0);
    state.takeDamage(10);
    expect(state.getHpPercent()).toBe(0.5);
    state.takeDamage(10);
    expect(state.getHpPercent()).toBe(0);
  });

  describe('mothership phases', () => {
    it('transitions to phase 2 at 10 HP', () => {
      state.takeDamage(10);
      expect(state.phase).toBe(2);
    });

    it('transitions to phase 3 at 5 HP', () => {
      state.takeDamage(15);
      expect(state.phase).toBe(3);
    });

    it('notifies phase change', () => {
      const phases: number[] = [];
      state.onPhaseChange = (p) => phases.push(p);
      state.takeDamage(10);
      state.takeDamage(5);
      expect(phases).toEqual([2, 3]);
    });
  });

  describe('commander phases', () => {
    let cmdState: BossState;

    beforeEach(() => {
      cmdState = new BossState('commander', 30);
    });

    it('transitions to phase 2 at 15 HP', () => {
      cmdState.takeDamage(15);
      expect(cmdState.phase).toBe(2);
    });

    it('transitions to phase 3 at 8 HP', () => {
      cmdState.takeDamage(22);
      expect(cmdState.phase).toBe(3);
    });
  });

  describe('admiral phases', () => {
    let admState: BossState;

    beforeEach(() => {
      admState = new BossState('admiral', 40);
    });

    it('transitions to phase 2 at 20 HP', () => {
      admState.takeDamage(20);
      expect(admState.phase).toBe(2);
    });

    it('transitions to phase 3 at 10 HP', () => {
      admState.takeDamage(30);
      expect(admState.phase).toBe(3);
    });
  });

  it('getAttackPattern returns pattern for current phase', () => {
    const pattern = state.getAttackPattern();
    expect(pattern).toBeDefined();
    expect(pattern.type).toBe('spread');
  });
});
