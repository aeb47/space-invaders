import * as ex from 'excalibur';
import { Player } from '../actors/player';
import { AlienGrid } from '../actors/alien-grid';
import { Alien } from '../actors/alien';
import { Bullet } from '../actors/bullet';
import { ShieldBlock, createShields } from '../actors/shield';
import { Ufo, getUfoSpawnInterval, getUfoSpeed, getUfoDirection } from '../actors/ufo';
import { PowerUpActor } from '../actors/power-up-actor';
import { selectPowerUpType, shouldDropPowerUp, PowerUpState } from '../actors/power-up';
import { WeaponSystem } from '../systems/weapon-upgrade';
import { DifficultyTierSystem } from '../systems/difficulty';
import { BossFactory, BossState, BossType } from '../actors/boss';
import { StatsService } from '../services/stats';
import { AchievementService, GameState } from '../services/achievement';
import { AccessibilityService } from '../services/accessibility';
import { CONFIG } from '../config';
import { getSpriteSheet, SpriteIndex } from '../resources';
import { audio } from '../audio';
import { HighScoreService } from '../services/high-score';

export class GameScene extends ex.Scene {
  private player!: Player;
  private alienGrid!: AlienGrid;
  private score: number = 0;
  private lives: number = CONFIG.player.startingLives;
  private wave: number = 1;
  private fireInterval: number = CONFIG.alien.fireInterval;
  private gameOver: boolean = false;
  private invincible: boolean = false;
  private paused: boolean = false;
  private shieldBlocks: ShieldBlock[] = [];
  private enteringName: boolean = false;
  private nameChars: string[] = ['A', 'A', 'A'];
  private nameIndex: number = 0;

  // UFO state (F1)
  private ufoTimer: number = 0;
  private ufoShotCount: number = 0;
  private ufoSpawnCount: number = 0;
  private ufoNextInterval: number = 0;
  private currentUfo: Ufo | null = null;

  // Power-up state (F3)
  private powerUpState = new PowerUpState();
  private activePowerUps: PowerUpActor[] = [];

  // Weapon upgrade state (F12)
  private weaponSystem = new WeaponSystem();

  // Difficulty tier system (F4)
  private difficultyTier = new DifficultyTierSystem();

  // Boss state (F5)
  private bossState: BossState | null = null;
  private bossActor: ex.Actor | null = null;

  // Stats & achievements
  private statsService = StatsService.getInstance();
  private achievementService = AchievementService.getInstance();
  private accessibilityService = AccessibilityService.getInstance();
  private highScoreService = HighScoreService.getInstance();

  // Wave tracking for achievements
  private waveShotsFired: number = 0;
  private waveShotsHit: number = 0;
  private waveDamageTaken: boolean = false;
  private consecutiveNoDamageWaves: number = 0;
  private waveStartTime: number = 0;
  private playStartTime: number = 0;

  // HUD labels
  private nameLabel!: ex.Label;
  private scoreLabel!: ex.Label;
  private livesLabel!: ex.Label;
  private waveLabel!: ex.Label;
  private gameOverLabel!: ex.Label;
  private hiScoreLabel!: ex.Label;
  private pauseLabel!: ex.Label;
  private pauseHintLabel!: ex.Label;
  private tierLabel!: ex.Label;
  private weaponLabel!: ex.Label;
  private powerUpLabel!: ex.Label;
  private bossHpLabel!: ex.Label;

  onInitialize(engine: ex.Engine): void {
    this.setupHUD();
    this.spawnPlayer(engine);
    this.spawnWave();
    this.playStartTime = Date.now();

    // Resume audio on first user interaction (browser autoplay policy)
    const resumeAudio = () => {
      audio.resume();
      engine.input.pointers.off('down', resumeAudio);
    };
    engine.input.pointers.on('down', resumeAudio);
    engine.input.keyboard.on('press', () => audio.resume());
  }

