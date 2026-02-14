# Space Invaders Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based Space Invaders game with core gameplay loop — player, alien grid, shooting, scoring, lives, wave progression.

**Architecture:** Excalibur.js game engine with TypeScript. Vite for dev/build. Express serves the built static files for Railway deployment. Modular file structure with separate actors for each game entity.

**Tech Stack:** Excalibur.js, TypeScript, Vite, Express, Railway

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`

**Step 1: Initialize npm and install dependencies**

Run:
```bash
cd /Users/andrew.bentley/workspace/space-invaders
npm init -y
npm install excalibur express
npm install -D typescript vite @types/express
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": ".",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "server.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/public',
  },
});
```

**Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Space Invaders</title>
  <style>
    body {
      margin: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 5: Create src/main.ts with minimal engine**

```typescript
import * as ex from 'excalibur';

const game = new ex.Engine({
  width: 480,
  height: 640,
  backgroundColor: ex.Color.fromHex('#0a0a2a'),
});

game.start();
```

**Step 6: Add scripts to package.json**

Update the `"scripts"` section:
```json
{
  "dev": "vite",
  "build": "vite build && npx tsc --project tsconfig.server.json",
  "start": "node dist/server.js"
}
```

**Step 7: Run dev server to verify**

Run: `npx vite`
Expected: Browser opens with a dark blue 480x640 canvas, no errors in console.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with Vite, TypeScript, and Excalibur engine"
```

---

### Task 2: Config Constants

**Files:**
- Create: `src/config.ts`

**Step 1: Create config.ts with all game constants**

```typescript
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
```

**Step 2: Update src/main.ts to use config**

Replace hardcoded values in `main.ts` with `CONFIG.canvas.width` and `CONFIG.canvas.height`.

**Step 3: Verify dev server still works**

Run: `npx vite`
Expected: Same dark blue canvas, no errors.

**Step 4: Commit**

```bash
git add src/config.ts src/main.ts
git commit -m "feat: add game config constants"
```

---

### Task 3: Player Actor

**Files:**
- Create: `src/actors/player.ts`
- Create: `src/collision-groups.ts`
- Modify: `src/main.ts`

**Step 1: Create collision-groups.ts**

Centralize all collision groups to avoid circular imports:

```typescript
import { CollisionGroup, CollisionGroupManager } from 'excalibur';

const PlayerGroup = CollisionGroupManager.create('player');
const AlienGroup = CollisionGroupManager.create('alien');
const PlayerBulletGroup = CollisionGroupManager.create('playerBullet');
const AlienBulletGroup = CollisionGroupManager.create('alienBullet');

export const PlayerCollisionGroup = CollisionGroup.collidesWith([AlienBulletGroup]);
export const AlienCollisionGroup = CollisionGroup.collidesWith([PlayerBulletGroup]);
export const PlayerBulletCollisionGroup = CollisionGroup.collidesWith([AlienGroup]);
export const AlienBulletCollisionGroup = CollisionGroup.collidesWith([PlayerGroup]);
```

**Step 2: Create src/actors/player.ts**

```typescript
import * as ex from 'excalibur';
import { CONFIG } from '../config';
import { PlayerCollisionGroup } from '../collision-groups';

export class Player extends ex.Actor {
  constructor() {
    super({
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.player.yPosition),
      width: 30,
      height: 16,
      color: ex.Color.fromHex('#00ffcc'),
      collisionType: ex.CollisionType.Passive,
      collisionGroup: PlayerCollisionGroup,
    });
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.vel.x = 0;

    if (engine.input.keyboard.isHeld(ex.Keys.Left) || engine.input.keyboard.isHeld(ex.Keys.A)) {
      this.vel.x = -CONFIG.player.speed;
    }
    if (engine.input.keyboard.isHeld(ex.Keys.Right) || engine.input.keyboard.isHeld(ex.Keys.D)) {
      this.vel.x = CONFIG.player.speed;
    }

    // Clamp to screen edges
    const halfWidth = this.width / 2;
    if (this.pos.x < halfWidth) this.pos.x = halfWidth;
    if (this.pos.x > CONFIG.canvas.width - halfWidth) this.pos.x = CONFIG.canvas.width - halfWidth;
  }
}
```

