import * as ex from 'excalibur';
import { PlayerBulletCollisionGroup, AlienBulletCollisionGroup } from '../collision-groups';
import { CONFIG } from '../config';
import { getSpriteSheet, SpriteIndex } from '../resources';

export type BulletOwner = 'player' | 'alien';

export class Bullet extends ex.Actor {
  public owner: BulletOwner;

  constructor(pos: ex.Vector, owner: BulletOwner) {
    const isPlayer = owner === 'player';
    super({
      pos: pos.clone(),
      width: 24,
      height: 16,
      collisionType: ex.CollisionType.Active,
      collisionGroup: isPlayer ? PlayerBulletCollisionGroup : AlienBulletCollisionGroup,
      vel: ex.vec(0, isPlayer ? -CONFIG.player.bulletSpeed : CONFIG.alien.bulletSpeed),
    });
    this.owner = owner;
  }

  onInitialize(): void {
    const idx = this.owner === 'player' ? SpriteIndex.playerBullet : SpriteIndex.alienBullet;
    const sprite = getSpriteSheet().getSprite(idx % 8, Math.floor(idx / 8));
    if (sprite) this.graphics.use(sprite);
  }

  onPreUpdate(_engine: ex.Engine, _delta: number): void {
    if (this.pos.y < -10 || this.pos.y > CONFIG.canvas.height + 10) {
      this.kill();
    }
  }
}
