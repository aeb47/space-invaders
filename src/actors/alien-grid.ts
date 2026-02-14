import * as ex from 'excalibur';
import { Alien, AlienType } from './alien';
import { Bullet } from './bullet';
import { CONFIG } from '../config';

const ROW_TYPES: AlienType[] = ['squid', 'crab', 'crab', 'octopus', 'octopus'];

export class AlienGrid {
  public aliens: Alien[] = [];
  private direction: number = 1; // 1 = right, -1 = left
  private stepTimer: number = 0;
  private fireTimer: number = 0;
  private scene: ex.Scene;
  private activeBullets: Bullet[] = [];

  constructor(scene: ex.Scene, startY: number = CONFIG.alien.startY) {
    this.scene = scene;
    this.spawnGrid(startY);
  }

  private spawnGrid(startY: number): void {
    const { gridRows, gridCols, spacing } = CONFIG.alien;
    const gridWidth = (gridCols - 1) * spacing.x;
    const offsetX = (CONFIG.canvas.width - gridWidth) / 2;

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = offsetX + col * spacing.x;
        const y = startY + row * spacing.y;
        const alien = new Alien(ex.vec(x, y), ROW_TYPES[row]);
        this.aliens.push(alien);
        this.scene.add(alien);
      }
    }
  }

  get aliveCount(): number {
    return this.aliens.filter(a => !a.isKilled()).length;
  }

  get allDead(): boolean {
    return this.aliveCount === 0;
  }

  private getStepInterval(): number {
    const alive = this.aliveCount;
    const total = CONFIG.alien.gridRows * CONFIG.alien.gridCols;
    // Linear interpolation: 55 alive = 1000ms, 1 alive = 50ms
    return 50 + (950 * alive) / total;
  }

  update(delta: number, fireInterval: number): void {
    // Movement stepping
    this.stepTimer += delta;
    const interval = this.getStepInterval();
    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      this.step();
    }

    // Alien shooting
    this.fireTimer += delta;
    if (this.fireTimer >= fireInterval) {
      this.fireTimer = 0;
      this.fireAlienBullet();
    }

    // Clean up dead bullets
    this.activeBullets = this.activeBullets.filter(b => !b.isKilled());
  }

  private step(): void {
    const alive = this.aliens.filter(a => !a.isKilled());
    if (alive.length === 0) return;

    // Check if any alien is at the edge
    const atEdge = alive.some(a => {
      const nextX = a.pos.x + this.direction * CONFIG.alien.stepSize;
      return nextX < 20 || nextX > CONFIG.canvas.width - 20;
    });

    if (atEdge) {
      // Drop and reverse
      alive.forEach(a => {
        a.pos.y += CONFIG.alien.dropSize;
      });
      this.direction *= -1;
    } else {
      alive.forEach(a => {
        a.pos.x += this.direction * CONFIG.alien.stepSize;
      });
    }
  }

  private fireAlienBullet(): void {
    if (this.activeBullets.length >= CONFIG.alien.maxBullets) return;

    const alive = this.aliens.filter(a => !a.isKilled());
    if (alive.length === 0) return;

    // Pick a random bottom-most alien from each column
    const bottomAliens = this.getBottomAliens(alive);
    if (bottomAliens.length === 0) return;

    const shooter = bottomAliens[Math.floor(Math.random() * bottomAliens.length)];
    const bullet = new Bullet(ex.vec(shooter.pos.x, shooter.pos.y + 16), 'alien');
    this.scene.add(bullet);
    this.activeBullets.push(bullet);
  }

  private getBottomAliens(alive: Alien[]): Alien[] {
    // Group by approximate x position, pick the lowest y in each group
    const columns = new Map<number, Alien>();
    for (const alien of alive) {
      const col = Math.round(alien.pos.x / CONFIG.alien.spacing.x);
      const existing = columns.get(col);
      if (!existing || alien.pos.y > existing.pos.y) {
        columns.set(col, alien);
      }
    }
    return Array.from(columns.values());
  }

  hasReachedPlayer(): boolean {
    return this.aliens
      .filter(a => !a.isKilled())
      .some(a => a.pos.y >= CONFIG.player.yPosition - 20);
  }

  destroy(): void {
    this.aliens.forEach(a => { if (!a.isKilled()) a.kill(); });
    this.activeBullets.forEach(b => { if (!b.isKilled()) b.kill(); });
    this.aliens = [];
    this.activeBullets = [];
  }
}
