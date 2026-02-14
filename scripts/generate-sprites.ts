/**
 * generate-sprites.ts
 *
 * Generates a pixel-art sprite sheet for the Space Invaders game.
 *
 * Layout: 8 columns x 2 rows, each cell 24x16 pixels (total 192x32).
 *
 * Row 0: player, squid-frame1, squid-frame2, crab-frame1, crab-frame2,
 *         octopus-frame1, octopus-frame2, explosion
 * Row 1: player-bullet, alien-bullet, (6 empty cells)
 *
 * Run with:  npx tsx scripts/generate-sprites.ts
 */

import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CELL_W = 24;
const CELL_H = 16;
const COLS = 8;
const ROWS = 2;
const SHEET_W = CELL_W * COLS; // 192
const SHEET_H = CELL_H * ROWS; // 32
const PX = 2; // each "pixel" in the pattern is drawn as a 2x2 block

// ---------------------------------------------------------------------------
// Sprite bitmap patterns
// Each pattern is an array of strings where '#' means filled, ' ' means empty.
// ---------------------------------------------------------------------------

const PLAYER: string[] = [
  "    ##    ",
  "   ####   ",
  "  ######  ",
  " ######## ",
  "##########",
  "##########",
];

const SQUID_F1: string[] = [
  "   ##   ",
  "  ####  ",
  " ###### ",
  "## ## ##",
  "########",
  " # ## # ",
  "#      #",
  " #    # ",
];

const SQUID_F2: string[] = [
  "   ##   ",
  "  ####  ",
  " ###### ",
  "## ## ##",
  "########",
  "  #  #  ",
  " # ## # ",
  "#  ##  #",
];

const CRAB_F1: string[] = [
  "  #   #  ",
  "   # #   ",
  "  #####  ",
  " ## # ## ",
  "#########",
  "# ##### #",
  "# #   # #",
  "   ## ##  ",
];

const CRAB_F2: string[] = [
  "  #   #  ",
  "#  # #  #",
  "# ##### #",
  "### # ###",
  "#########",
  " ####### ",
  "  #   #  ",
  " #     # ",
];

const OCTOPUS_F1: string[] = [
  "  ####  ",
  " ###### ",
  "########",
  "##  ####",
  "########",
  "  #  #  ",
  " # ## # ",
  "# #  # #",
];

const OCTOPUS_F2: string[] = [
  "  ####  ",
  " ###### ",
  "########",
  "##  ####",
  "########",
  "  #  #  ",
  " #    # ",
  "  #  #  ",
];

const EXPLOSION: string[] = [
  "#  # # #",
  " # ### # ",
  "  #####  ",
  " ####### ",
  "  #####  ",
  " # # # # ",
  "#  # #  #",
];

const PLAYER_BULLET: string[] = [
  " # ",
  " # ",
  " # ",
  "###",
  "###",
  "###",
  "###",
  " # ",
  " # ",
  " # ",
];

const ALIEN_BULLET: string[] = [
  " # ",
  "## ",
  " # ",
  " ##",
  " # ",
  "## ",
  " # ",
  " ##",
  " # ",
  "## ",
];

// ---------------------------------------------------------------------------
// Color assignments
// ---------------------------------------------------------------------------

const COLORS: Record<string, string> = {
  player: "#00ffcc",
  squid: "#00ffff",
  crab: "#00ff00",
  octopus: "#ff00ff",
  explosion: "#ff6600",
  playerBullet: "#ffffff",
  alienBullet: "#ffff00",
};

// ---------------------------------------------------------------------------
// Sprite definitions: which pattern, which color, and grid position (col, row)
// ---------------------------------------------------------------------------

interface SpriteEntry {
  pattern: string[];
  color: string;
  col: number;
  row: number;
}

const SPRITES: SpriteEntry[] = [
  { pattern: PLAYER, color: COLORS.player, col: 0, row: 0 },
  { pattern: SQUID_F1, color: COLORS.squid, col: 1, row: 0 },
  { pattern: SQUID_F2, color: COLORS.squid, col: 2, row: 0 },
  { pattern: CRAB_F1, color: COLORS.crab, col: 3, row: 0 },
  { pattern: CRAB_F2, color: COLORS.crab, col: 4, row: 0 },
  { pattern: OCTOPUS_F1, color: COLORS.octopus, col: 5, row: 0 },
  { pattern: OCTOPUS_F2, color: COLORS.octopus, col: 6, row: 0 },
  { pattern: EXPLOSION, color: COLORS.explosion, col: 7, row: 0 },
  { pattern: PLAYER_BULLET, color: COLORS.playerBullet, col: 0, row: 1 },
  { pattern: ALIEN_BULLET, color: COLORS.alienBullet, col: 1, row: 1 },
];

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteEntry,
): void {
  const { pattern, color, col, row } = sprite;

  // Cell top-left in sheet coordinates
  const cellX = col * CELL_W;
  const cellY = row * CELL_H;

  // Determine the pattern dimensions (in "logical pixels")
  const patternH = pattern.length;
  const patternW = Math.max(...pattern.map((r) => r.length));

  // Center the pattern within the cell (each logical pixel = PX real pixels)
  const offsetX = cellX + Math.floor((CELL_W - patternW * PX) / 2);
  const offsetY = cellY + Math.floor((CELL_H - patternH * PX) / 2);

  ctx.fillStyle = color;

  for (let py = 0; py < patternH; py++) {
    const rowStr = pattern[py];
    for (let px = 0; px < rowStr.length; px++) {
      if (rowStr[px] === "#") {
        ctx.fillRect(offsetX + px * PX, offsetY + py * PX, PX, PX);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const canvas = createCanvas(SHEET_W, SHEET_H);
  const ctx = canvas.getContext("2d");

  // Transparent background (default for a new canvas)
  ctx.clearRect(0, 0, SHEET_W, SHEET_H);

  // Draw every sprite
  for (const sprite of SPRITES) {
    drawSprite(ctx, sprite);
  }

  // Write to disk
  const outDir = path.resolve(__dirname, "..", "public", "sprites");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "spritesheet.png");
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buffer);

  console.log(`Sprite sheet written to ${outPath}`);
  console.log(`  Dimensions : ${SHEET_W} x ${SHEET_H}`);
  console.log(`  File size  : ${buffer.length} bytes`);
  console.log(`  Cells      : ${COLS} cols x ${ROWS} rows (${CELL_W}x${CELL_H} each)`);
}

main();
