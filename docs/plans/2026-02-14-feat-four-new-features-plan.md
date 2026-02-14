---
title: "feat: Add Title Screen, High Scores, Shields, and Pause"
type: feat
date: 2026-02-14
---

# Four New Features: Title Screen, High Scores, Shields, and Pause

## Overview

Add four features to the Space Invaders game that can be implemented **in parallel** by separate agents. Each feature is scoped to minimize cross-feature dependencies, with a final integration step.

---

## Feature 1: Title Screen & Start Menu

**New file: `src/scenes/title.ts`**

A retro-styled title scene that displays before gameplay begins.

### Requirements

- New `TitleScene` class extending `ex.Scene`
- Large "SPACE INVADERS" title text in retro monospace font, white on dark navy
- Animated alien sprites marching across the screen (decorative, reuse existing sprite frames)
- Point value display: show each alien type with its point value (squid=30, crab=20, octopus=10)
- "PRESS ENTER OR TAP TO START" prompt that blinks on/off
- Show high score from localStorage (reads via the high score service)
- Scene transitions: title -> game on Enter/tap

### Implementation

1. Create `src/scenes/title.ts` with `TitleScene` class
2. Add decorative animated aliens using existing sprite sheet
3. Add blinking "press start" text using Excalibur's `blink` action
4. Register scene in `src/main.ts`: `game.add('title', new TitleScene())`
5. Change `game.goToScene('game')` to `game.goToScene('title')` in `src/main.ts`
6. On Enter key or pointer down, transition to game scene via `this.engine.goToScene('game')`
7. Resume audio context on first interaction (same pattern as game scene)

### Files Modified

- `src/scenes/title.ts` (NEW)
- `src/main.ts` (register title scene, change initial scene)

### Integration Points

- Reads high score from `HighScoreService` (Feature 2) — can show "HI-SCORE: 0" as default until integrated

---

## Feature 2: High Score System

**New file: `src/services/high-score.ts`**

Persist and display top scores using localStorage.

### Requirements

- `HighScoreService` singleton that manages scores in localStorage
- Store top 5 scores with optional 3-character initials
- Show "HI-SCORE: XXXX" on the game HUD (top center)
- On game over, check if score qualifies for leaderboard
- If new high score: flash "NEW HIGH SCORE!" text
- Scores persist across page refreshes

### Implementation

1. Create `src/services/high-score.ts`:
   ```typescript
   interface ScoreEntry { score: number; initials: string; }
   class HighScoreService {
     private static STORAGE_KEY = 'space-invaders-high-scores';
     getScores(): ScoreEntry[]  // returns top 5, sorted desc
     addScore(score: number, initials?: string): boolean  // returns true if it's a top-5 score
     getHighScore(): number  // returns #1 score or 0
   }
   ```
2. Add "HI-SCORE" label to game HUD in `src/scenes/game.ts` `setupHUD()` — positioned at top center
3. On game over in `triggerGameOver()`: call `highScoreService.addScore(this.score)` and show "NEW HIGH SCORE!" if applicable
4. On restart: update HI-SCORE label from service

### Files Modified

- `src/services/high-score.ts` (NEW)
- `src/scenes/game.ts` (add HI-SCORE label, check on game over)

### Integration Points

- Title screen (Feature 1) will import and display high scores — can be wired after both are built

---

## Feature 3: Destructible Shields/Bunkers

**New file: `src/actors/shield.ts`**

Four pixel-art bunkers between the player and alien grid that absorb bullets and degrade.

### Requirements

- 4 shield bunkers evenly spaced across the screen
- Each shield is a grid of small destructible blocks (e.g., 22x16 grid of 2x2px blocks forming an arch shape)
- Player bullets and alien bullets both destroy shield blocks on contact
- Shields use a classic arch/dome shape (wider at bottom, narrowed at top, hollow underneath)
- Shield blocks are green (classic color)
- Aliens passing through shields destroy them (shields cleared when aliens reach shield Y)
- Shields reset each wave

### Implementation

1. Create `src/actors/shield.ts`:
   - `ShieldBlock` — tiny actor (2x2 or 3x3 px), green rectangle, passive collision
   - `Shield` — spawns the arch pattern of blocks at a given position
   - `ShieldGroup` — manages all 4 shields
2. Add new collision group in `src/collision-groups.ts`:
   - `ShieldGroup` collision group
   - Update `PlayerBulletCollisionGroup` to also collide with shields
   - Update `AlienBulletCollisionGroup` to also collide with shields
