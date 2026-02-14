import * as ex from 'excalibur';

const spritesheetImage = new ex.ImageSource('/sprites/spritesheet.png');

export const Resources = {
  spritesheetImage,
};

export const loader = new ex.Loader([spritesheetImage]);

// Sprite sheet layout: 8 cols x 2 rows, each cell 24x16
// Row 0: player, squid-f1, squid-f2, crab-f1, crab-f2, octopus-f1, octopus-f2, explosion
// Row 1: player-bullet, alien-bullet, (empty)
let spriteSheet: ex.SpriteSheet;

export function getSpriteSheet(): ex.SpriteSheet {
  if (!spriteSheet) {
    spriteSheet = ex.SpriteSheet.fromImageSource({
      image: spritesheetImage,
      grid: {
        rows: 2,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 16,
      },
    });
  }
  return spriteSheet;
}

// Sprite indices (row * columns + col)
export const SpriteIndex = {
  player: 0,
  squidFrame1: 1,
  squidFrame2: 2,
  crabFrame1: 3,
  crabFrame2: 4,
  octopusFrame1: 5,
  octopusFrame2: 6,
  explosion: 7,
  playerBullet: 8,
  alienBullet: 9,
} as const;