  private setupHUD(): void {
    const font = new ex.Font({
      family: 'monospace',
      size: 16,
      unit: ex.FontUnit.Px,
      color: ex.Color.White,
    });

    const smallFont = new ex.Font({
      family: 'monospace',
      size: 10,
      unit: ex.FontUnit.Px,
      color: ex.Color.fromRGB(150, 150, 150),
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

    this.hiScoreLabel = new ex.Label({
      text: `HI-SCORE: ${this.highScoreService.getHighScore()}`,
      pos: ex.vec(CONFIG.canvas.width / 2 - 40, 20),
      font: font,
    });

    this.gameOverLabel = new ex.Label({
      text: '',
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 60),
      font: new ex.Font({
        family: 'monospace',
        size: 24,
        unit: ex.FontUnit.Px,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Center,
      }),
    });

    this.pauseLabel = new ex.Label({
      text: '',
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 40),
      font: new ex.Font({
        family: 'monospace',
        size: 20,
        unit: ex.FontUnit.Px,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Center,
      }),
    });

    this.pauseHintLabel = new ex.Label({
      text: '[P] PAUSE',
      pos: ex.vec(10, CONFIG.canvas.height - 15),
      font: smallFont,
    });

    this.nameLabel = new ex.Label({
      text: '',
      pos: ex.vec(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 30),
      font: new ex.Font({
        family: 'monospace',
        size: 20,
        unit: ex.FontUnit.Px,
        color: ex.Color.fromHex('#00ff00'),
        textAlign: ex.TextAlign.Center,
      }),
    });

    // Difficulty tier label (F4)
    this.tierLabel = new ex.Label({
      text: this.difficultyTier.getTierLabel(this.wave),
      pos: ex.vec(CONFIG.canvas.width - 100, CONFIG.canvas.height - 15),
      font: new ex.Font({
        family: 'monospace',
        size: 10,
        unit: ex.FontUnit.Px,
        color: ex.Color.fromHex('#ffff00'),
      }),
    });

    // Weapon level label (F12)
    this.weaponLabel = new ex.Label({
      text: '',
      pos: ex.vec(10, 38),
      font: smallFont,
    });

    // Power-up indicator (F3)
    this.powerUpLabel = new ex.Label({
      text: '',
      pos: ex.vec(CONFIG.canvas.width / 2 - 40, 38),
      font: new ex.Font({
        family: 'monospace',
        size: 10,
        unit: ex.FontUnit.Px,
        color: ex.Color.fromHex('#00ffff'),
      }),
    });

    // Boss HP label (F5)
    this.bossHpLabel = new ex.Label({
      text: '',
      pos: ex.vec(CONFIG.canvas.width / 2, 60),
      font: new ex.Font({
        family: 'monospace',
        size: 12,
        unit: ex.FontUnit.Px,
        color: ex.Color.Red,
        textAlign: ex.TextAlign.Center,
      }),
    });

    this.add(this.scoreLabel);
    this.add(this.hiScoreLabel);
    this.add(this.livesLabel);
    this.add(this.waveLabel);
    this.add(this.gameOverLabel);
    this.add(this.pauseLabel);
    this.add(this.pauseHintLabel);
    this.add(this.nameLabel);
    this.add(this.tierLabel);
    this.add(this.weaponLabel);
    this.add(this.powerUpLabel);
    this.add(this.bossHpLabel);
  }

  private spawnPlayer(engine: ex.Engine): void {
    this.player = new Player();
    this.add(this.player);
    this.wirePlayerCollision();
  }

  private spawnWave(): void {
    this.waveStartTime = Date.now();
    this.waveShotsFired = 0;
    this.waveShotsHit = 0;
    this.waveDamageTaken = false;

    // Check for tier transition (F4)
    if (this.wave > 1) {
      const newTier = this.difficultyTier.getNewTierIfChanged(this.wave, this.wave - 1);
      if (newTier) {
        audio.tierTransition();
        this.tierLabel.text = this.difficultyTier.getTierLabel(this.wave);
      }
    }

    // Check for boss wave (F5)
    if (BossFactory.isBossWave(this.wave)) {
      this.spawnBoss();
      return;
    }

    const startY = CONFIG.alien.startY + (this.wave - 1) * CONFIG.alien.waveYOffset;
    this.alienGrid = new AlienGrid(this, startY);

    // Wire up collision: player bullet hits alien
    this.alienGrid.aliens.forEach(alien => {
      alien.on('collisionstart', (evt: ex.CollisionStartEvent) => {
        const other = evt.other.owner;
        if (other instanceof Bullet && other.owner === 'player') {
          other.kill();
          this.onAlienKilled(alien);
        }
      });
    });

    this.spawnShields();
  }

