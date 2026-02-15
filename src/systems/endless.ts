import { CONFIG } from '../config';

export type FormationType = 'line' | 'v-shape' | 'diamond' | 'cluster' | 'column';

const FORMATIONS: FormationType[] = ['line', 'v-shape', 'diamond', 'cluster', 'column'];

export class EndlessSpawner {
  private elapsedMinutes: number = 0;
  private spawnTimer: number = 0;

  getSpawnInterval(): number {
    const decrease = this.elapsedMinutes * CONFIG.endless.spawnIntervalDecrease;
    return Math.max(
      CONFIG.endless.minSpawnInterval,
      CONFIG.endless.initialSpawnInterval - decrease,
    );
  }

  addElapsedTime(ms: number): void {
    this.elapsedMinutes += ms / 60000;
  }

  shouldSpawn(delta: number): boolean {
    this.spawnTimer += delta;
    this.addElapsedTime(delta);
    if (this.spawnTimer >= this.getSpawnInterval()) {
      this.spawnTimer = 0;
      return true;
    }
    return false;
  }

  getGroupSize(): number {
    return CONFIG.endless.groupSizeMin +
      Math.floor(Math.random() * (CONFIG.endless.groupSizeMax - CONFIG.endless.groupSizeMin + 1));
  }

  getFormationType(): FormationType {
    return FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
  }

  getSpawnX(): number {
    const margin = 40;
    return margin + Math.random() * (CONFIG.canvas.width - 2 * margin);
  }

  reset(): void {
    this.elapsedMinutes = 0;
    this.spawnTimer = 0;
  }
}
