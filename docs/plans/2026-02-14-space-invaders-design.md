# Space Invaders — Design Document

## Overview

Modern take on the classic 1978 Space Invaders arcade game. Browser-based, built with Excalibur.js (TypeScript), deployed to Railway.

**Initial scope**: Core gameplay loop only — player, alien grid, shooting, scoring, lives, wave progression. No shields, UFO, sound, or leaderboards in v1.

## Tech Stack

- **Engine**: Excalibur.js (~160-200 kB, native TypeScript)
- **Build**: Vite
- **Language**: TypeScript
- **Production server**: Express (serves static `dist/`)
- **Deploy**: Railway (auto-detects Node.js, sets PORT)

## Project Structure

```
space-invaders/
  package.json
  tsconfig.json
  vite.config.ts
  server.ts              -- Express static server for production
  src/
    main.ts              -- Engine init, scene registration, start
    config.ts            -- Constants: speeds, grid size, scores, colors
    scenes/
      game.ts            -- Main game scene: spawns actors, game logic, HUD
    actors/
      player.ts          -- Player ship: left/right movement, fire bullet
      alien.ts           -- Single alien: type, point value, sprite frame
      alien-grid.ts      -- 5x11 formation: movement, speed curve, drop logic
      bullet.ts          -- Bullet: direction, speed, owner (player or alien)
  public/
    sprites/             -- Pixel art sprite sheets (PNG)
```

## Game Entities & Mechanics

### Player
- Moves left/right via arrow keys or A/D
- Fires with spacebar — one bullet on screen at a time
- 3 lives, displayed as ship icons in HUD
- On death: explosion, respawn after ~1s, invincibility flash for ~2s
- Clamped to screen edges

### Alien Grid (5x11 = 55 aliens)

Three types by row:
- **Top row (1 row)**: Squid — 30 points, 2 animation frames
- **Middle rows (2 rows)**: Crab — 20 points, 2 animation frames
- **Bottom rows (2 rows)**: Octopus — 10 points, 2 animation frames

Movement:
- Horizontal march, drop one row and reverse at screen edges
- Speed curve: step interval decreases as aliens die (fewer = faster)

### Alien Shooting
- Random alien from bottom-most alive row fires at timed intervals
- Max 3 enemy bullets on screen at once
- Fire rate increases slightly per wave

### Bullets
- Player bullet: upward, constant speed, destroyed on hit or off-screen
- Alien bullet: downward, destroyed on hit or off-screen
- No bullet-to-bullet collision

### Wave Progression
- Clear all 55 aliens → 1.5s pause → new wave
- Each wave: aliens start slightly lower, fire rate increases (clamped to minimum)

### Scoring & HUD
- Score top-left, lives top-right, wave number bottom-center
- Points: 10/20/30 per alien type
- Game over: lives = 0 OR aliens reach player's row

### Game States
- **Playing**: Active gameplay
- **Player Death**: Pause, explosion, respawn or game over
- **Wave Clear**: Brief pause, spawn next wave
- **Game Over**: Final score, "Press ENTER to restart"

## Rendering & Visual Style

- Canvas: 480x640 (portrait, 3:4 ratio)
- Dark background (#0a0a2a)
- Pixel art sprite sheet (single PNG)
- Player: bright green/cyan
- Aliens: distinct color per type (white/cyan, green, magenta/purple)
- Bullets: white (player), yellow/red (alien)
- HUD: white monospace text

## Collision Detection

Three Excalibur collision groups:

| Group | Collides with |
|---|---|
| PlayerGroup | Alien bullets |
| AlienGroup | Player bullets |
| BulletGroup | Nothing |

Excalibur AABB collision — no custom physics.

### Collision Events
- Player bullet → Alien: kill alien, award points, recalculate speed curve
- Alien bullet → Player: lose life, death sequence
- Bullet → screen edge: destroy bullet

## Alien Grid Logic

1. Step timer interval derived from alive alien count (55 alive = ~1s, 1 alive = ~0.05s)
2. Each step: all alive aliens move horizontally by STEP_SIZE
3. Edge detection: if any alien at edge, next step drops by DROP_SIZE and reverses
4. Invasion check: after drop, if any alien reaches player row → game over
5. Firing: separate timer, pick random bottom-row alien per column

## Config Constants

```
CANVAS_WIDTH: 480
CANVAS_HEIGHT: 640
PLAYER_SPEED: 200 px/sec
PLAYER_BULLET_SPEED: 400 px/sec
ALIEN_BULLET_SPEED: 150 px/sec
ALIEN_STEP_SIZE: 16 px
ALIEN_DROP_SIZE: 16 px
ALIEN_GRID_ROWS: 5
ALIEN_GRID_COLS: 11
MAX_ALIEN_BULLETS: 3
ALIEN_FIRE_INTERVAL: 1500 ms (decreases per wave)
STARTING_LIVES: 3
POINTS: { squid: 30, crab: 20, octopus: 10 }
```

## Dependencies

```json
{
  "dependencies": {
    "excalibur": "^0.30.x",
    "express": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x"
  }
}
```

## Railway Deployment

- `npm run build` → Vite builds client to `dist/`
- `npm start` → Express serves `dist/` on `process.env.PORT`
- No Dockerfile — Railway nixpacks auto-detects Node.js

## Future Enhancements (deferred)

- Destructible shields (4 barriers)
- UFO/mystery ship bonus
- Sound effects (Web Audio API)
- High score persistence (localStorage)
- Start screen / game over screen polish
- Bonus life at 1,500 points
- Power-ups, boss fights
- Mobile touch controls
