import * as ex from 'excalibur';
import { PlayerBulletCollisionGroup, AlienBulletCollisionGroup } from '../collision-groups';
import { CONFIG } from '../config';

export type BulletOwner = 'player' | 'alien';

export class Bullet extends ex.Actor {
  public owner: BulletOwner;

  constructor(pos: ex.Vector, owner: BulletOwner) {
    const isPlayer = owner === 'player';
    super({
      pos: pos.clone(),
      width: 3,
      height: 10,
      color: isPlayer ? ex.Color.White : ex.Color.Yellow,
      collisionType: ex.CollisionType.Active,
      collisionGroup: isPlayer ? PlayerBulletCollisionGroup : AlienBulletCollisionGroup,
      vel: ex.vec(0, isPlayer ? -CONFIG.player.bulletSpeed : CONFIG.alien.bulletSpeed),
    });
    this.owner = owner;
  }

  onPreUpdate(_engine: ex.Engine, _delta: number): void {
    if (this.pos.y < -10 || this.pos.y > CONFIG.canvas.height + 10) {
      this.kill();
    }
  }
}
