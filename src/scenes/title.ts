import * as ex from 'excalibur';
import { CONFIG } from '../config';
import { getSpriteSheet, SpriteIndex } from '../resources';
import { audio } from '../audio';
import { HighScoreService } from '../services/high-score';

const CX = CONFIG.canvas.width / 2;

export class TitleScene extends ex.Scene {
  private blinkTimer: ex.Timer | null = null;
  private promptLabel!: ex.Label;
  private hiScoreLabel!: ex.Label;
  private promptVisible: boolean = true;
  private marchActors: ex.Actor[] = [];
  private highScoreService = HighScoreService.getInstance();

  onInitialize(engine: ex.Engine): void {
    this.setupTitle();
    this.setupPointsTable();
    this.setupMarchingAliens(engine);
    this.setupModeSelect();
    this.setupPrompt();
    this.setupHiScore();
  }

  onActivate(): void {
    // Reset blink visibility each time we enter the title
    this.promptVisible = true;
    if (this.promptLabel) {
      this.promptLabel.graphics.opacity = 1;
    }
    // Refresh scores from server (async, updates cache in background)
    this.highScoreService.refreshScores();
    // Refresh high score display (may have changed after a game)
    if (this.hiScoreLabel) {
      const scores = this.highScoreService.getScores();
      this.hiScoreLabel.text = scores.length > 0
        ? `HI-SCORE: ${scores[0].initials} ${scores[0].score}`
        : 'HI-SCORE: ---';
    }
  }

  private selectedMode: number = 0;
  private modes = ['STANDARD', 'ENDLESS', 'TIME ATTACK'];
  private modeLabel!: ex.Label;

  onPreUpdate(engine: ex.Engine, _delta: number): void {
    // Mode selection with up/down
    if (engine.input.keyboard.wasPressed(ex.Keys.Up) || engine.input.keyboard.wasPressed(ex.Keys.W)) {
      this.selectedMode = (this.selectedMode - 1 + this.modes.length) % this.modes.length;
      this.updateModeLabel();
    }
    if (engine.input.keyboard.wasPressed(ex.Keys.Down) || engine.input.keyboard.wasPressed(ex.Keys.S)) {
      this.selectedMode = (this.selectedMode + 1) % this.modes.length;
      this.updateModeLabel();
    }

    if (engine.input.keyboard.wasPressed(ex.Keys.Enter)) {
      this.startGame(engine);
      return;
    }
    if (engine.input.pointers.isDragStart(0)) {
      this.startGame(engine);
      return;
    }
  }

  private updateModeLabel(): void {
    if (!this.modeLabel) return;
    const display = this.modes.map((m, i) =>
      i === this.selectedMode ? `> ${m} <` : `  ${m}  `
    ).join('\n');
    this.modeLabel.text = display;
  }

  private startGame(engine: ex.Engine): void {
    audio.resume();
    const mode = this.modes[this.selectedMode].toLowerCase().replace(' ', '-');
    engine.goToScene('game');
  }

  // ---- Title Text ----

  private setupTitle(): void {
    const titleFont = new ex.Font({
      family: 'monospace',
      size: 36,
      unit: ex.FontUnit.Px,
      color: ex.Color.White,
      textAlign: ex.TextAlign.Center,
    });

    const title = new ex.Label({
      text: 'SPACE INVADERS',
      pos: ex.vec(CX, 100),
      font: titleFont,
    });
    this.add(title);
  }

  // ---- Points Table ----

  private setupPointsTable(): void {
    const headerFont = new ex.Font({
      family: 'monospace',
      size: 16,
      unit: ex.FontUnit.Px,
      color: ex.Color.White,
      textAlign: ex.TextAlign.Center,
    });

    const header = new ex.Label({
      text: '-- SCORE ADVANCE TABLE --',
      pos: ex.vec(CX, 200),
      font: headerFont,
    });
    this.add(header);

    const aliens: { type: string; frame1: number; points: number }[] = [
      { type: 'squid', frame1: SpriteIndex.squidFrame1, points: CONFIG.points.squid },
      { type: 'crab', frame1: SpriteIndex.crabFrame1, points: CONFIG.points.crab },
      { type: 'octopus', frame1: SpriteIndex.octopusFrame1, points: CONFIG.points.octopus },
    ];

    const rowFont = new ex.Font({
      family: 'monospace',
      size: 16,
      unit: ex.FontUnit.Px,
      color: ex.Color.White,
      textAlign: ex.TextAlign.Left,
    });

    const startY = 240;
    const rowHeight = 40;

    aliens.forEach((info, i) => {
      const y = startY + i * rowHeight;

      // Alien sprite
      const alienActor = new ex.Actor({
        pos: ex.vec(CX - 60, y),
        width: 24,
        height: 16,
      });
      const sprite = getSpriteSheet().getSprite(info.frame1 % 8, Math.floor(info.frame1 / 8));
      if (sprite) {
        alienActor.graphics.use(sprite);
      }
      this.add(alienActor);

      // Points label
      const label = new ex.Label({
        text: `= ${info.points} PTS`,
        pos: ex.vec(CX - 30, y + 5),
        font: rowFont,
      });
      this.add(label);
    });
  }

