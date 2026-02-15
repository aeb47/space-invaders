import * as ex from 'excalibur';
import { CONFIG } from '../config';
import { ShieldGroup } from '../collision-groups';
import { getShieldColor, getShieldOpacity, getShieldDrawSize } from './shield-helpers';

export class ShieldBlock extends ex.Actor {
  public hp: number;
  private maxHp: number;

  constructor(pos: ex.Vector) {
    const size = CONFIG.shield.blockSize;
    super({
      pos: pos.clone(),
      width: size,
      height: size,
      collisionType: ex.CollisionType.Passive,
      collisionGroup: ShieldGroup,
    });
    this.maxHp = CONFIG.shield.blockHp;
    this.hp = this.maxHp;
  }

  onInitialize(): void {
    this.updateVisual();
  }

  hit(): boolean {
    this.hp--;
    if (this.hp <= 0) {
      // TODO: debris particles (F2.4)
      this.kill();
      return false;
    }
    // TODO: crumble sound placeholder (F2.3)
    this.updateVisual();
    return true;
  }

  private updateVisual(): void {
    const blockSize = CONFIG.shield.blockSize;
    const drawSize = getShieldDrawSize(this.hp, this.maxHp, blockSize);
    const color = getShieldColor(this.hp, this.maxHp);
    const opacity = getShieldOpacity(this.hp, this.maxHp);

    const rect = new ex.Rectangle({
      width: drawSize,
      height: drawSize,
      color: ex.Color.fromHex(color),
    });
    this.graphics.use(rect);
    this.graphics.opacity = opacity;
  }
}

const SHIELD_W = 16;
const SHIELD_H = 12;

/**
 * Dome-shaped shield with a smooth rounded top and arch cutout at bottom.
 */
function isShieldBlock(col: number, row: number): boolean {
  const cx = (SHIELD_W - 1) / 2;
  const cy = (SHIELD_H - 1) / 2;

  // Dome top: use ellipse — blocks outside the ellipse radius are empty
  const dx = (col - cx) / (SHIELD_W / 2);
  const dy = (row - cy) / (SHIELD_H / 2);
  if (dx * dx + dy * dy > 1) return false;

  // Arch cutout at bottom center: 6-block wide, 4-block tall opening
  const archHalfW = 3;
  const archH = 4;
  if (row >= SHIELD_H - archH && Math.abs(col - cx) < archHalfW) return false;

  return true;
}

/**
 * Generate randomized X positions for shields, ensuring minimum spacing.
 */
function randomShieldPositions(count: number, shieldPixelWidth: number): number[] {
  const margin = CONFIG.shield.xMargin;
  const minSpacing = CONFIG.shield.minSpacing;
  const canvasW = CONFIG.canvas.width;
  const maxX = canvasW - margin - shieldPixelWidth;

  // Try random placement with spacing constraint (with fallback to even spacing)
  for (let attempt = 0; attempt < 50; attempt++) {
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(margin + Math.random() * (maxX - margin));
    }
    positions.sort((a, b) => a - b);

    let valid = true;
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] - positions[i - 1] < minSpacing + shieldPixelWidth) {
        valid = false;
        break;
      }
    }
    if (valid) return positions;
  }

  // Fallback: evenly spaced
  const totalWidth = count * shieldPixelWidth;
  const gap = (canvasW - totalWidth) / (count + 1);
  return Array.from({ length: count }, (_, i) => gap + i * (shieldPixelWidth + gap));
}

/**
 * Creates shields at randomized positions and adds them to the scene.
 */
export function createShields(scene: ex.Scene): ShieldBlock[] {
  const blocks: ShieldBlock[] = [];
  const count = CONFIG.shield.count;
  const blockSize = CONFIG.shield.blockSize;
  const shieldPixelWidth = SHIELD_W * blockSize;
  const xPositions = randomShieldPositions(count, shieldPixelWidth);

  for (let s = 0; s < count; s++) {
    const shieldX = xPositions[s];

    for (let row = 0; row < SHIELD_H; row++) {
      for (let col = 0; col < SHIELD_W; col++) {
        if (isShieldBlock(col, row)) {
          const x = shieldX + col * blockSize + blockSize / 2;
          const y = CONFIG.shield.yPosition + row * blockSize + blockSize / 2;
          const block = new ShieldBlock(ex.vec(x, y));
          scene.add(block);
          blocks.push(block);
        }
      }
    }
  }

  return blocks;
}
