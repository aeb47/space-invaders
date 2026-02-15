import { CONFIG } from '../config';

/** Deterministic scoring: points cycle through [50, 100, 150, 300] based on
 *  the player's cumulative shot count (mod 4). */
export function getUfoPoints(shotCount: number): number {
  const cycle = CONFIG.ufo.pointsCycle;
  return cycle[shotCount % cycle.length];
}

/** UFO speed increases by 10% per wave (additive, starting from wave 1). */
export function getUfoSpeed(wave: number): number {
  return CONFIG.ufo.speed * (1 + CONFIG.ufo.speedIncreasePerWave * (wave - 1));
}

/** Spawn interval range decreases by 1 s per wave, clamped at the configured minimum. */
export function getUfoSpawnInterval(wave: number): { min: number; max: number } {
  const decrease = CONFIG.ufo.spawnIntervalDecreasePerWave * (wave - 1);
  const min = Math.max(CONFIG.ufo.minSpawnInterval, CONFIG.ufo.spawnIntervalMin - decrease);
  const max = Math.max(min, CONFIG.ufo.spawnIntervalMax - decrease);
  return { min, max };
}

/** Direction alternates per spawn: even = left-to-right (1), odd = right-to-left (-1). */
export function getUfoDirection(spawnCount: number): 1 | -1 {
  return spawnCount % 2 === 0 ? 1 : -1;
}