**Step 3: Add Player to main.ts**

Import `Player` and add it to the engine:
```typescript
import { Player } from './actors/player';

// after engine creation:
const player = new Player();
game.add(player);
```

**Step 4: Verify player renders and moves**

Run: `npx vite`
Expected: Cyan rectangle near bottom of screen. Arrow keys / A/D move it left and right. Clamped at edges.

**Step 5: Commit**

```bash
git add src/actors/player.ts src/collision-groups.ts src/main.ts
git commit -m "feat: add player actor with keyboard movement"
```

---

### Task 4: Bullet Actor

**Files:**
- Create: `src/actors/bullet.ts`
- Modify: `src/actors/player.ts`

**Step 1: Create src/actors/bullet.ts**

```typescript
import * as ex from 'excalibur';
import { PlayerBulletCollisionGroup, AlienBulletCollisionGroup } from '../collision-groups';
import { CONFIG } from '../config';

export type BulletOwner = 'player' | 'alien';

export class Bullet extends ex.Actor {
  public owner: BulletOwner;

  constructor(pos: ex.Vector, owner: BulletOwner) {
    const isPlayer = owner === 'player';
    super({
      pos: pos.clone(),
      width: 3,
      height: 10,
      color: isPlayer ? ex.Color.White : ex.Color.Yellow,
      collisionType: ex.CollisionType.Active,
      collisionGroup: isPlayer ? PlayerBulletCollisionGroup : AlienBulletCollisionGroup,
      vel: ex.vec(0, isPlayer ? -CONFIG.player.bulletSpeed : CONFIG.alien.bulletSpeed),
    });
    this.owner = owner;
  }

  onPreUpdate(_engine: ex.Engine, _delta: number): void {
    if (this.pos.y < -10 || this.pos.y > CONFIG.canvas.height + 10) {
      this.kill();
    }
  }
}
```

**Step 2: Add shooting to Player**

Add to `player.ts`:
- Track whether a player bullet is active (only one at a time)
- On spacebar press, spawn a `Bullet` above the player

```typescript
import { Bullet } from './bullet';

// Inside Player class, add:
private activeBullet: Bullet | null = null;

onPreUpdate(engine: ex.Engine, delta: number): void {
  // ... existing movement code ...

  if (engine.input.keyboard.wasPressed(ex.Keys.Space)) {
    this.fire(engine);
  }
}

private fire(engine: ex.Engine): void {
  if (this.activeBullet && !this.activeBullet.isKilled()) return;
  this.activeBullet = new Bullet(ex.vec(this.pos.x, this.pos.y - 16), 'player');
  engine.add(this.activeBullet);
}
```

**Step 3: Verify shooting**

Run: `npx vite`
Expected: Spacebar fires a white bullet upward. Only one bullet on screen at a time. Bullet disappears at top of screen.

**Step 4: Commit**

```bash
git add src/actors/bullet.ts src/actors/player.ts
git commit -m "feat: add bullet actor and player shooting"
```

---

### Task 5: Alien Actor

**Files:**
- Create: `src/actors/alien.ts`

**Step 1: Create src/actors/alien.ts**

```typescript
import * as ex from 'excalibur';
import { AlienCollisionGroup } from '../collision-groups';
import { CONFIG } from '../config';

export type AlienType = 'squid' | 'crab' | 'octopus';

const ALIEN_COLORS: Record<AlienType, ex.Color> = {
  squid: ex.Color.fromHex('#00ffff'),
  crab: ex.Color.fromHex('#00ff00'),
  octopus: ex.Color.fromHex('#ff00ff'),
};

export class Alien extends ex.Actor {
  public alienType: AlienType;
  public points: number;

  constructor(pos: ex.Vector, alienType: AlienType) {
    super({
      pos: pos.clone(),
      width: 24,
      height: 16,
      color: ALIEN_COLORS[alienType],
      collisionType: ex.CollisionType.Passive,
      collisionGroup: AlienCollisionGroup,
    });
    this.alienType = alienType;
    this.points = CONFIG.points[alienType];
  }
}
```

