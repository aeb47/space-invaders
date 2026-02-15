import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getShieldColor, getShieldOpacity, getShieldDrawSize } from './shield-helpers';
import { CONFIG } from '../config';

// Mock excalibur before importing shield.ts
vi.mock('excalibur', () => {
  class MockVector {
    constructor(public x: number, public y: number) {}
    clone() { return new MockVector(this.x, this.y); }
  }

  class MockGraphic {
    width = 0;
    height = 0;
    color: unknown = null;
  }

  class MockGraphicsComponent {
    current: MockGraphic | null = null;
    opacity = 1.0;
    use(graphic: MockGraphic) { this.current = graphic; }
  }

  class MockActor {
    pos: MockVector;
    width: number;
    height: number;
    collisionType: unknown;
    collisionGroup: unknown;
    graphics: MockGraphicsComponent;
    _killed = false;

    constructor(config: Record<string, unknown>) {
      this.pos = (config.pos as MockVector) || new MockVector(0, 0);
      this.width = (config.width as number) || 0;
      this.height = (config.height as number) || 0;
      this.collisionType = config.collisionType;
      this.collisionGroup = config.collisionGroup;
      this.graphics = new MockGraphicsComponent();
    }

    kill() { this._killed = true; }
    isKilled() { return this._killed; }
  }

  class MockScene {
    actors: MockActor[] = [];
    add(actor: MockActor) { this.actors.push(actor); }
  }

  class MockRectangle {
    width: number;
    height: number;
    color: unknown;
    constructor(config: Record<string, unknown>) {
      this.width = config.width as number;
      this.height = config.height as number;
      this.color = config.color;
    }
  }

  class MockColor {
    constructor(public r: number, public g: number, public b: number, public a: number) {}
    static fromHex(hex: string) { return new MockColor(0, 0, 0, 1); }
  }

  return {
    Actor: MockActor,
    Scene: MockScene,
    Vector: MockVector,
    vec: (x: number, y: number) => new MockVector(x, y),
    CollisionType: { Passive: 'Passive', Active: 'Active', Fixed: 'Fixed' },
    CollisionGroup: { collidesWith: () => ({}) },
    CollisionGroupManager: { create: () => ({}) },
    Rectangle: MockRectangle,
    Color: MockColor,
  };
});

// Mock collision groups
vi.mock('../collision-groups', () => ({
  ShieldGroup: {},
  PlayerGroup: {},
  AlienGroup: {},
  PlayerBulletCollisionGroup: {},
  AlienBulletCollisionGroup: {},
}));

import { ShieldBlock, createShields } from './shield';
import * as ex from 'excalibur';

describe('Shield degradation helpers', () => {
  const maxHp = CONFIG.shield.blockHp; // 3
  const blockSize = CONFIG.shield.blockSize; // 3

  describe('getShieldColor', () => {
    it('returns bright green (#00ff00) at full HP', () => {
      expect(getShieldColor(3, maxHp)).toBe('#00ff00');
    });

    it('returns yellow-green (#88cc00) at HP 2', () => {
      expect(getShieldColor(2, maxHp)).toBe('#88cc00');
    });

    it('returns dark yellow (#cc8800) at HP 1', () => {
      expect(getShieldColor(1, maxHp)).toBe('#cc8800');
    });

    it('returns dark yellow for HP 0 (edge case)', () => {
      expect(getShieldColor(0, maxHp)).toBe('#cc8800');
    });
  });

  describe('getShieldOpacity', () => {
    it('returns 1.0 at full HP', () => {
      expect(getShieldOpacity(3, maxHp)).toBe(1.0);
    });

    it('returns 0.8 at HP 2', () => {
      expect(getShieldOpacity(2, maxHp)).toBe(0.8);
    });

    it('returns 0.5 at HP 1', () => {
      expect(getShieldOpacity(1, maxHp)).toBe(0.5);
    });
  });

  describe('getShieldDrawSize', () => {
    it('returns full blockSize at full HP', () => {
      expect(getShieldDrawSize(3, maxHp, blockSize)).toBe(blockSize);
    });

    it('returns full blockSize at HP 2', () => {
      expect(getShieldDrawSize(2, maxHp, blockSize)).toBe(blockSize);
    });

    it('returns smaller size (blockSize - 1) at HP 1', () => {
      expect(getShieldDrawSize(1, maxHp, blockSize)).toBe(blockSize - 1);
    });
  });
});

