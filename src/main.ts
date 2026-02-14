import * as ex from 'excalibur';
import { CONFIG } from './config';

const game = new ex.Engine({
  width: CONFIG.canvas.width,
  height: CONFIG.canvas.height,
  backgroundColor: ex.Color.fromHex('#0a0a2a'),
});

game.start();
