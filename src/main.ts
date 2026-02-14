import * as ex from 'excalibur';
import { CONFIG } from './config';
import { GameScene } from './scenes/game';
import { loader } from './resources';

const game = new ex.Engine({
  width: CONFIG.canvas.width,
  height: CONFIG.canvas.height,
  displayMode: ex.DisplayMode.FitScreen,
  backgroundColor: ex.Color.fromHex('#0a0a2a'),
});

game.add('game', new GameScene());
game.start(loader).then(() => {
  game.goToScene('game');
});