  private onAlienKilled(alien: Alien): void {
    this.spawnExplosion(alien.pos.clone());
    alien.kill();
    audio.alienExplode();

    // Score with power-up multiplier (F3)
    const basePoints = alien.points;
    const multiplier = this.powerUpState.getScoreMultiplier();
    const points = basePoints * multiplier;
    this.addScore(points);

    this.waveShotsHit++;
    this.statsService.recordAlienKill();
    this.statsService.recordShot(true);

    // Small screen shake + hit pause on alien kill
    const shakeIntensity = this.accessibilityService.getShakeIntensity();
    if (shakeIntensity > 0) {
      this.camera.shake(2 * shakeIntensity, 2 * shakeIntensity, 100);
    }
    this.hitPause(30);

    // Power-up drop chance (F3)
    if (shouldDropPowerUp(this.wave)) {
      const type = selectPowerUpType();
      const powerUp = new PowerUpActor(alien.pos.x, alien.pos.y, type);
      this.add(powerUp);
      this.activePowerUps.push(powerUp);
    }

    this.checkWaveClear();
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreLabel.text = `SCORE: ${this.score}`;

    // Feed weapon upgrade system (F12)
    this.weaponSystem.addScore(points);
    const weaponConfig = this.weaponSystem.getWeaponConfig();
    this.weaponLabel.text = weaponConfig.name !== 'Standard' ? weaponConfig.name : '';
  }

  private spawnBoss(): void {
    const bossType = BossFactory.getBossType(this.wave);
    const bossConfig = BossFactory.getBossConfig(bossType);
    audio.bossWarning();

    this.bossState = new BossState(bossType, bossConfig.hp);
    this.bossState.onPhaseChange = (phase) => {
      this.camera.shake(4, 4, 200);
    };

    // Create boss actor as a rectangle placeholder
    const bossWidth = bossConfig.width;
    const bossHeight = bossConfig.height;
    this.bossActor = new ex.Actor({
      pos: ex.vec(CONFIG.canvas.width / 2, 80),
      width: bossWidth,
      height: bossHeight,
      collisionType: ex.CollisionType.Passive,
    });
    this.bossActor.graphics.use(new ex.Rectangle({
      width: bossWidth,
      height: bossHeight,
      color: ex.Color.fromHex('#ff00ff'),
    }));

    // Boss movement: horizontal patrol
    this.bossActor.actions.repeatForever((ctx) => {
      ctx.moveBy(100, 0, 60);
      ctx.moveBy(-200, 0, 60);
      ctx.moveBy(100, 0, 60);
    });

    this.add(this.bossActor);

    // Wire collision: player bullet hits boss
    this.bossActor.on('collisionstart', (evt: ex.CollisionStartEvent) => {
      const other = evt.other.owner;
      if (other instanceof Bullet && other.owner === 'player' && this.bossState) {
        other.kill();
        this.bossState.takeDamage(1);
        this.spawnExplosion(this.bossActor!.pos.clone());
        audio.alienExplode();

        // Update boss HP display
        this.bossHpLabel.text = `BOSS HP: ${Math.ceil(this.bossState.getHpPercent() * 100)}%`;

        if (this.bossState.isDefeated()) {
          this.onBossDefeated();
        }
      }
    });

    this.bossHpLabel.text = `BOSS HP: 100%`;
    this.spawnShields();
  }

