import * as ex from 'excalibur';

const game = new ex.Engine({
  width: 480,
  height: 640,
  backgroundColor: ex.Color.fromHex('#0a0a2a'),
});

game.start();