3. Add shield config to `src/config.ts`:
   ```typescript
   shield: {
     count: 4,
     yPosition: 500,  // between aliens and player (player is at 600)
     blockSize: 3,
     color: '#00ff00',
   }
   ```
4. Spawn shields in `src/scenes/game.ts` `spawnWave()` — destroy old shields first, then create new ones
5. Wire collision: when a bullet hits a shield block, kill both the bullet and the block

### Shield Shape (arch pattern)

```
   ████████████
  ██████████████
 ████████████████
 ████████████████
 ████████████████
 ████        ████
 ███          ███
```

### Files Modified

- `src/actors/shield.ts` (NEW)
- `src/collision-groups.ts` (add ShieldGroup, update bullet groups)
- `src/config.ts` (add shield config)
- `src/scenes/game.ts` (spawn shields, wire collision)

### Integration Points

- Collision groups are shared — this feature modifies `collision-groups.ts` (other features don't touch this file, so no conflict)

---

## Feature 4: Pause Functionality

**Modifies: `src/scenes/game.ts`**

Allow players to pause and resume the game.

### Requirements

- Press `P` or `Escape` to toggle pause
- Touch: add a small pause button in the HUD area (top-right corner, near lives)
- When paused:
  - Engine timescale set to 0 (freezes all actors)
  - "PAUSED" text displayed at screen center
  - All input except unpause is ignored
  - Alien step sounds stop
- When unpaused: restore timescale to 1, remove pause text
- Cannot pause during game over state
- Add a synthesized pause/unpause sound effect

### Implementation

1. Add `private paused: boolean = false` state to `GameScene`
2. Add `pauseLabel` to HUD (hidden by default)
3. In `onPreUpdate()`: check for P/Escape key press, toggle pause state
4. `togglePause()` method:
   - If pausing: set `engine.timescale = 0`, show "PAUSED" label, play pause sound
   - If unpausing: set `engine.timescale = 1`, hide label, play unpause sound
5. Guard existing `onPreUpdate` logic: if paused, only check for unpause input, skip everything else
6. Add `pauseGame()` and `unpauseGame()` sounds to `src/audio.ts`:
   - Pause: short descending tone
   - Unpause: short ascending tone
7. Add touch pause button: small "II" text in top-right that responds to pointer events

### Files Modified

- `src/scenes/game.ts` (pause state, toggle logic, HUD label)
- `src/audio.ts` (add pause/unpause sounds)
- `src/config.ts` (add pause button position config if needed)

### Integration Points

- Shares `game.ts` with Features 2 and 3 — but touches different methods/sections, so merge conflicts are minimal

---

## Parallel Execution Strategy

These features are designed for **parallel agent implementation**:

| Agent | Feature | Primary Files | Shared Files |
|-------|---------|---------------|--------------|
| Agent 1 | Title Screen | `src/scenes/title.ts` (NEW) | `src/main.ts` |
| Agent 2 | High Scores | `src/services/high-score.ts` (NEW) | `src/scenes/game.ts` |
| Agent 3 | Shields | `src/actors/shield.ts` (NEW) | `src/collision-groups.ts`, `src/config.ts`, `src/scenes/game.ts` |
| Agent 4 | Pause | — | `src/scenes/game.ts`, `src/audio.ts` |

### Conflict Mitigation

- **`src/scenes/game.ts`** is touched by Agents 2, 3, and 4. Each agent adds to different sections:
  - Agent 2: adds HI-SCORE label in `setupHUD()`, adds check in `triggerGameOver()`
  - Agent 3: adds shield spawning in `spawnWave()`, adds shield collision wiring
  - Agent 4: adds pause state/toggle in `onPreUpdate()`, adds pause label in `setupHUD()`
- **Resolution**: Assign Agent 3 (shields) to handle `game.ts` changes last, or have a coordinator merge changes

### Integration After Parallel Work

After all agents complete:
1. Wire title screen to read high scores from `HighScoreService`
2. Verify all `game.ts` changes merged correctly
3. Test full flow: Title → Start → Play (with shields) → Pause → Game Over (high score) → Title

## Acceptance Criteria

- [ ] Title screen shows before gameplay with animated aliens and point values
- [ ] High scores persist in localStorage and display on HUD
- [ ] 4 destructible shield bunkers appear between player and aliens
- [ ] Shield blocks are destroyed by both player and alien bullets
- [ ] Game can be paused/unpaused with P, Escape, or touch button
- [ ] "PAUSED" overlay appears when paused, all action freezes
- [ ] All features work together: title → game (shields + pause + high scores) → game over → title
- [ ] Touch controls work for all new features (start, pause)
- [ ] No regressions in existing gameplay
