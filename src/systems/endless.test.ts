import { describe, it, expect, beforeEach } from 'vitest';
import { EndlessSpawner, FormationType } from './endless';
import { CONFIG } from '../config';

describe('EndlessSpawner', () => {
  let spawner: EndlessSpawner;

  beforeEach(() => {
    spawner = new EndlessSpawner();
  });

  it('starts with initial spawn interval', () => {
    expect(spawner.getSpawnInterval()).toBe(CONFIG.endless.initialSpawnInterval);
  });

  it('spawn interval decreases over time', () => {
    spawner.addElapsedTime(60000); // 1 minute
    const expected = CONFIG.endless.initialSpawnInterval - CONFIG.endless.spawnIntervalDecrease;
    expect(spawner.getSpawnInterval()).toBe(expected);
  });

  it('spawn interval does not go below minimum', () => {
    // Need (6000 - 1500) / 100 = 45 minutes to reach minimum
    spawner.addElapsedTime(60 * 60000); // 60 minutes, well past cap
    expect(spawner.getSpawnInterval()).toBe(CONFIG.endless.minSpawnInterval);
  });

  it('shouldSpawn returns false initially', () => {
    expect(spawner.shouldSpawn(100)).toBe(false);
  });

  it('shouldSpawn returns true after interval', () => {
    // Accumulate enough time
    const interval = spawner.getSpawnInterval();
    expect(spawner.shouldSpawn(interval + 1)).toBe(true);
  });

  it('shouldSpawn resets timer after spawning', () => {
    const interval = spawner.getSpawnInterval();
    spawner.shouldSpawn(interval + 1);
    expect(spawner.shouldSpawn(100)).toBe(false);
  });

  it('getGroupSize returns value within configured range', () => {
    for (let i = 0; i < 50; i++) {
      const size = spawner.getGroupSize();
      expect(size).toBeGreaterThanOrEqual(CONFIG.endless.groupSizeMin);
      expect(size).toBeLessThanOrEqual(CONFIG.endless.groupSizeMax);
    }
  });

  it('getFormationType returns a valid formation', () => {
    const validTypes: FormationType[] = ['line', 'v-shape', 'diamond', 'cluster', 'column'];
    for (let i = 0; i < 20; i++) {
      expect(validTypes).toContain(spawner.getFormationType());
    }
  });

  it('getSpawnX returns value within screen bounds', () => {
    for (let i = 0; i < 50; i++) {
      const x = spawner.getSpawnX();
      expect(x).toBeGreaterThanOrEqual(40);
      expect(x).toBeLessThanOrEqual(CONFIG.canvas.width - 40);
    }
  });

  it('reset clears all state', () => {
    spawner.addElapsedTime(60000);
    spawner.shouldSpawn(10000);
    spawner.reset();
    expect(spawner.getSpawnInterval()).toBe(CONFIG.endless.initialSpawnInterval);
  });
});
