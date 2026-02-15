import * as ex from 'excalibur';
import { CONFIG, PowerUpType } from '../config';

export class PowerUpActor extends ex.Actor {
  public type: PowerUpType;

  constructor(x: number, y: number, type: PowerUpType) {
    const typeConfig = CONFIG.powerUp.types[type];
    super({
      pos: ex.vec(x, y),
      vel: ex.vec(0, CONFIG.powerUp.fallSpeed),
      width: CONFIG.powerUp.width,
      height: CONFIG.powerUp.height,
      color: ex.Color.fromHex(typeConfig.color),
      collisionType: ex.CollisionType.Passive,
    });
    this.type = type;
  }

  onPreUpdate(_engine: ex.Engine, _delta: number): void {
    if (this.pos.y > CONFIG.canvas.height + 10) {
      this.kill();
    }
  }
}