  private onBossDefeated(): void {
    if (!this.bossActor || !this.bossState) return;

    audio.bossDefeat();
    this.camera.shake(6, 6, 500);

    // Score
    const points = BossFactory.getBossPoints(this.wave);
    this.addScore(points);

    // Stats
    this.statsService.recordBossKill();

    // Clean up boss
    this.spawnExplosion(this.bossActor.pos.clone());
    this.bossActor.kill();
    this.bossActor = null;
    this.bossState = null;
    this.bossHpLabel.text = '';

    // Proceed to next wave
    this.advanceWave();
  }

  private spawnShields(): void {
    // Destroy old shield blocks
    for (const block of this.shieldBlocks) {
      block.kill();
    }
    this.shieldBlocks = [];

    // Only spawn shields from the configured start wave onward
    if (this.wave < CONFIG.shield.startWave) return;

    // Create new shields at randomized positions
    this.shieldBlocks = createShields(this);

    // Wire collision: when a bullet hits a shield block, use hit() for degradation (F2)
    for (const block of this.shieldBlocks) {
      block.on('collisionstart', (evt: ex.CollisionStartEvent) => {
        const other = evt.other.owner;
        if (other instanceof Bullet) {
          other.kill();
          const survived = block.hit();
          if (!survived) {
            audio.shieldCrumble();
          }
        }
      });
    }
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    // Pause toggle (works anytime except game over)
    if (!this.gameOver && !this.enteringName && (engine.input.keyboard.wasPressed(ex.Keys.P) || engine.input.keyboard.wasPressed(ex.Keys.Escape))) {
      this.togglePause(engine);
    }
    if (this.paused) return;

    // Name entry mode for high scores
    if (this.enteringName) {
      this.handleNameEntry(engine);
      return;
    }

    if (this.gameOver) {
      if (engine.input.keyboard.wasPressed(ex.Keys.Enter)) {
        this.restart(engine);
      }
      if (engine.input.pointers.isDragStart(0)) {
        this.restart(engine);
      }
      return;
    }

    // Update power-up state (F3)
    this.powerUpState.update(delta);
    this.updatePowerUpLabel();
    this.checkPowerUpCollection();

    // Update UFO timer (F1)
    this.updateUfo(delta);

    // Update alien grid (only when no boss)
    if (!this.bossState) {
      this.alienGrid.update(delta, this.fireInterval);

      // Check invasion
      if (this.alienGrid.hasReachedPlayer()) {
        this.triggerGameOver();
      }
    }
  }

  // ---- UFO System (F1) ----

  private updateUfo(delta: number): void {
    this.ufoTimer += delta;

    // Calculate next interval if needed
    if (this.ufoNextInterval === 0) {
      const range = getUfoSpawnInterval(this.wave);
      this.ufoNextInterval = range.min + Math.random() * (range.max - range.min);
    }

    if (this.ufoTimer >= this.ufoNextInterval && !this.currentUfo) {
      this.ufoTimer = 0;
      this.ufoNextInterval = 0;
      const direction = getUfoDirection(this.ufoSpawnCount);
      this.ufoSpawnCount++;
      const speed = getUfoSpeed(this.wave);
      this.currentUfo = new Ufo({ direction, speed, shotCount: this.ufoShotCount });

      this.add(this.currentUfo);
      audio.ufoWarble();

      // Wire collision
      this.currentUfo.on('collisionstart', (evt: ex.CollisionStartEvent) => {
        const other = evt.other.owner;
        if (other instanceof Bullet && other.owner === 'player' && this.currentUfo) {
          other.kill();
          this.onUfoHit(this.currentUfo);
        }
      });
    }

    // Clean up if UFO left the screen
    if (this.currentUfo && this.currentUfo.isKilled()) {
      this.currentUfo = null;
    }
  }

  private onUfoHit(ufo: Ufo): void {
    const points = ufo.pointsValue;
    ufo.spawnScorePopup(this);
    this.spawnExplosion(ufo.pos.clone());
    ufo.kill();
    audio.alienExplode();
    this.addScore(points);
    this.ufoShotCount++;
    this.currentUfo = null;

    this.statsService.recordUfoKill();
    this.statsService.recordShot(true);
  }

