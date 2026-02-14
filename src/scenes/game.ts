import * as ex from 'excalibur';
import { Player } from '../actors/player';
import { AlienGrid } from '../actors/alien-grid';
import { Alien } from '../actors/alien';
import { Bullet } from '../actors/bullet';
import { CONFIG } from '../config';
import { getSpriteSheet, SpriteIndex } from '../resources';

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
        const other = evt.other.owner;
        if (other instanceof Bullet && other.owner === 'player') {
          other.kill();
          this.spawnExplosion(alien.pos.clone());
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
      if (engine.input.pointers.isDragStart(0)) {
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
      const otherActor = evt.other.owner;
      if (otherActor instanceof Bullet && otherActor.owner === 'alien') {
        otherActor.kill();
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

  private spawnExplosion(pos: ex.Vector): void {
    const explosion = new ex.Actor({ pos, width: 24, height: 16 });
    const sprite = getSpriteSheet().getSprite(SpriteIndex.explosion % 8, Math.floor(SpriteIndex.explosion / 8));
    if (sprite) {
      this.add(explosion);
      explosion.graphics.use(sprite);
      const timer = new ex.Timer({
        fcn: () => explosion.kill(),
        interval: 200,
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
    this.gameOverLabel.text = `GAME OVER\nSCORE: ${this.score}\n\nPress ENTER or TAP to restart`;
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
