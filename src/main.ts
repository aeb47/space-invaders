import * as ex from 'excalibur';
import { CONFIG } from './config';
import { GameScene } from './scenes/game';

const game = new ex.Engine({
  width: CONFIG.canvas.width,
  height: CONFIG.canvas.height,
  backgroundColor: ex.Color.fromHex('#0a0a2a'),
});

game.add('game', new GameScene());
game.goToScene('game');
game.start();