  // ---- Power-Up System (F3) ----

  private checkPowerUpCollection(): void {
    if (!this.player || this.player.isKilled()) return;

    this.activePowerUps = this.activePowerUps.filter(p => !p.isKilled());

    for (const powerUp of this.activePowerUps) {
      if (powerUp.isKilled()) continue;
      const dist = this.player.pos.distance(powerUp.pos);
      if (dist < 20) {
        this.collectPowerUp(powerUp);
      }
    }
  }

  private collectPowerUp(powerUp: PowerUpActor): void {
    const type = powerUp.type;
    const duration = CONFIG.powerUp.types[type].duration;
    this.powerUpState.activate(type, duration);
    powerUp.kill();
    audio.powerUpPickup();
    this.statsService.recordPowerUpCollect();
  }

  private updatePowerUpLabel(): void {
    const active = this.powerUpState.getActive();
    if (!active) {
      this.powerUpLabel.text = '';
      return;
    }
    const remaining = Math.ceil(this.powerUpState.getRemainingTime() / 1000);
    const expiring = this.powerUpState.isExpiring() ? '!' : '';
    if (active === 'shield') {
      this.powerUpLabel.text = `SHIELD${expiring}`;
    } else {
      this.powerUpLabel.text = `${active.toUpperCase()} ${remaining}s${expiring}`;
    }
  }

  // ---- Name Entry ----

  private handleNameEntry(engine: ex.Engine): void {
    const kb = engine.input.keyboard;

    if (kb.wasPressed(ex.Keys.Left) || kb.wasPressed(ex.Keys.A)) {
      this.nameIndex = Math.max(0, this.nameIndex - 1);
    }
    if (kb.wasPressed(ex.Keys.Right) || kb.wasPressed(ex.Keys.D)) {
      this.nameIndex = Math.min(2, this.nameIndex + 1);
    }
    if (kb.wasPressed(ex.Keys.Up) || kb.wasPressed(ex.Keys.W)) {
      this.nameChars[this.nameIndex] = this.nextChar(this.nameChars[this.nameIndex], 1);
    }
    if (kb.wasPressed(ex.Keys.Down) || kb.wasPressed(ex.Keys.S)) {
      this.nameChars[this.nameIndex] = this.nextChar(this.nameChars[this.nameIndex], -1);
    }

    if (kb.wasPressed(ex.Keys.Enter)) {
      const initials = this.nameChars.join('');
      this.highScoreService.addScore(this.score, initials);
      this.hiScoreLabel.text = `HI-SCORE: ${this.highScoreService.getHighScore()}`;
      this.enteringName = false;
      this.nameLabel.text = '';
      this.gameOverLabel.text = `GAME OVER\nSCORE: ${this.score}\nSAVED: ${initials}\n\nPress ENTER or TAP to restart`;
      return;
    }

    const display = this.nameChars.map((c, i) =>
      i === this.nameIndex ? `[${c}]` : ` ${c} `
    ).join('');
    this.nameLabel.text = `ENTER NAME\n${display}\n\u2190\u2192 move  \u2191\u2193 letter  ENTER save`;
  }

  private nextChar(current: string, dir: number): string {
    const code = current.charCodeAt(0) + dir;
    if (code > 90) return 'A';
    if (code < 65) return 'Z';
    return String.fromCharCode(code);
  }

  private wirePlayerCollision(): void {
    this.player.on('collisionstart', (evt: ex.CollisionStartEvent) => {
      const otherActor = evt.other.owner;
      if (otherActor instanceof Bullet && otherActor.owner === 'alien') {
        otherActor.kill();
        if (!this.invincible) {
          // Check power-up shield (F3)
          if (this.powerUpState.isShieldActive()) {
            this.powerUpState.consumeShield();
            return;
          }
          this.playerHit();
        }
      }
    });
  }

