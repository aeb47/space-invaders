import * as ex from 'excalibur';
import { CONFIG } from '../config';
import { PlayerCollisionGroup } from '../collision-groups';

export class Player extends ex.Actor {
  constructor() {
    super({
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.player.yPosition),
      width: 30,
      height: 16,
      color: ex.Color.fromHex('#00ffcc'),
      collisionType: ex.CollisionType.Passive,
      collisionGroup: PlayerCollisionGroup,
    });
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
  }
}