**Step 2: Verify it compiles**

Run: `npx vite`
Expected: No errors. No visible aliens yet (added in next task).

**Step 3: Commit**

```bash
git add src/actors/alien.ts
git commit -m "feat: add alien actor with type and point value"
```

---

### Task 6: Alien Grid Formation & Movement

**Files:**
- Create: `src/actors/alien-grid.ts`
- Modify: `src/main.ts`

**Step 1: Create src/actors/alien-grid.ts**

```typescript
import * as ex from 'excalibur';
import { Alien, AlienType } from './alien';
import { Bullet } from './bullet';
import { CONFIG } from '../config';

const ROW_TYPES: AlienType[] = ['squid', 'crab', 'crab', 'octopus', 'octopus'];

export class AlienGrid {
  public aliens: Alien[] = [];
  private direction: number = 1; // 1 = right, -1 = left
  private stepTimer: number = 0;
  private fireTimer: number = 0;
  private scene: ex.Scene;
  private activeBullets: Bullet[] = [];

  constructor(scene: ex.Scene, startY: number = CONFIG.alien.startY) {
    this.scene = scene;
    this.spawnGrid(startY);
  }

  private spawnGrid(startY: number): void {
    const { gridRows, gridCols, spacing } = CONFIG.alien;
    const gridWidth = (gridCols - 1) * spacing.x;
    const offsetX = (CONFIG.canvas.width - gridWidth) / 2;

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = offsetX + col * spacing.x;
        const y = startY + row * spacing.y;
        const alien = new Alien(ex.vec(x, y), ROW_TYPES[row]);
        this.aliens.push(alien);
        this.scene.add(alien);
      }
    }
  }

  get aliveCount(): number {
    return this.aliens.filter(a => !a.isKilled()).length;
  }

  get allDead(): boolean {
    return this.aliveCount === 0;
  }

  private getStepInterval(): number {
    const alive = this.aliveCount;
    const total = CONFIG.alien.gridRows * CONFIG.alien.gridCols;
    // Linear interpolation: 55 alive = 1000ms, 1 alive = 50ms
    return 50 + (950 * alive) / total;
  }

  update(delta: number, fireInterval: number): void {
    // Movement stepping
    this.stepTimer += delta;
    const interval = this.getStepInterval();
    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      this.step();
    }

    // Alien shooting
    this.fireTimer += delta;
    if (this.fireTimer >= fireInterval) {
      this.fireTimer = 0;
      this.fireAlienBullet();
    }

    // Clean up dead bullets
    this.activeBullets = this.activeBullets.filter(b => !b.isKilled());
  }

  private step(): void {
    const alive = this.aliens.filter(a => !a.isKilled());
    if (alive.length === 0) return;

    // Check if any alien is at the edge
    const atEdge = alive.some(a => {
      const nextX = a.pos.x + this.direction * CONFIG.alien.stepSize;
      return nextX < 20 || nextX > CONFIG.canvas.width - 20;
    });

    if (atEdge) {
      // Drop and reverse
      alive.forEach(a => {
        a.pos.y += CONFIG.alien.dropSize;
      });
      this.direction *= -1;
    } else {
      alive.forEach(a => {
        a.pos.x += this.direction * CONFIG.alien.stepSize;
      });
    }
  }

  private fireAlienBullet(): void {
    if (this.activeBullets.length >= CONFIG.alien.maxBullets) return;

    const alive = this.aliens.filter(a => !a.isKilled());
    if (alive.length === 0) return;

    // Pick a random bottom-most alien from each column
    const bottomAliens = this.getBottomAliens(alive);
    if (bottomAliens.length === 0) return;

    const shooter = bottomAliens[Math.floor(Math.random() * bottomAliens.length)];
    const bullet = new Bullet(ex.vec(shooter.pos.x, shooter.pos.y + 16), 'alien');
    this.scene.add(bullet);
    this.activeBullets.push(bullet);
  }

  private getBottomAliens(alive: Alien[]): Alien[] {
    // Group by approximate x position, pick the lowest y in each group
    const columns = new Map<number, Alien>();
    for (const alien of alive) {
      const col = Math.round(alien.pos.x / CONFIG.alien.spacing.x);
      const existing = columns.get(col);
      if (!existing || alien.pos.y > existing.pos.y) {
        columns.set(col, alien);
      }
    }
    return Array.from(columns.values());
  }

  hasReachedPlayer(): boolean {
    return this.aliens
      .filter(a => !a.isKilled())
      .some(a => a.pos.y >= CONFIG.player.yPosition - 20);
  }

  destroy(): void {
    this.aliens.forEach(a => { if (!a.isKilled()) a.kill(); });
    this.activeBullets.forEach(b => { if (!b.isKilled()) b.kill(); });
    this.aliens = [];
    this.activeBullets = [];
  }
}
```

