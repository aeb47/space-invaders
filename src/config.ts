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
    maxBullets: 3,
    fireCooldown: 150,
  },
  alien: {
    gridRows: 5,
    gridCols: 11,
    stepSize: 16,
    dropSize: 16,
    bulletSpeed: 150,
    maxBullets: 3,
    fireInterval: 1500,
    fireIntervalDecrease: 50,
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
  touch: {
    zoneDivider: 560,
  },
  shield: {
    count: 3,
    yPosition: 500,
    blockSize: 3,
    startWave: 1,
    xMargin: 40,
    minSpacing: 80,
    blockHp: 3,
  },
  wave: {
    clearPause: 1500,
  },
  // F1: UFO Mystery Ship
  ufo: {
    speed: 120,
    spawnIntervalMin: 20000,
    spawnIntervalMax: 40000,
    spawnIntervalDecreasePerWave: 1000,
    minSpawnInterval: 12000,
    speedIncreasePerWave: 0.10,
    pointsCycle: [50, 100, 150, 300] as readonly number[],
    yPosition: 40,
    width: 32,
    height: 16,
    scorePopupDuration: 800,
  },
  // F3: Power-Up Drops
  powerUp: {
    dropChanceBase: 0.08,
    dropChanceIncreasePerWave: 0.01,
    maxDropChance: 0.15,
    fallSpeed: 80,
    types: {
      spread: { duration: 8000, weight: 0.30, color: '#00ffff' },
      rapid: { duration: 6000, weight: 0.25, color: '#ff0000' },
      shield: { duration: 0, weight: 0.25, color: '#00ff00' },    // single-use
      multiplier: { duration: 10000, weight: 0.20, color: '#ffff00' },
    },
    expiryWarningTime: 2000,
    width: 16,
    height: 16,
  },
  // F4: Difficulty Tiers (wave-based)
  difficultyTiers: {
    recruit:   { minWave: 1,  maxWave: 3  },
    soldier:   { minWave: 4,  maxWave: 6  },
    veteran:   { minWave: 7,  maxWave: 9  },
    commander: { minWave: 10, maxWave: 12 },
    admiral:   { minWave: 13, maxWave: Infinity },
  },
  diveBomb: {
    chance: 0.10,
    speed: 180,
    bulletCount: 2,
    pointsMultiplier: 2,
    startTier: 'veteran' as const,
  },
  splitFormation: {
    chance: 0.20,
    durationSteps: 8,
    startTier: 'commander' as const,
  },
  escort: {
    speed: 160,
    points: 40,
    width: 16,
    height: 8,
    startTier: 'admiral' as const,
  },
  // F5: Boss Battles
  boss: {
    schedule: 5, // boss every N waves
    mothership: {
      width: 64,
      height: 32,
      hp: 20,
      phase2Hp: 10,
      phase3Hp: 5,
      spreadBullets: 3,
      miniAlienCount: 3,
      laserWarningTime: 1000,
      laserDuration: 300,
      points: 2500,
    },
    commander: {
      width: 64,
      height: 48,
      hp: 30,
      shieldRegenTime: 10000,
      missileSpeed: 60,
      points: 5000,
    },
    admiral: {
      width: 48,
      height: 48,
      hp: 40,
      teleportInterval: 4000,
      bulletRingCount: 8,
      points: 7500,
    },
    healthBarHeight: 8,
    defeatExplosionDuration: 1500,
  },
  // F10: Volume Controls
  audio: {
    masterVolumeDefault: 0.80,
    sfxVolumeDefault: 1.00,
    musicVolumeDefault: 0.70,
  },
  // F11: Achievement System
  achievements: {
    toastDuration: 3000,
  },
  // F12: Weapon Upgrade System
  weapon: {
    levels: [
      { name: 'Standard',    threshold: 0,    bulletSpeed: 400, fireCooldown: 150, maxBullets: 3, pattern: 'single' },
      { name: 'Accelerated', threshold: 500,  bulletSpeed: 500, fireCooldown: 100, maxBullets: 3, pattern: 'single' },
      { name: 'Double',      threshold: 1500, bulletSpeed: 500, fireCooldown: 100, maxBullets: 4, pattern: 'double' },
      { name: 'Piercing',    threshold: 3500, bulletSpeed: 500, fireCooldown: 100, maxBullets: 4, pattern: 'piercing' },
      { name: 'Plasma',      threshold: 6000, bulletSpeed: 500, fireCooldown: 1200, maxBullets: 1, pattern: 'plasma' },
    ] as const,
    doubleSpacing: 8,
    plasmaDuration: 400,
    plasmaWidth: 4,
  },
  // F14: Difficulty Selection
  difficulty: {
    recruit: {
      label: 'RECRUIT',
      lives: 5,
      alienFireIntervalBonus: 500,
      alienBulletSpeed: 100,
      shieldBlockHp: 4,
      ufoPointsMultiplier: 2,
    },
    veteran: {
      label: 'VETERAN',
      lives: 3,
      alienFireIntervalBonus: 0,
      alienBulletSpeed: 150,
      shieldBlockHp: 3,
      ufoPointsMultiplier: 1,
    },
    admiral: {
      label: 'ADMIRAL',
      lives: 2,
      alienFireIntervalBonus: -200,
      alienBulletSpeed: 200,
      shieldBlockHp: 0, // no shields
      ufoPointsMultiplier: 1,
    },
  },
  // F15: Stats Dashboard
  stats: {
    recentScoresCount: 10,
  },
  // F13: Unlockable Ships
  ships: {
    classic:     { speed: 200, fireCooldown: 150, maxBullets: 3, startingLives: 3, special: 'none' },
    interceptor: { speed: 280, fireCooldown: 120, maxBullets: 2, startingLives: 3, special: 'none' },
    fortress:    { speed: 150, fireCooldown: 180, maxBullets: 3, startingLives: 4, special: 'none' },
    sniper:      { speed: 200, fireCooldown: 300, maxBullets: 2, startingLives: 3, special: 'pierce' },
    ghost:       { speed: 220, fireCooldown: 150, maxBullets: 3, startingLives: 3, special: 'ghost' },
  },
  // F16: Endless Mode
  endless: {
    initialSpawnInterval: 6000,
    spawnIntervalDecrease: 100, // per minute
    minSpawnInterval: 1500,
    groupSizeMin: 3,
    groupSizeMax: 8,
    powerUpDropMultiplier: 1.5,
  },
  // F17: Time Attack Mode
  timeAttack: {
    duration: 90000,
    spawnInterval: 3000,
    comboWindow: 1500,
    comboThresholds: [1, 3, 6, 10, 15] as readonly number[],
    maxMultiplier: 5,
    comboBreakMissTimeout: 2000,
    grades: { S: 15000, A: 10000, B: 6000, C: 3000 } as Record<string, number>,
  },
  // F18: Daily Challenge
  daily: {
    modifiers: ['Double UFOs', 'Fast Aliens', 'Powerup Rain', 'No Shields', 'Mirror Mode'] as readonly string[],
  },
  // F19: Challenge Mode
  challenges: {
    count: 10,
  },
  // F21: Share Score Card
  share: {
    starThresholds: [3, 6, 9, 14] as readonly number[], // wave thresholds for 2-5 stars
    cardWidth: 400,
    cardHeight: 200,
  },
  // F22: Cosmetic Unlockables
  cosmetics: {
    bulletTrails: ['default', 'blue-plasma', 'red-laser', 'green-retro', 'rainbow'] as readonly string[],
    explosionStyles: ['default', 'pixel-burst', 'fireworks', 'electric', 'vaporize'] as readonly string[],
    backgrounds: ['deep-space', 'nebula', 'asteroid-field', 'retro-crt', 'synthwave'] as readonly string[],
    trailUnlockScores: [0, 10000, 25000, 50000, 100000] as readonly number[],
    backgroundUnlockMinutes: [0, 60, 180, 300, 600] as readonly number[],
  },
  // F23: Ghost Replay
  ghost: {
    sampleRateHz: 10,
    opacity: 0.30,
    offsetY: -4,
    scoreMilestoneInterval: 500,
  },
} as const;

// Type helpers
export type DifficultyTier = keyof typeof CONFIG.difficultyTiers;
export type DifficultyLevel = keyof typeof CONFIG.difficulty;
export type ShipType = keyof typeof CONFIG.ships;
export type PowerUpType = keyof typeof CONFIG.powerUp.types;
export type WeaponPattern = typeof CONFIG.weapon.levels[number]['pattern'];
export type CosmeticBulletTrail = typeof CONFIG.cosmetics.bulletTrails[number];
export type CosmeticExplosionStyle = typeof CONFIG.cosmetics.explosionStyles[number];
export type CosmeticBackground = typeof CONFIG.cosmetics.backgrounds[number];
