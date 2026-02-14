import * as ex from 'excalibur';
import { AlienCollisionGroup } from '../collision-groups';
import { CONFIG } from '../config';

export type AlienType = 'squid' | 'crab' | 'octopus';

const ALIEN_COLORS: Record<AlienType, ex.Color> = {
  squid: ex.Color.fromHex('#00ffff'),
  crab: ex.Color.fromHex('#00ff00'),
  octopus: ex.Color.fromHex('#ff00ff'),
};

export class Alien extends ex.Actor {
  public alienType: AlienType;
  public points: number;

  constructor(pos: ex.Vector, alienType: AlienType) {
    super({
      pos: pos.clone(),
      width: 24,
      height: 16,
      color: ALIEN_COLORS[alienType],
      collisionType: ex.CollisionType.Passive,
      collisionGroup: AlienCollisionGroup,
    });
    this.alienType = alienType;
    this.points = CONFIG.points[alienType];
  }
}