**Step 2: Add AlienGrid to main.ts**

```typescript
import { AlienGrid } from './actors/alien-grid';

// after player:
const alienGrid = new AlienGrid(game.currentScene);

game.on('preupdate', (evt: ex.PreUpdateEvent) => {
  alienGrid.update(evt.delta, CONFIG.alien.fireInterval);
});
```

**Step 3: Verify alien grid renders and moves**

Run: `npx vite`
Expected: 5x11 grid of colored rectangles marching left/right, dropping at edges. Yellow bullets fire downward from random bottom aliens. Speed increases would be visible if you could destroy aliens (not yet wired).

**Step 4: Commit**

```bash
git add src/actors/alien-grid.ts src/main.ts
git commit -m "feat: add alien grid with formation movement and shooting"
```

---

### Task 7: Collision Handling & Scoring

**Files:**
- Create: `src/scenes/game.ts`
- Modify: `src/main.ts`

**Step 1: Create src/scenes/game.ts**

Move all game logic into a proper scene:

```typescript
import * as ex from 'excalibur';
import { Player } from '../actors/player';
import { AlienGrid } from '../actors/alien-grid';
import { Alien } from '../actors/alien';
import { Bullet } from '../actors/bullet';
import { CONFIG } from '../config';

export class GameScene extends ex.Scene {
  private player!: Player;
  private alienGrid!: AlienGrid;
  private score: number = 0;
  private lives: number = CONFIG.player.startingLives;
  private wave: number = 1;
  private fireInterval: number = CONFIG.alien.fireInterval;
  private gameOver: boolean = false;
  private scoreLabel!: ex.Label;
  private livesLabel!: ex.Label;
  private waveLabel!: ex.Label;
  private gameOverLabel!: ex.Label;

  onInitialize(engine: ex.Engine): void {
    this.setupHUD();
    this.spawnPlayer(engine);
    this.spawnWave();
  }

  private setupHUD(): void {
    const font = new ex.Font({
      family: 'monospace',
      size: 16,
      unit: ex.FontUnit.Px,
      color: ex.Color.White,
    });

    this.scoreLabel = new ex.Label({
      text: 'SCORE: 0',
      pos: ex.vec(10, 20),
      font: font,
    });

    this.livesLabel = new ex.Label({
      text: `LIVES: ${this.lives}`,
      pos: ex.vec(CONFIG.canvas.width - 100, 20),
      font: font,
    });

    this.waveLabel = new ex.Label({
      text: 'WAVE 1',
      pos: ex.vec(CONFIG.canvas.width / 2 - 30, CONFIG.canvas.height - 15),
      font: font,
    });

    this.gameOverLabel = new ex.Label({
      text: '',
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2),
      font: new ex.Font({
        family: 'monospace',
        size: 24,
        unit: ex.FontUnit.Px,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Center,
      }),
    });

    this.add(this.scoreLabel);
    this.add(this.livesLabel);
    this.add(this.waveLabel);
    this.add(this.gameOverLabel);
  }

  private spawnPlayer(engine: ex.Engine): void {
    this.player = new Player();
    this.add(this.player);
  }

  private spawnWave(): void {
    const startY = CONFIG.alien.startY + (this.wave - 1) * CONFIG.alien.waveYOffset;
    this.alienGrid = new AlienGrid(this, startY);

    // Wire up collision: player bullet hits alien
    this.alienGrid.aliens.forEach(alien => {
      alien.on('collisionstart', (evt: ex.CollisionStartEvent) => {
        const other = evt.other;
        if (other instanceof Bullet && other.owner === 'player') {
          other.kill();
          alien.kill();
          this.score += alien.points;
          this.scoreLabel.text = `SCORE: ${this.score}`;
          this.checkWaveClear();
        }
      });
    });
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    if (this.gameOver) {
      if (engine.input.keyboard.wasPressed(ex.Keys.Enter)) {
        this.restart(engine);
      }
      return;
    }

    this.alienGrid.update(delta, this.fireInterval);

    // Check invasion
    if (this.alienGrid.hasReachedPlayer()) {
      this.triggerGameOver();
    }
  }

  onActivate(): void {
    // Wire player death collision
    this.player.on('collisionstart', (evt: ex.CollisionStartEvent) => {
      if (evt.other instanceof Bullet && evt.other.owner === 'alien') {
        evt.other.kill();
        this.playerHit();
      }
    });
  }

  private playerHit(): void {
    this.lives--;
    this.livesLabel.text = `LIVES: ${this.lives}`;

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      // Brief invincibility flash
      this.player.actions.blink(100, 100, Math.floor(CONFIG.player.invincibilityTime / 200));
    }
  }

  private checkWaveClear(): void {
    if (this.alienGrid.allDead) {
      this.wave++;
      this.waveLabel.text = `WAVE ${this.wave}`;
      this.fireInterval = Math.max(
        CONFIG.alien.minFireInterval,
        this.fireInterval - CONFIG.alien.fireIntervalDecrease
      );

      // Pause then spawn next wave
      const timer = new ex.Timer({
        fcn: () => {
          this.spawnWave();
        },
        interval: CONFIG.wave.clearPause,
        repeats: false,
      });
      this.add(timer);
      timer.start();
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.player.kill();
    this.alienGrid.destroy();
    this.gameOverLabel.text = `GAME OVER\nSCORE: ${this.score}\n\nPress ENTER to restart`;
  }

  private restart(engine: ex.Engine): void {
    this.score = 0;
    this.lives = CONFIG.player.startingLives;
    this.wave = 1;
    this.fireInterval = CONFIG.alien.fireInterval;
    this.gameOver = false;
    this.scoreLabel.text = 'SCORE: 0';
    this.livesLabel.text = `LIVES: ${this.lives}`;
    this.waveLabel.text = 'WAVE 1';
    this.gameOverLabel.text = '';

    this.spawnPlayer(engine);
    this.spawnWave();
  }
}
```

