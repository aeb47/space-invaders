import * as ex from 'excalibur';
import { CONFIG } from '../config';
import { PlayerCollisionGroup } from '../collision-groups';
import { getSpriteSheet, SpriteIndex } from '../resources';
import { Bullet } from './bullet';

export class Player extends ex.Actor {
  private activeBullet: Bullet | null = null;

  constructor() {
    super({
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.player.yPosition),
      width: 24,
      height: 16,
      collisionType: ex.CollisionType.Passive,
      collisionGroup: PlayerCollisionGroup,
    });
  }

  onInitialize(): void {
    const sprite = getSpriteSheet().getSprite(SpriteIndex.player % 8, Math.floor(SpriteIndex.player / 8));
    if (sprite) this.graphics.use(sprite);
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.vel.x = 0;

    if (engine.input.keyboard.isHeld(ex.Keys.Left) || engine.input.keyboard.isHeld(ex.Keys.A)) {
      this.vel.x = -CONFIG.player.speed;
    }
    if (engine.input.keyboard.isHeld(ex.Keys.Right) || engine.input.keyboard.isHeld(ex.Keys.D)) {
      this.vel.x = CONFIG.player.speed;
    }

    // Clamp to screen edges
    const halfWidth = this.width / 2;
    if (this.pos.x < halfWidth) this.pos.x = halfWidth;
    if (this.pos.x > CONFIG.canvas.width - halfWidth) this.pos.x = CONFIG.canvas.width - halfWidth;

    if (engine.input.keyboard.wasPressed(ex.Keys.Space)) {
      this.fire(engine);
    }
  }

  private fire(engine: ex.Engine): void {
    if (this.activeBullet && !this.activeBullet.isKilled()) return;
    this.activeBullet = new Bullet(ex.vec(this.pos.x, this.pos.y - 16), 'player');
    engine.add(this.activeBullet);
  }
}