  private playerHit(): void {
    this.lives--;
    this.livesLabel.text = `LIVES: ${this.lives}`;
    this.waveDamageTaken = true;
    this.consecutiveNoDamageWaves = 0;

    // Weapon level down on death (F12)
    this.weaponSystem.levelDown();

    if (this.lives <= 0) {
      audio.playerDeath();
      this.triggerGameOver();
    } else {
      audio.playerHit();
      const shakeIntensity = this.accessibilityService.getShakeIntensity();
      if (shakeIntensity > 0) {
        this.camera.shake(4 * shakeIntensity, 4 * shakeIntensity, 200);
      }
      this.hitPause(60);
      this.invincible = true;
      this.player.actions.blink(100, 100, Math.floor(CONFIG.player.invincibilityTime / 200));
      const timer = new ex.Timer({
        fcn: () => { this.invincible = false; },
        interval: CONFIG.player.invincibilityTime,
        repeats: false,
      });
      this.add(timer);
      timer.start();
    }
  }

  private togglePause(engine: ex.Engine): void {
    if (!this.paused) {
      this.paused = true;
      engine.timescale = 0;
      this.pauseLabel.text = 'PAUSED\n\nP or ESC to resume';
      audio.pauseGame();
    } else {
      this.paused = false;
      engine.timescale = 1;
      this.pauseLabel.text = '';
      audio.unpauseGame();
    }
  }

  private hitPause(durationMs: number): void {
    if (this.paused) return;
    this.engine.timescale = 0.05;
    setTimeout(() => {
      if (!this.paused) {
        this.engine.timescale = 1.0;
      }
    }, durationMs);
  }

  private checkWaveClear(): void {
    if (this.alienGrid.allDead) {
      audio.waveClear();

      // Track wave stats for achievements
      const waveClearTime = Date.now() - this.waveStartTime;
      const waveAccuracy = this.waveShotsFired > 0
        ? (this.waveShotsHit / this.waveShotsFired) * 100
        : 0;

      if (!this.waveDamageTaken) {
        this.consecutiveNoDamageWaves++;
      }

      // Check achievements (F11)
      const gameState: GameState = {
        totalAliensDestroyed: this.statsService.getStats().totalAliensDestroyed,
        totalGamesPlayed: this.statsService.getStats().totalGamesPlayed,
        highestWave: Math.max(this.statsService.getStats().highestWave, this.wave),
        currentWave: this.wave,
        waveClearedNoDamage: !this.waveDamageTaken,
        waveAccuracy,
        waveShotsFired: this.waveShotsFired,
        waveClearTimeMs: waveClearTime,
        totalUfosDestroyed: this.statsService.getStats().totalUfosDestroyed,
        bossDefeatedThisWave: false,
        ufoPointsScored: 0,
        currentScore: this.score,
        comboCount: 0,
        consecutiveNoDamageWaves: this.consecutiveNoDamageWaves,
        isNumberOneOnLeaderboard: false,
      };
      const newAchievements = this.achievementService.checkAchievements(gameState);
      if (newAchievements.length > 0) {
        this.showAchievementToast(newAchievements[0]);
      }

      this.advanceWave();
    }
  }