**Step 2: Update main.ts to use GameScene**

Replace all game logic in `main.ts` with:

```typescript
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
```

**Step 3: Verify full gameplay loop**

Run: `npx vite`
Expected:
- Player moves, shoots
- Bullets destroy aliens, score increases
- Aliens shoot back, player loses lives
- Game over when lives = 0 or aliens reach bottom
- Wave clears when all aliens destroyed, new wave spawns
- Press ENTER to restart after game over

**Step 4: Commit**

```bash
git add src/scenes/game.ts src/main.ts
git commit -m "feat: add game scene with collision, scoring, lives, waves, game over"
```

---

### Task 8: Production Server

**Files:**
- Create: `server.ts`
- Create: `tsconfig.server.json`
- Modify: `package.json`

**Step 1: Create server.ts**

```typescript
import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Space Invaders running on port ${port}`);
});
```

**Step 2: Create tsconfig.server.json**

Separate tsconfig for the server (Node.js target):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["server.ts"],
  "exclude": ["node_modules", "src"]
}
```

**Step 3: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && npx tsc --project tsconfig.server.json",
    "preview": "vite preview",
    "start": "node dist/server.js"
  }
}
```

**Step 4: Verify production build**

Run:
```bash
npm run build
npm start
```
Expected: App builds to `dist/public/` (client) and `dist/server.js` (server). Visiting `http://localhost:3000` serves the game.

