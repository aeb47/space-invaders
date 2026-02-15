import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CONFIG, PowerUpType } from '../config';

// Mock excalibur before importing the actor
vi.mock('excalibur', () => {
  class MockVector {
    constructor(public x: number, public y: number) {}
    clone() { return new MockVector(this.x, this.y); }
  }
  class MockColor {
    constructor(public r: number, public g: number, public b: number, public a: number) {}
    static fromHex(hex: string) { return new MockColor(0, 0, 0, 1); }
  }
  class MockActor {
    pos: MockVector;
    vel: MockVector;
    width: number;
    height: number;
    color: MockColor | undefined;
    graphics: Record<string, any>;
    killed = false;

    constructor(config?: any) {
      this.pos = config?.pos ?? new MockVector(0, 0);
      this.vel = config?.vel ?? new MockVector(0, 0);
      this.width = config?.width ?? 0;
      this.height = config?.height ?? 0;
      this.color = config?.color;
      this.graphics = { use: () => {} };
    }

    kill() { this.killed = true; }
    isKilled() { return this.killed; }
  }

  return {
    Actor: MockActor,
    Vector: MockVector,
    vec: (x: number, y: number) => new MockVector(x, y),
    Color: MockColor,
    CollisionType: { Passive: 'Passive', Active: 'Active' },
  };
});

import { PowerUpActor } from './power-up-actor';

describe('PowerUpActor', () => {
  it('has correct position from constructor', () => {
    const actor = new PowerUpActor(100, 200, 'spread');
    expect(actor.pos.x).toBe(100);
    expect(actor.pos.y).toBe(200);
  });

  it('falls at CONFIG.powerUp.fallSpeed (80 px/s)', () => {
    const actor = new PowerUpActor(100, 200, 'rapid');
    expect(actor.vel.y).toBe(CONFIG.powerUp.fallSpeed);
  });

  it('has correct type property', () => {
    const actor = new PowerUpActor(100, 200, 'shield');
    expect(actor.type).toBe('shield');
  });

  it('has correct dimensions from config', () => {
    const actor = new PowerUpActor(100, 200, 'multiplier');
    expect(actor.width).toBe(CONFIG.powerUp.width);
    expect(actor.height).toBe(CONFIG.powerUp.height);
  });

  it('despawns when below screen', () => {
    const actor = new PowerUpActor(100, CONFIG.canvas.height + 20, 'spread');
    actor.onPreUpdate({} as any, 16);
    expect(actor.isKilled()).toBe(true);
  });

  it('does not despawn when still on screen', () => {
    const actor = new PowerUpActor(100, 300, 'spread');
    actor.onPreUpdate({} as any, 16);
    expect(actor.isKilled()).toBe(false);
  });
});
