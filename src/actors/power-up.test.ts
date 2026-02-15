import { describe, it, expect, beforeEach } from 'vitest';
import { CONFIG, PowerUpType } from '../config';
import { selectPowerUpType, shouldDropPowerUp, PowerUpState } from './power-up';

describe('Power-Up pure logic', () => {
  describe('selectPowerUpType', () => {
    it('returns a valid power-up type', () => {
      const type = selectPowerUpType();
      const validTypes: PowerUpType[] = ['spread', 'rapid', 'shield', 'multiplier'];
      expect(validTypes).toContain(type);
    });

    it('respects weights over many iterations (±10%)', () => {
      const counts: Record<PowerUpType, number> = { spread: 0, rapid: 0, shield: 0, multiplier: 0 };
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const type = selectPowerUpType();
        counts[type]++;
      }

      const spreadPct = counts.spread / iterations;
      const rapidPct = counts.rapid / iterations;
      const shieldPct = counts.shield / iterations;
      const multiplierPct = counts.multiplier / iterations;

      expect(spreadPct).toBeGreaterThan(0.20);     // 30% - 10%
      expect(spreadPct).toBeLessThan(0.40);         // 30% + 10%
      expect(rapidPct).toBeGreaterThan(0.15);       // 25% - 10%
      expect(rapidPct).toBeLessThan(0.35);          // 25% + 10%
      expect(shieldPct).toBeGreaterThan(0.15);      // 25% - 10%
      expect(shieldPct).toBeLessThan(0.35);         // 25% + 10%
      expect(multiplierPct).toBeGreaterThan(0.10);  // 20% - 10%
      expect(multiplierPct).toBeLessThan(0.30);     // 20% + 10%
    });
  });

  describe('shouldDropPowerUp', () => {
    it('uses 8% base chance at wave 1', () => {
      // Run many trials to check the effective probability
      let drops = 0;
      const trials = 50000;
      for (let i = 0; i < trials; i++) {
        if (shouldDropPowerUp(1)) drops++;
      }
      const rate = drops / trials;
      expect(rate).toBeGreaterThan(0.06);
      expect(rate).toBeLessThan(0.10);
    });

    it('uses 12% chance at wave 5 (8% + 4*1%)', () => {
      let drops = 0;
      const trials = 50000;
      for (let i = 0; i < trials; i++) {
        if (shouldDropPowerUp(5)) drops++;
      }
      const rate = drops / trials;
      expect(rate).toBeGreaterThan(0.10);
      expect(rate).toBeLessThan(0.14);
    });

    it('caps at 15% max chance at wave 10+', () => {
      let drops = 0;
      const trials = 50000;
      for (let i = 0; i < trials; i++) {
        if (shouldDropPowerUp(10)) drops++;
      }
      const rate = drops / trials;
      expect(rate).toBeGreaterThan(0.13);
      expect(rate).toBeLessThan(0.17);
    });

    it('does not exceed 15% even at wave 20', () => {
      let drops = 0;
      const trials = 50000;
      for (let i = 0; i < trials; i++) {
        if (shouldDropPowerUp(20)) drops++;
      }
      const rate = drops / trials;
      expect(rate).toBeGreaterThan(0.13);
      expect(rate).toBeLessThan(0.17);
    });
  });

  describe('PowerUpState', () => {
    let state: PowerUpState;

    beforeEach(() => {
      state = new PowerUpState();
    });

    it('starts with no active power-up', () => {
      expect(state.getActive()).toBeNull();
    });

    it('activate() sets the active power-up', () => {
      state.activate('spread', 8000);
      expect(state.getActive()).toBe('spread');
    });

    it('activate() while one is active replaces it', () => {
      state.activate('spread', 8000);
      state.activate('rapid', 6000);
      expect(state.getActive()).toBe('rapid');
      expect(state.getRemainingTime()).toBe(6000);
    });

    it('getActive() returns current type or null', () => {
      expect(state.getActive()).toBeNull();
      state.activate('shield', 0);
      expect(state.getActive()).toBe('shield');
    });

    it('getRemainingTime() returns remaining duration in ms', () => {
      state.activate('spread', 8000);
      expect(state.getRemainingTime()).toBe(8000);
    });

    it('update(delta) decrements remaining time', () => {
      state.activate('spread', 8000);
      state.update(1000);
      expect(state.getRemainingTime()).toBe(7000);
    });

    it('update() deactivates when time runs out', () => {
      state.activate('spread', 3000);
      state.update(3000);
      expect(state.getActive()).toBeNull();
      expect(state.getRemainingTime()).toBe(0);
    });

    it('isExpiring() returns true when remaining < 2000ms', () => {
      state.activate('spread', 8000);
      expect(state.isExpiring()).toBe(false);
      state.update(6500);
      expect(state.isExpiring()).toBe(true);
    });

    it('isExpiring() returns false when no power-up active', () => {
      expect(state.isExpiring()).toBe(false);
    });

    it('getScoreMultiplier() returns 2 when multiplier active, 1 otherwise', () => {
      expect(state.getScoreMultiplier()).toBe(1);
      state.activate('multiplier', 10000);
      expect(state.getScoreMultiplier()).toBe(2);
      state.activate('spread', 8000);
      expect(state.getScoreMultiplier()).toBe(1);
    });

    it('isShieldActive() returns true when shield type is active', () => {
      expect(state.isShieldActive()).toBe(false);
      state.activate('shield', 0);
      expect(state.isShieldActive()).toBe(true);
    });

    it('consumeShield() deactivates shield (single-use)', () => {
      state.activate('shield', 0);
      expect(state.isShieldActive()).toBe(true);
      state.consumeShield();
      expect(state.isShieldActive()).toBe(false);
      expect(state.getActive()).toBeNull();
    });

    it('consumeShield() does nothing when shield not active', () => {
      state.activate('spread', 8000);
      state.consumeShield();
      expect(state.getActive()).toBe('spread');
    });

    it('reset() clears active power-up', () => {
      state.activate('spread', 8000);
      state.reset();
      expect(state.getActive()).toBeNull();
      expect(state.getRemainingTime()).toBe(0);
    });

    it('shield does not expire via update (duration=0 means permanent until consumed)', () => {
      state.activate('shield', 0);
      state.update(5000);
      expect(state.getActive()).toBe('shield');
    });
  });
});