**Step 5: Commit**

```bash
git add server.ts tsconfig.server.json package.json
git commit -m "feat: add Express production server for Railway deployment"
```

---

### Task 9: Pixel Art Sprites

**Files:**
- Create: `public/sprites/spritesheet.png` (pixel art)
- Create: `src/resources.ts`
- Modify: `src/actors/player.ts`
- Modify: `src/actors/alien.ts`
- Modify: `src/actors/bullet.ts`

**Step 1: Create sprite sheet**

Create a pixel art sprite sheet PNG with the following sprites on a transparent background (each sprite fits in a 16x16 or 24x16 cell):
- Player ship (1 frame)
- Squid alien (2 frames)
- Crab alien (2 frames)
- Octopus alien (2 frames)
- Player bullet (1 frame)
- Alien bullet (1 frame)
- Explosion (1 frame)

Use a grid layout: 8 columns x 1 row, each cell 24x16.

**Step 2: Create src/resources.ts**

```typescript
import * as ex from 'excalibur';

const spriteSheet = new ex.ImageSource('/sprites/spritesheet.png');

export const Resources = {
  spriteSheet,
};

export const loader = new ex.Loader([spriteSheet]);
```

**Step 3: Update main.ts to load resources**

```typescript
import { Resources, loader } from './resources';

// Change game.start() to:
game.start(loader).then(() => {
  game.goToScene('game');
});
```

**Step 4: Update actors to use sprites instead of colored rectangles**

Update `player.ts`, `alien.ts`, and `bullet.ts` to use `SpriteSheet.fromImageSource()` and `this.graphics.use()` in their `onInitialize()` methods. Replace the `color` and `width`/`height` constructor params with sprite graphics.

**Step 5: Verify sprites render**

Run: `npx vite`
Expected: All entities render with pixel art sprites instead of colored rectangles.

**Step 6: Commit**

```bash
git add public/sprites/ src/resources.ts src/actors/ src/main.ts
git commit -m "feat: add pixel art sprites for all game entities"
```

---

### Task 10: Polish & Final Touches

**Files:**
- Modify: `src/scenes/game.ts`
- Modify: `src/actors/alien.ts`
- Create: `.gitignore`
- Modify: `CLAUDE.md`

**Step 1: Add .gitignore**

```
node_modules/
dist/
```

**Step 2: Add alien 2-frame animation toggle**

In `alien.ts`, toggle between frame 0 and frame 1 each time the grid steps. The `AlienGrid` can call a method on each alien to toggle its frame.

**Step 3: Add explosion visual on alien/player death**

When an alien is killed, briefly show the explosion sprite at its position before removing it. Use `ex.Timer` for a 200ms delay.

**Step 4: Update CLAUDE.md**

Update `CLAUDE.md` with actual build commands and architecture now that the project exists.

**Step 5: Verify everything works end-to-end**

Run: `npx vite`
Test full gameplay: movement, shooting, scoring, wave progression, game over, restart.

Run: `npm run build && npm start`
Test production build at `http://localhost:3000`.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add alien animation, explosion effects, polish, and docs"
```

---

### Task 11: Railway Deployment

**Files:**
- Possibly create: `Procfile` (optional, Railway auto-detects)

**Step 1: Verify Railway CLI or dashboard access**

Run: `railway --version` or check https://railway.app dashboard.

**Step 2: Deploy**

```bash
railway init
railway up
```

Or connect the GitHub repo via Railway dashboard for automatic deploys.

**Step 3: Verify deployment**

Visit the Railway-provided URL. Game should load and be fully playable.

**Step 4: Commit any Railway config if needed**

```bash
git add -A
git commit -m "chore: add Railway deployment config"
```
