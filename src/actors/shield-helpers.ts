/**
 * Color lookup by HP level (ratio of current to max).
 * HP 3 (full): bright green, HP 2: yellow-green, HP 1: dark yellow
 */
export function getShieldColor(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio > 2 / 3) return '#00ff00';
  if (ratio > 1 / 3) return '#88cc00';
  return '#cc8800';
}

/**
 * Opacity by HP level.
 * HP 3 (full): 1.0, HP 2: 0.8, HP 1: 0.5
 */
export function getShieldOpacity(hp: number, maxHp: number): number {
  const ratio = hp / maxHp;
  if (ratio > 2 / 3) return 1.0;
  if (ratio > 1 / 3) return 0.8;
  return 0.5;
}

/**
 * Draw size by HP level.
 * Full/mid HP: full blockSize, low HP: blockSize - 1 (smaller within cell)
 */
export function getShieldDrawSize(hp: number, maxHp: number, blockSize: number): number {
  const ratio = hp / maxHp;
  if (ratio > 1 / 3) return blockSize;
  return Math.max(1, blockSize - 1);
}
