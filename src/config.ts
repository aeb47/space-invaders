export const CONFIG = {
  canvas: {
    width: 480,
    height: 640,
  },
  player: {
    speed: 200,
    bulletSpeed: 400,
    startingLives: 3,
    respawnTime: 1000,
    invincibilityTime: 2000,
    yPosition: 600,
  },
  alien: {
    gridRows: 5,
    gridCols: 11,
    stepSize: 16,
    dropSize: 16,
    bulletSpeed: 150,
    maxBullets: 3,
    fireInterval: 1500,
    fireIntervalDecrease: 100,
    minFireInterval: 400,
    startY: 100,
    waveYOffset: 16,
    spacing: { x: 36, y: 32 },
  },
  points: {
    squid: 30,
    crab: 20,
    octopus: 10,
  } as Record<string, number>,
  wave: {
    clearPause: 1500,
  },
} as const;