  private advanceWave(): void {
    this.wave++;
    this.waveLabel.text = `WAVE ${this.wave}`;
    this.tierLabel.text = this.difficultyTier.getTierLabel(this.wave);
    this.fireInterval = Math.max(
      CONFIG.alien.minFireInterval,
      this.fireInterval - CONFIG.alien.fireIntervalDecrease
    );

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

  private showAchievementToast(achievementId: string): void {
    const allAchievements = this.achievementService.getAllAchievements();
    const achievement = allAchievements.find(a => a.id === achievementId);
    if (!achievement) return;

    const toast = new ex.Label({
      text: `ACHIEVEMENT: ${achievement.name}`,
      pos: ex.vec(CONFIG.canvas.width / 2, 55),
      font: new ex.Font({
        family: 'monospace',
        size: 12,
        unit: ex.FontUnit.Px,
        color: ex.Color.fromHex('#ffd700'),
        textAlign: ex.TextAlign.Center,
      }),
    });
    this.add(toast);

    const fadeTimer = new ex.Timer({
      fcn: () => toast.kill(),
      interval: CONFIG.achievements.toastDuration,
      repeats: false,
    });
    this.add(fadeTimer);
    fadeTimer.start();
  }

  private spawnExplosion(pos: ex.Vector): void {
    if (!this.accessibilityService.shouldShowParticles()) return;

    const explosion = new ex.Actor({ pos, width: 24, height: 16 });
    const sprite = getSpriteSheet().getSprite(SpriteIndex.explosion % 8, Math.floor(SpriteIndex.explosion / 8));
    if (sprite) {
      this.add(explosion);
      explosion.graphics.use(sprite);
      explosion.actions.scaleTo(ex.vec(2.5, 2.5), ex.vec(8, 8));
      explosion.actions.fade(0, 300);
      const timer = new ex.Timer({
        fcn: () => explosion.kill(),
        interval: 300,
        repeats: false,
      });
      this.add(timer);
      timer.start();
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.spawnExplosion(this.player.pos.clone());
    this.camera.shake(6, 6, 300);
    this.player.kill();
    if (this.alienGrid) this.alienGrid.destroy();

    // Clean up boss if active
    if (this.bossActor && !this.bossActor.isKilled()) {
      this.bossActor.kill();
    }
    this.bossState = null;
    this.bossActor = null;
    this.bossHpLabel.text = '';

    // Clean up UFO
    if (this.currentUfo && !this.currentUfo.isKilled()) {
      this.currentUfo.kill();
    }
    this.currentUfo = null;

    // Clean up power-ups
    this.activePowerUps.forEach(p => { if (!p.isKilled()) p.kill(); });
    this.activePowerUps = [];
    this.powerUpState.reset();
    this.powerUpLabel.text = '';

    // Record stats (F15)
    const playTime = Date.now() - this.playStartTime;
    this.statsService.recordGameEnd({
      score: this.score,
      wave: this.wave,
      playTimeMs: playTime,
    });

    // Check for high score
    if (this.highScoreService.isHighScore(this.score)) {
      this.gameOverLabel.text = `GAME OVER\nSCORE: ${this.score}\n\nNEW HIGH SCORE!`;
      this.enteringName = true;
      this.nameChars = ['A', 'A', 'A'];
      this.nameIndex = 0;
    } else {
      this.gameOverLabel.text = `GAME OVER\nSCORE: ${this.score}\n\nPress ENTER or TAP to restart`;
    }
  }

  private restart(engine: ex.Engine): void {
    this.score = 0;
    this.lives = CONFIG.player.startingLives;
    this.wave = 1;
    this.fireInterval = CONFIG.alien.fireInterval;
    this.gameOver = false;
    this.invincible = false;
    this.paused = false;
    this.enteringName = false;
    this.pauseLabel.text = '';
    this.nameLabel.text = '';
    engine.timescale = 1;
    this.scoreLabel.text = 'SCORE: 0';
    this.livesLabel.text = `LIVES: ${this.lives}`;
    this.waveLabel.text = 'WAVE 1';
    this.gameOverLabel.text = '';
    this.hiScoreLabel.text = `HI-SCORE: ${this.highScoreService.getHighScore()}`;

    // Reset feature systems
    this.ufoTimer = 0;
    this.ufoShotCount = 0;
    this.ufoSpawnCount = 0;
    this.ufoNextInterval = 0;
    this.currentUfo = null;
    this.powerUpState.reset();
    this.activePowerUps = [];
    this.weaponSystem.reset();
    this.bossState = null;
    this.bossActor = null;
    this.bossHpLabel.text = '';
    this.weaponLabel.text = '';
    this.powerUpLabel.text = '';
    this.tierLabel.text = this.difficultyTier.getTierLabel(1);
    this.consecutiveNoDamageWaves = 0;
    this.playStartTime = Date.now();

    this.spawnPlayer(engine);
    this.spawnWave();
  }
}
