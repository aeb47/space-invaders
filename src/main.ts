import * as ex from 'excalibur';
import { CONFIG } from './config';
import { Player } from './actors/player';

const game = new ex.Engine({
  width: CONFIG.canvas.width,
  height: CONFIG.canvas.height,
  backgroundColor: ex.Color.fromHex('#0a0a2a'),
});

const player = new Player();
game.add(player);

game.start();
