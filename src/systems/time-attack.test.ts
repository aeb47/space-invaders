import { describe, it, expect, beforeEach } from 'vitest';
import { TimeAttackState } from './time-attack';
import { CONFIG } from '../config';

describe('TimeAttackState', () => {
  let state: TimeAttackState;

  beforeEach(() => {
    state = new TimeAttackState();
  });

  it('starts with full time', () => {
    expect(state.getRemainingTime()).toBe(CONFIG.timeAttack.duration);
  });

  it('starts with 0 score', () => {
    expect(state.getScore()).toBe(0);
  });

  it('starts with combo at 0', () => {
    expect(state.getCombo()).toBe(0);
    expect(state.getMultiplier()).toBe(1);
  });

  describe('timer', () => {
    it('update decrements remaining time', () => {
      state.update(1000);
      expect(state.getRemainingTime()).toBe(CONFIG.timeAttack.duration - 1000);
    });

    it('isTimeUp returns false while time remains', () => {
      state.update(1000);
      expect(state.isTimeUp()).toBe(false);
    });

    it('isTimeUp returns true when time is out', () => {
      state.update(CONFIG.timeAttack.duration + 1);
      expect(state.isTimeUp()).toBe(true);
    });

    it('isWarning returns true in final 10 seconds', () => {
      state.update(CONFIG.timeAttack.duration - 9999);
      expect(state.isWarning()).toBe(true);
    });

    it('isWarning returns false with more than 10 seconds', () => {
      state.update(CONFIG.timeAttack.duration - 15000);
      expect(state.isWarning()).toBe(false);
    });
  });

  describe('combo system', () => {
    it('recordKill starts a combo', () => {
      state.recordKill(30);
      expect(state.getCombo()).toBe(1);
    });

    it('kills within window build combo', () => {
      state.recordKill(30);
      state.update(500); // within 1500ms window
      state.recordKill(20);
      expect(state.getCombo()).toBe(2);
    });

    it('getMultiplier returns correct value based on combo thresholds', () => {
      // Thresholds: [1, 3, 6, 10, 15] -> multipliers 1-5
      expect(state.getMultiplier()).toBe(1); // 0 combo
      state.recordKill(10);
      expect(state.getMultiplier()).toBe(1); // 1 kill, threshold[0]=1 -> ×1
      state.recordKill(10);
      state.recordKill(10);
      expect(state.getMultiplier()).toBe(2); // 3 kills -> ×2

      for (let i = 0; i < 3; i++) state.recordKill(10);
      expect(state.getMultiplier()).toBe(3); // 6 kills -> ×3

      for (let i = 0; i < 4; i++) state.recordKill(10);
      expect(state.getMultiplier()).toBe(4); // 10 kills -> ×4

      for (let i = 0; i < 5; i++) state.recordKill(10);
      expect(state.getMultiplier()).toBe(5); // 15 kills -> ×5 (max)
    });

    it('score is multiplied by combo', () => {
      // Get to ×2 multiplier (3 kills)
      state.recordKill(10); // 10 * 1 = 10
      state.recordKill(10); // 10 * 1 = 10
      state.recordKill(10); // 10 * 2 = 20 (now at 3 kills = ×2)
      expect(state.getScore()).toBe(10 + 10 + 20);
    });

    it('combo resets after timeout', () => {
      state.recordKill(10);
      state.update(CONFIG.timeAttack.comboBreakMissTimeout + 1);
      expect(state.getCombo()).toBe(0);
      expect(state.getMultiplier()).toBe(1);
    });

    it('combo resets on miss', () => {
      state.recordKill(10);
      state.recordKill(10);
      state.recordMiss();
      expect(state.getCombo()).toBe(0);
    });

    it('tracks highest combo', () => {
      for (let i = 0; i < 5; i++) state.recordKill(10);
      state.recordMiss();
      for (let i = 0; i < 3; i++) state.recordKill(10);
      expect(state.getHighestCombo()).toBe(5);
    });
  });

  describe('results', () => {
    it('getResults returns summary', () => {
      state.recordKill(30);
      state.recordKill(20);
      state.recordMiss();
      state.recordKill(10);
      state.update(CONFIG.timeAttack.duration + 1);

      const results = state.getResults();
      expect(results.totalKills).toBe(3);
      expect(results.highestCombo).toBe(2);
      expect(results.score).toBeGreaterThan(0);
    });

    it('getGrade returns correct grade based on score', () => {
      // S: 15000, A: 10000, B: 6000, C: 3000
      expect(TimeAttackState.getGrade(16000)).toBe('S');
      expect(TimeAttackState.getGrade(11000)).toBe('A');
      expect(TimeAttackState.getGrade(7000)).toBe('B');
      expect(TimeAttackState.getGrade(4000)).toBe('C');
      expect(TimeAttackState.getGrade(1000)).toBe('D');
    });
  });

  describe('death handling', () => {
    it('recordDeath resets combo', () => {
      for (let i = 0; i < 5; i++) state.recordKill(10);
      state.recordDeath();
      expect(state.getCombo()).toBe(0);
    });
  });
});
