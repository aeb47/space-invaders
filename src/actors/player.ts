import * as ex from 'excalibur';
import { CONFIG } from '../config';
import { PlayerGroup } from '../collision-groups';
import { getSpriteSheet, SpriteIndex } from '../resources';
import { Bullet } from './bullet';
import { audio } from '../audio';

export class Player extends ex.Actor {
  private activeBullets: Bullet[] = [];
  private fireCooldownTimer: number = 0;
  private pointerHandler: ((evt: ex.PointerEvent) => void) | null = null;

  constructor() {
    super({
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.player.yPosition),
      width: 24,
      height: 16,
      collisionType: ex.CollisionType.Passive,
      collisionGroup: PlayerGroup,
    });
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.vel.x = 0;
    this.fireCooldownTimer = Math.max(0, this.fireCooldownTimer - delta);

    // Keyboard movement
    if (engine.input.keyboard.isHeld(ex.Keys.Left) || engine.input.keyboard.isHeld(ex.Keys.A)) {
      this.vel.x = -CONFIG.player.speed;
    }
    if (engine.input.keyboard.isHeld(ex.Keys.Right) || engine.input.keyboard.isHeld(ex.Keys.D)) {
      this.vel.x = CONFIG.player.speed;
    }

    // Touch movement: only in the bottom movement zone
    if (engine.input.pointers.isDown(0)) {
      const pointerPos = engine.input.pointers.primary.lastWorldPos;
      if (pointerPos.y > CONFIG.touch.zoneDivider) {
        if (pointerPos.x < CONFIG.canvas.width / 2) {
          this.vel.x = -CONFIG.player.speed;
        } else {
          this.vel.x = CONFIG.player.speed;
        }
      }
    }

    // Clamp to screen edges
    const halfWidth = this.width / 2;
    if (this.pos.x < halfWidth) this.pos.x = halfWidth;
    if (this.pos.x > CONFIG.canvas.width - halfWidth) this.pos.x = CONFIG.canvas.width - halfWidth;

    // Keyboard fire
    if (engine.input.keyboard.wasPressed(ex.Keys.Space)) {
      this.fire(engine);
    }
  }

  onInitialize(engine: ex.Engine): void {
    const sprite = getSpriteSheet().getSprite(SpriteIndex.player % 8, Math.floor(SpriteIndex.player / 8));
    if (sprite) this.graphics.use(sprite);

    // Touch fire: only in the game area (above movement zone)
    this.pointerHandler = (evt: ex.PointerEvent) => {
      if (!this.isKilled() && evt.worldPos.y <= CONFIG.touch.zoneDivider) {
        this.fire(engine);
      }
    };
    engine.input.pointers.on('down', this.pointerHandler);
  }

  onPreKill(): void {
    if (this.pointerHandler && this.scene?.engine) {
      this.scene.engine.input.pointers.off('down', this.pointerHandler);
      this.pointerHandler = null;
    }
  }

  fire(engine: ex.Engine): void {
    if (this.fireCooldownTimer > 0) return;
    this.activeBullets = this.activeBullets.filter(b => !b.isKilled());
    if (this.activeBullets.length >= CONFIG.player.maxBullets) return;

    audio.playerShoot();
    const bullet = new Bullet(ex.vec(this.pos.x, this.pos.y - 16), 'player');
    this.activeBullets.push(bullet);
    engine.add(bullet);
    this.fireCooldownTimer = CONFIG.player.fireCooldown;
  }
}