  // ---- Marching Decorative Aliens ----

  private setupMarchingAliens(engine: ex.Engine): void {
    const sheet = getSpriteSheet();
    const alienFrames: number[] = [
      SpriteIndex.squidFrame1,
      SpriteIndex.crabFrame1,
      SpriteIndex.octopusFrame1,
      SpriteIndex.crabFrame1,
      SpriteIndex.squidFrame1,
    ];

    const y = 430;
    const spacing = 50;
    const totalWidth = (alienFrames.length - 1) * spacing;
    const startX = CX - totalWidth / 2;

    alienFrames.forEach((frameIdx, i) => {
      const actor = new ex.Actor({
        pos: ex.vec(startX + i * spacing, y),
        width: 24,
        height: 16,
      });
      const sprite = sheet.getSprite(frameIdx % 8, Math.floor(frameIdx / 8));
      if (sprite) {
        actor.graphics.use(sprite);
      }

      // March back and forth
      const marchDistance = 60;
      actor.actions.repeatForever((ctx) => {
        ctx.moveBy(marchDistance, 0, 40);
        ctx.moveBy(-marchDistance, 0, 40);
      });

      this.add(actor);
      this.marchActors.push(actor);
    });

    // Swap frames periodically for animation
    const frameToggle = new ex.Timer({
      fcn: () => {
        const sheet = getSpriteSheet();
        const frame2Map: Record<number, number> = {
          [SpriteIndex.squidFrame1]: SpriteIndex.squidFrame2,
          [SpriteIndex.squidFrame2]: SpriteIndex.squidFrame1,
          [SpriteIndex.crabFrame1]: SpriteIndex.crabFrame2,
          [SpriteIndex.crabFrame2]: SpriteIndex.crabFrame1,
          [SpriteIndex.octopusFrame1]: SpriteIndex.octopusFrame2,
          [SpriteIndex.octopusFrame2]: SpriteIndex.octopusFrame1,
        };

        this.marchActors.forEach((actor, i) => {
          const currentFrame = alienFrames[i];
          const nextFrame = frame2Map[currentFrame];
          if (nextFrame !== undefined) {
            alienFrames[i] = nextFrame;
            const sprite = sheet.getSprite(nextFrame % 8, Math.floor(nextFrame / 8));
            if (sprite) {
              actor.graphics.use(sprite);
            }
          }
        });
      },
      interval: 500,
      repeats: true,
    });
    this.add(frameToggle);
    frameToggle.start();
  }

  // ---- Mode Select ----

  private setupModeSelect(): void {
    this.modeLabel = new ex.Label({
      text: '',
      pos: ex.vec(CX, 390),
      font: new ex.Font({
        family: 'monospace',
        size: 14,
        unit: ex.FontUnit.Px,
        color: ex.Color.fromHex('#00ffff'),
        textAlign: ex.TextAlign.Center,
      }),
    });
    this.add(this.modeLabel);
    this.updateModeLabel();
  }

  // ---- Blinking Prompt ----

  private setupPrompt(): void {
    const promptFont = new ex.Font({
      family: 'monospace',
      size: 18,
      unit: ex.FontUnit.Px,
      color: ex.Color.White,
      textAlign: ex.TextAlign.Center,
    });

    this.promptLabel = new ex.Label({
      text: 'PRESS ENTER OR TAP TO START',
      pos: ex.vec(CX, 520),
      font: promptFont,
    });
    this.add(this.promptLabel);

    this.blinkTimer = new ex.Timer({
      fcn: () => {
        this.promptVisible = !this.promptVisible;
        this.promptLabel.graphics.opacity = this.promptVisible ? 1 : 0;
      },
      interval: 500,
      repeats: true,
    });
    this.add(this.blinkTimer);
    this.blinkTimer.start();
  }

  // ---- Hi Score ----

  private setupHiScore(): void {
    const font = new ex.Font({
      family: 'monospace',
      size: 16,
      unit: ex.FontUnit.Px,
      color: ex.Color.White,
      textAlign: ex.TextAlign.Center,
    });

    const scores = this.highScoreService.getScores();
    const hiText = scores.length > 0
      ? `HI-SCORE: ${scores[0].initials} ${scores[0].score}`
      : 'HI-SCORE: ---';

    this.hiScoreLabel = new ex.Label({
      text: hiText,
      pos: ex.vec(CX, 50),
      font: font,
    });
    this.add(this.hiScoreLabel);
  }
}