describe('ShieldBlock', () => {
  let block: ShieldBlock;

  beforeEach(() => {
    block = new ShieldBlock(ex.vec(100, 200));
    // Manually call onInitialize since we're not running in a real engine
    block.onInitialize();
  });

  describe('initialization', () => {
    it('starts with HP equal to CONFIG.shield.blockHp (3)', () => {
      expect(block.hp).toBe(CONFIG.shield.blockHp);
      expect(block.hp).toBe(3);
    });
  });

  describe('hit()', () => {
    it('decrements HP by 1', () => {
      block.hit();
      expect(block.hp).toBe(2);
    });

    it('returns true when block is still alive (HP > 0)', () => {
      const alive = block.hit();
      expect(alive).toBe(true);
      expect(block.hp).toBe(2);
    });

    it('returns true after second hit (HP = 1)', () => {
      block.hit();
      const alive = block.hit();
      expect(alive).toBe(true);
      expect(block.hp).toBe(1);
    });

    it('returns false when HP reaches 0 (block is killed)', () => {
      block.hit(); // HP 3 -> 2
      block.hit(); // HP 2 -> 1
      const alive = block.hit(); // HP 1 -> 0
      expect(alive).toBe(false);
      expect(block.hp).toBe(0);
    });

    it('calls kill() when HP reaches 0', () => {
      const killSpy = vi.spyOn(block, 'kill');
      block.hit(); // 3 -> 2
      block.hit(); // 2 -> 1
      block.hit(); // 1 -> 0
      expect(killSpy).toHaveBeenCalledOnce();
    });

    it('does not call kill() when HP is still above 0', () => {
      const killSpy = vi.spyOn(block, 'kill');
      block.hit(); // 3 -> 2
      block.hit(); // 2 -> 1
      expect(killSpy).not.toHaveBeenCalled();
    });
  });

  describe('visual degradation', () => {
    it('updates opacity to 0.8 after first hit (HP 2)', () => {
      block.hit();
      expect(block.graphics.opacity).toBe(0.8);
    });

    it('updates opacity to 0.5 after second hit (HP 1)', () => {
      block.hit();
      block.hit();
      expect(block.graphics.opacity).toBe(0.5);
    });
  });
});

describe('CONFIG.shield', () => {
  it('blockHp is 3', () => {
    expect(CONFIG.shield.blockHp).toBe(3);
  });

  it('startWave is 1', () => {
    expect(CONFIG.shield.startWave).toBe(1);
  });

  it('count is 3', () => {
    expect(CONFIG.shield.count).toBe(3);
  });
});

describe('createShields', () => {
  it('creates blocks and adds them to the scene', () => {
    const scene = new ex.Scene() as unknown as ex.Scene;
    const blocks = createShields(scene);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('creates blocks for each of the configured shield count', () => {
    const scene = new ex.Scene() as unknown as ex.Scene;
    const blocks = createShields(scene);
    // Each shield is a dome shape from a 16x12 grid, so there are many blocks per shield
    // With 3 shields, we expect a significant number of blocks
    // The exact count depends on the dome shape, but it should be > 3 shields worth
    expect(blocks.length).toBeGreaterThan(CONFIG.shield.count);
  });

  it('all blocks are ShieldBlock instances', () => {
    const scene = new ex.Scene() as unknown as ex.Scene;
    const blocks = createShields(scene);
    for (const block of blocks) {
      expect(block).toBeInstanceOf(ShieldBlock);
    }
  });

  it('all blocks start with full HP', () => {
    const scene = new ex.Scene() as unknown as ex.Scene;
    const blocks = createShields(scene);
    for (const block of blocks) {
      expect(block.hp).toBe(CONFIG.shield.blockHp);
    }
  });
});
