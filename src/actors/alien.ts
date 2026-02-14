import * as ex from 'excalibur';
import { AlienCollisionGroup } from '../collision-groups';
import { CONFIG } from '../config';
import { getSpriteSheet, SpriteIndex } from '../resources';

export type AlienType = 'squid' | 'crab' | 'octopus';

const ALIEN_FRAMES: Record<AlienType, [number, number]> = {
  squid: [SpriteIndex.squidFrame1, SpriteIndex.squidFrame2],
  crab: [SpriteIndex.crabFrame1, SpriteIndex.crabFrame2],
  octopus: [SpriteIndex.octopusFrame1, SpriteIndex.octopusFrame2],
};

export class Alien extends ex.Actor {
  public alienType: AlienType;
  public points: number;
  private frameIndex: number = 0;

  constructor(pos: ex.Vector, alienType: AlienType) {
    super({
      pos: pos.clone(),
      width: 24,
      height: 16,
      collisionType: ex.CollisionType.Passive,
      collisionGroup: AlienCollisionGroup,
    });
    this.alienType = alienType;
    this.points = CONFIG.points[alienType];
  }

  onInitialize(): void {
    this.updateSprite();
  }

  toggleFrame(): void {
    this.frameIndex = this.frameIndex === 0 ? 1 : 0;
    this.updateSprite();
  }

  private updateSprite(): void {
    const frames = ALIEN_FRAMES[this.alienType];
    const idx = frames[this.frameIndex];
    const sprite = getSpriteSheet().getSprite(idx % 8, Math.floor(idx / 8));
    if (sprite) this.graphics.use(sprite);
  }
}
