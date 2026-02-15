import * as ex from 'excalibur';
import { CONFIG } from '../config';
import { UfoGroup } from '../collision-groups';
import { getUfoPoints } from './ufo-logic';
export { getUfoPoints, getUfoSpeed, getUfoSpawnInterval, getUfoDirection } from './ufo-logic';

export class Ufo extends ex.Actor {
  public pointsValue: number;

  constructor(opts: { direction: 1 | -1; speed: number; shotCount: number }) {
    const { direction, speed } = opts;
    const canvasWidth = CONFIG.canvas.width;
    const startX = direction === 1 ? -CONFIG.ufo.width : canvasWidth + CONFIG.ufo.width;

    super({
      pos: ex.vec(startX, CONFIG.ufo.yPosition),
      width: CONFIG.ufo.width,
      height: CONFIG.ufo.height,
      vel: ex.vec(direction * speed, 0),
      collisionType: ex.CollisionType.Passive,
      collisionGroup: UfoGroup,
    });

    this.pointsValue = getUfoPoints(opts.shotCount);
  }

  onInitialize(): void {
    // Use a colored rectangle as placeholder sprite (F1.7)
    this.graphics.use(
      new ex.Rectangle({
        width: CONFIG.ufo.width,
        height: CONFIG.ufo.height,
        color: ex.Color.Red,
      }),
    );

    // Display "?" label until hit
    const label = new ex.Label({
      text: '?',
      pos: ex.vec(0, -14),
      font: new ex.Font({ size: 12, color: ex.Color.White, textAlign: ex.TextAlign.Center }),
    });
    this.addChild(label);
  }

  onPreUpdate(_engine: ex.Engine, _delta: number): void {
    // Auto-kill when off-screen on the far side
    const margin = CONFIG.ufo.width * 2;
    if (this.vel.x > 0 && this.pos.x > CONFIG.canvas.width + margin) {
      this.kill();
    } else if (this.vel.x < 0 && this.pos.x < -margin) {
      this.kill();
    }
  }

  /** Spawn a floating score popup that rises and fades over 800 ms. */
  spawnScorePopup(scene: ex.Scene): void {
    const popup = new ex.Label({
      text: `${this.pointsValue}`,
      pos: this.pos.clone(),
      font: new ex.Font({ size: 14, color: ex.Color.Yellow, textAlign: ex.TextAlign.Center }),
    });
    scene.add(popup);

    popup.actions
      .moveBy(ex.vec(0, -30), CONFIG.ufo.scorePopupDuration)
      .callMethod(() => popup.kill());

    popup.actions.fade(0, CONFIG.ufo.scorePopupDuration);
  }
}
