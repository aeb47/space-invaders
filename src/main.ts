import * as ex from 'excalibur';
import { CONFIG } from './config';
import { Player } from './actors/player';
import { AlienGrid } from './actors/alien-grid';

const game = new ex.Engine({
  width: CONFIG.canvas.width,
  height: CONFIG.canvas.height,
  backgroundColor: ex.Color.fromHex('#0a0a2a'),
});

const player = new Player();
game.add(player);

const alienGrid = new AlienGrid(game.currentScene);

game.on('preupdate', (evt: ex.PreUpdateEvent) => {
  alienGrid.update(evt.delta, CONFIG.alien.fireInterval);
});

game.start();
