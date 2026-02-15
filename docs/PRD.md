# Space Invaders — Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-15
**Author:** Product & Engineering
**Status:** Draft — Awaiting Review

---

## 1. Vision

Transform this Space Invaders implementation from a faithful arcade recreation into the **definitive browser-based Space Invaders experience** for retro gaming enthusiasts. Every feature should honor the 1978 original's design philosophy — tight mechanics, escalating tension, and one-more-game compulsion — while adding modern depth that rewards mastery.

**Design principles:**
- **Authenticity first** — New features should feel like they *could* have existed in a 1980s arcade sequel
- **Depth over breadth** — Each system should reward skilled play, not just fill screen time
- **Earn everything** — Progression through skill, not grinding
- **Respect the player** — No dark patterns, no artificial gates, no pay-to-win

---

## 2. Current State Summary

The game currently includes:
- 3 alien types (squid/30pts, crab/20pts, octopus/10pts) in a 5×11 grid
- Quadratic speed escalation as aliens are destroyed
- Player with 3 lives, 3 max bullets, 150ms fire cooldown
- Shields (3 per wave, appearing from wave 3+) with single-hit blocks
- Synthesized retro audio (7 sound effects via Web Audio API)
- Title screen with score table and animated marching aliens
- High score leaderboard (top 5, localStorage, 3-character initials)
- Screen shake, hit pause, explosion animations
- Pause system (P/ESC)
- Touch controls (zone-based: bottom half = move, top = fire)
- Wave progression with decreasing alien fire interval
- Express server for production deployment

---

## 3. Feature Roadmap

### Priority Tiers

| Tier | Theme | Timeline | Features |
|------|-------|----------|----------|
| **P0 — Foundation** | Core gameplay depth | First | F1–F5 |
| **P1 — Polish** | Audio/visual excellence | Second | F6–F10 |
| **P2 — Progression** | Retention & replayability | Third | F11–F15 |
| **P3 — Modes** | Content variety | Fourth | F16–F19 |
| **P4 — Platform** | Social & infrastructure | Fifth | F20–F24 |

---

## 4. P0 — Foundation Features

### F1: UFO Mystery Ship

**Priority:** P0 | **Effort:** Medium | **Impact:** High

#### Description
A high-value bonus ship that periodically crosses the top of the screen, awarding variable points when destroyed. This was one of the most iconic elements of the original 1978 game and its absence is immediately noticeable to retro gaming enthusiasts.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F1.1 | UFO spawns on a timer | Random interval: 20–40 seconds. Timer starts after first alien is killed each wave. |
| F1.2 | UFO traverses the screen | Moves horizontally from a random side at 120 px/s. Direction alternates each spawn. |
| F1.3 | Deterministic scoring (hidden) | Points cycle through [50, 100, 150, 300] based on player's shot count (mod 4). Displayed as "?" until hit. |
| F1.4 | Distinct audio | Warbling sine wave with rapid vibrato (8Hz LFO on a 400Hz carrier). Fades in as UFO enters, fades out as it exits. Doppler-like pitch shift. |
| F1.5 | Floating score popup | On destruction, show the point value as a floating label that rises and fades over 800ms. |
| F1.6 | Wave scaling | UFO speed increases by 10% per wave. Spawn interval decreases by 1 second per wave (min 12s). |
| F1.7 | New sprite | 32×16 pixel UFO sprite added to the sprite sheet. Classic saucer silhouette. |

#### Acceptance Criteria
- UFO appears reliably during gameplay and awards correct cyclical points
- Shooting a UFO while aliens are firing creates a genuine risk-reward tension
- The warbling audio is audible and recognizable as the classic UFO sound

---

### F2: Shield Degradation System

**Priority:** P0 | **Effort:** Low | **Impact:** Medium

#### Description
Shields degrade visually through multiple hit states before breaking, creating the satisfying erosion patterns from the original arcade cabinet. Currently, each 3×3 block dies in one hit — this makes shields feel disposable rather than strategic.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F2.1 | Multi-hit shield blocks | Each block has 3 HP. |
| F2.2 | Visual degradation | HP 3: bright green (#00ff00). HP 2: yellow-green (#88cc00), 80% opacity. HP 1: dark yellow (#cc8800), 50% opacity, smaller drawn size (2×2 within the 3×3 space). |
| F2.3 | Impact feedback | Each hit plays a short "crumble" sound (filtered white noise, 40ms). |
| F2.4 | Debris particles | On block destruction (HP→0), emit 3–5 small green pixel particles that scatter and fade. |
| F2.5 | Shields on wave 1 | Move shield spawn from wave 3 to wave 1. With 3HP blocks, early shields are no longer overpowered. |

#### Acceptance Criteria
- Shields visually erode in a way that communicates remaining durability at a glance
- A fully intact shield can absorb 3× more damage than before, making shields strategically meaningful
- The erosion pattern from both player and alien fire creates unique "battle scars" each game

---

### F3: Power-Up Drops

**Priority:** P0 | **Effort:** High | **Impact:** High

#### Description
Destroyed aliens occasionally drop power-ups that fall toward the player. Power-ups are temporary and create "fever" moments of heightened capability. Design these to feel like bonus rounds from the 1980s arcade era — exciting but not game-breaking.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F3.1 | Drop mechanic | 8% base chance per alien kill. Increases by 1% per wave (max 15%). Only one power-up can exist on screen at a time. |
| F3.2 | Fall speed | Power-ups fall at 80 px/s (slow enough to chase). |
| F3.3 | **Spread Shot** | Fires 3 bullets in a 15° fan pattern. Duration: 8 seconds. Retro color: cyan. |
| F3.4 | **Rapid Fire** | Removes fire cooldown, max bullets increased to 6. Duration: 6 seconds. Retro color: red. |
| F3.5 | **Shield Bubble** | Absorbs the next hit without losing a life. Single use. Retro color: green. Visible bubble around player. |
| F3.6 | **Score Multiplier** | 2× points for all kills. Duration: 10 seconds. Retro color: yellow. HUD shows "×2" indicator. |
| F3.7 | Pickup audio | Rising arpeggio chiptune (3 notes, 100ms total). |
| F3.8 | Active indicator | HUD shows active power-up name + countdown bar at the bottom of the screen. |
| F3.9 | Expiry warning | Power-up icon blinks for the final 2 seconds. Audio: rapid beeping. |
| F3.10 | Drop weighting | Spread Shot: 30%, Rapid Fire: 25%, Shield Bubble: 25%, Score Multiplier: 20%. |

#### Acceptance Criteria
- Power-ups create distinct "fever" moments without making the game trivially easy
- Collecting a power-up while one is active replaces it (no stacking)
- Drop rate feels rewarding (roughly 4–5 per wave) without being overwhelming

---

### F4: Enhanced Alien Behaviors

**Priority:** P0 | **Effort:** Medium | **Impact:** High

#### Description
Add variety to alien behavior in later waves so the game evolves as the player progresses. New behaviors unlock at named difficulty tiers, keeping early waves true to the classic while rewarding skilled players with new challenges.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F4.1 | Difficulty tiers | Waves 1–3: **RECRUIT**. Waves 4–6: **SOLDIER**. Waves 7–9: **VETERAN**. Waves 10–12: **COMMANDER**. Waves 13+: **ADMIRAL**. Tier name displayed below wave number. |
| F4.2 | Dive-bombing (VETERAN+) | 10% chance per step that a bottom-row alien breaks formation and dives toward the player in a sine-wave path. Dive aliens fire 2 aimed bullets. Worth 2× base points. |
| F4.3 | Split formation (COMMANDER+) | After edge-bounce, the grid has a 20% chance to split into two halves that move independently for 8 steps before re-merging. |
| F4.4 | Escort aliens (ADMIRAL+) | Small fast aliens (16×8 sprite) spawn from the sides in pairs, escorting the grid. They weave independently and fire diagonally. Worth 40 points. |
| F4.5 | Tier transition | When entering a new tier, flash the tier name in large text (32px) for 1.5 seconds with a dramatic stinger sound. |
| F4.6 | Audio variation | Each tier adds a slight filter change to the alien step sound: RECRUIT is clean, SOLDIER adds subtle distortion, VETERAN adds reverb, COMMANDER adds bitcrusher, ADMIRAL layers all effects. |

#### Acceptance Criteria
- Early waves (RECRUIT) play identically to the current game
- Each tier introduction feels like a meaningful escalation, not a sudden wall
- Dive-bombers create panic moments but are predictable enough to counter with skill

---

### F5: Boss Battles

**Priority:** P0 | **Effort:** High | **Impact:** High

#### Description
Every 5 waves, the player faces a boss instead of a standard alien grid. Bosses are multi-phase encounters with health bars, unique attack patterns, and dramatic presentation. These serve as progression milestones and shareable moments.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F5.1 | Boss schedule | Waves 5, 10, 15, 20, 25… replace the standard grid with a boss encounter. |
| F5.2 | **Wave 5: Mothership** | Large sprite (64×32). 20 HP. Phase 1: sweeps left/right firing 3-bullet spreads. Phase 2 (≤10 HP): deploys 3 mini-aliens that descend in formation. Phase 3 (≤5 HP): rapid fire aimed bullets + screen-wide laser telegraph (1s warning line, then 0.3s beam). |
| F5.3 | **Wave 10: Commander** | 64×48 sprite with visible shield segments. 30 HP. Shield blocks the front — must hit from the sides when it turns. Fires homing missiles (slow, 60 px/s, player can outrun). Shield regenerates after 10 seconds if not destroyed. |
| F5.4 | **Wave 15: Admiral** | 48×48 sprite. 40 HP. Teleports every 4 seconds to a random position. Fires bullet rings (8 bullets in a circle). Creates gravity wells that pull player bullets off course. |
| F5.5 | Health bar | Positioned at top of screen. Shows boss name, HP bar, and phase indicators. |
| F5.6 | Boss defeated | Dramatic multi-stage explosion (1.5 seconds). Bonus points: 500 × boss tier (wave 5 = 2500, wave 10 = 5000, etc.). |
| F5.7 | Boss audio | Unique boss battle music layer: driving pulse bass + tension melody. Intensifies per phase. |
| F5.8 | Retry on death | Dying during a boss fight costs a life but restarts the boss at the current phase, not the beginning. |

#### Acceptance Criteria
- Each boss feels like a distinct challenge requiring different tactics
- Bosses are challenging but fair — every attack has a tell and a dodge window
- Defeating a boss is a triumphant moment with appropriate audiovisual payoff

---

## 5. P1 — Polish Features

### F6: Particle Effects System

**Priority:** P1 | **Effort:** Medium | **Impact:** High

#### Description
A particle system that adds visual depth to every game action. Particles should evoke the CRT phosphor glow aesthetic — soft edges, bright centers, and slight bloom.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F6.1 | Alien destruction | Burst of 8–12 particles matching the alien's color. Particles scatter outward and fade over 400ms. |
| F6.2 | Bullet trails | Player bullets: 2-pixel cyan trail particles that linger 100ms. Alien bullets: red-orange trail. |
| F6.3 | Shield debris | On block destruction: 3–5 green pixel fragments scatter outward with slight gravity pull downward. |
| F6.4 | Background starfield | 40–60 slowly drifting white dots at varying brightness and speeds (parallax layers). Subtle but atmospheric. |
| F6.5 | Wave clear burst | Circular ring of white particles expanding from center on wave clear. |
| F6.6 | Power-up glow | Active power-up emits a subtle pulsing aura of matching color around the player. |
| F6.7 | Performance budget | Max 200 active particles at any time. Recycle oldest particles when limit is reached. |

#### Acceptance Criteria
- Particles enhance game feel without obscuring gameplay-critical information
- Starfield creates a sense of depth and atmosphere
- Performance remains smooth (60 FPS) even during intense particle moments

---

### F7: Adaptive Background Music

**Priority:** P1 | **Effort:** High | **Impact:** High

#### Description
A layered synthesized music system that responds to game state, extending the original game's pioneering adaptive audio concept (the accelerating 4-note bass march). All music is generated via Web Audio API — no audio files.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F7.1 | Base layer | Atmospheric low pad (filtered sawtooth, 55Hz). Always playing during gameplay. Volume: 0.05. |
| F7.2 | March layer | The existing 4-note alien step bass, enhanced. Tempo automatically follows the alien step interval. This is the heartbeat of the music. |
| F7.3 | Tension layer | Pulsing hi-hat / noise percussion. Fades in when aliens are below y=350 (halfway down). Tempo synced to march. |
| F7.4 | Danger layer | Staccato high-frequency arpeggiated pattern. Fades in when player has 1 life remaining. |
| F7.5 | Fever layer | Driving 16th-note bass pattern. Active during power-up fever moments. |
| F7.6 | Boss layer | Completely replaces normal layers. Driving pulse at 140 BPM with tension melody. Intensifies per boss phase. |
| F7.7 | Smooth transitions | All layer crossfades happen over 500ms. No abrupt audio changes. |
| F7.8 | Respects volume settings | Music volume independent from SFX volume (see F10). |

#### Acceptance Criteria
- Music feels organic and reactive, not like separate loops stitched together
- The transition from calm (full grid, all lives) to intense (few aliens, one life) is emotionally compelling
- Players who grew up with the original recognize the DNA of the 4-note march in the music

---

### F8: Alien Death Animation Variety

**Priority:** P1 | **Effort:** Low | **Impact:** Medium

#### Description
Type-specific death animations replace the uniform explosion, adding visual variety to the most frequent game event (55+ alien kills per wave).

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F8.1 | Squid death | Dissolves into a small pixel cloud that drifts upward and fades. 6 particles, 300ms. |
| F8.2 | Crab death | Splits into two halves that fly apart horizontally and rotate. 400ms. |
| F8.3 | Octopus death | Leaves an "ink splatter" — a dark circle that fades from the alien's position. 500ms. |
| F8.4 | Last-alien kill | Enhanced explosion: 2× particle count, screen shake 4px/200ms, hit pause 80ms. Score popup in gold. |
| F8.5 | UFO death | Spiral of multicolored particles converging inward then bursting outward. 600ms. |
| F8.6 | Audio pitch variety | Alien explosion pitch shifts ±10% randomly per kill. Type-based base pitch: squid (high), crab (mid), octopus (low). |

#### Acceptance Criteria
- Each alien type has a visually distinct death that is recognizable at a glance
- The last-alien kill feels climactic and satisfying
- Audio variety prevents repetitive sound fatigue

---

### F9: Screen Transitions & Wave Announcements

**Priority:** P1 | **Effort:** Low | **Impact:** Medium

#### Description
Polished transitions between game states that provide pacing and dramatic emphasis.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F9.1 | Title → Game | 400ms fade to black, then fade in on the game scene. |
| F9.2 | Wave announcement | "WAVE X" text scales up from 0% to 100% over 300ms (bounce easing), holds 600ms, then fades. Tier name appears below in smaller text if applicable. |
| F9.3 | Boss announcement | "WARNING" text flashes red 3 times (200ms each), then boss name slides in from the right. Alarm klaxon audio. 2 second total duration before boss appears. |
| F9.4 | Game over | Screen desaturates over 500ms. "GAME OVER" types out letter by letter (typewriter effect, 80ms per character). |
| F9.5 | Wave clear | Brief white flash (50ms, 30% opacity overlay), then wave announcement for the next wave. |

#### Acceptance Criteria
- Transitions provide breathing room between waves without feeling slow
- Boss warnings create genuine anticipation and tension
- The typewriter game-over effect feels retro-authentic

---

### F10: Volume Controls & Sound Settings

**Priority:** P1 | **Effort:** Low | **Impact:** Medium

#### Description
Separate volume controls for Master, SFX, and Music. Essential quality-of-life feature.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F10.1 | Settings accessible from title screen and pause menu | Simple overlay with 3 sliders. |
| F10.2 | Master volume | Controls overall output. Range: 0–100%. Default: 80%. |
| F10.3 | SFX volume | Controls all sound effects. Range: 0–100%. Default: 100%. |
| F10.4 | Music volume | Controls all music layers. Range: 0–100%. Default: 70%. |
| F10.5 | Mute toggle | M key toggles master mute. Visual indicator in HUD when muted. |
| F10.6 | Persistence | All settings saved to localStorage. Restored on page load. |
| F10.7 | Audio routing | Implement separate Web Audio gain nodes for SFX and music buses. |

#### Acceptance Criteria
- Volume changes take effect immediately with no audio glitches
- Settings persist across sessions
- Muting is accessible via a single keypress at any time

---

## 6. P2 — Progression Features

### F11: Achievement System

**Priority:** P2 | **Effort:** Medium | **Impact:** High

#### Description
15 achievements tracking lifetime accomplishments. Designed for retro enthusiasts — achievements reference arcade culture and reward mastery, not just participation.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F11.1 | Achievement list | See table below. |
| F11.2 | Unlock notification | Toast popup in top-right: achievement icon + name, slides in and out over 3 seconds. Chiptune jingle (ascending 5-note arpeggio). |
| F11.3 | Achievement display | Accessible from title screen. Grid of achievement icons — unlocked ones are bright, locked ones are dimmed silhouettes with "???" descriptions. |
| F11.4 | Persistence | Stored in localStorage. Tracks both unlock status and progress counters. |
| F11.5 | Stat tracking | Track: total aliens killed, total games played, total play time, shots fired, shots hit, UFOs destroyed, bosses defeated, waves cleared, highest combo, perfect waves (no damage taken). |

**Achievement Table:**

| # | Name | Condition | Reference |
|---|------|-----------|-----------|
| 1 | First Contact | Destroy your first alien | — |
| 2 | Quarter Muncher | Play 25 games | Arcade culture |
| 3 | Wave Rider | Reach wave 10 | — |
| 4 | Perfect Wave | Clear a wave without taking damage | — |
| 5 | Sharpshooter | 90%+ accuracy in a single wave (min 20 shots) | — |
| 6 | Speed Demon | Clear a wave in under 12 seconds | — |
| 7 | UFO Hunter | Destroy 10 UFOs (lifetime) | — |
| 8 | Boss Slayer | Defeat your first boss | — |
| 9 | The 300 Club | Hit a 300-point UFO | Refers to the deterministic UFO scoring trick |
| 10 | Marathon Runner | Reach wave 20 | — |
| 11 | Combo Master | Achieve a 10-kill combo (kills within 1.5s of each other) | — |
| 12 | No Coin Needed | Score 50,000 points in a single run | Arcade culture |
| 13 | Admiral | Reach ADMIRAL difficulty tier (wave 13) | — |
| 14 | Untouchable | Clear 3 consecutive waves without taking damage | — |
| 15 | High Score Hero | Hold the #1 position on any leaderboard | — |

#### Acceptance Criteria
- Achievements unlock reliably with no false positives or missed triggers
- The unlock notification is satisfying but does not obscure gameplay
- Locked achievements give just enough of a hint to be intriguing

---

### F12: Weapon Upgrade System

**Priority:** P2 | **Effort:** Medium | **Impact:** High

#### Description
A within-run weapon progression system. Destroying aliens fills an upgrade meter; reaching thresholds permanently upgrades the weapon for the current run. Dying drops the weapon level by 1, making death consequential beyond just losing a life.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F12.1 | Upgrade meter | Fills based on points scored. Thresholds: Level 2 at 500pts, Level 3 at 1500pts, Level 4 at 3500pts, Level 5 at 6000pts. |
| F12.2 | **Level 1: Standard** | Default single shot. Current behavior. |
| F12.3 | **Level 2: Accelerated** | Bullet speed increased to 500 px/s (from 400). Fire cooldown reduced to 100ms (from 150). |
| F12.4 | **Level 3: Double Shot** | Fires 2 bullets side by side (8px apart). Same speed as Level 2. |
| F12.5 | **Level 4: Piercing** | Bullets pass through the first alien hit and can destroy a second. Bullet turns yellow-green on pierce. |
| F12.6 | **Level 5: Plasma** | Fires a continuous 0.4-second beam (4px wide) that damages all aliens in its path. 1.2-second cooldown between beams. Distinct audio: sustained high-pitched hum. |
| F12.7 | Level-down on death | Dying drops weapon level by 1 (min Level 1). |
| F12.8 | HUD indicator | Small weapon level display near the player: "WPN ★★★☆☆" or similar. Upgrade meter shown as a thin bar. |
| F12.9 | Level-up feedback | Flash + rising tone + brief text "WEAPON LEVEL UP!" for 1 second. |

#### Acceptance Criteria
- Weapon upgrades feel like meaningful rewards, not just stat bumps
- Level 5 plasma beam is powerful but balanced by its long cooldown
- Losing a weapon level on death creates real stakes

---

### F13: Unlockable Player Ships

**Priority:** P2 | **Effort:** Medium | **Impact:** Medium

#### Description
4 alternative ships with distinct stat profiles, unlocked through achievements. Each ship encourages a different playstyle.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F13.1 | Ship roster | See table below. |
| F13.2 | Ship select screen | After pressing Start on the title screen, a ship selection screen shows available ships with stat bars and unlock conditions. Locked ships are shown as silhouettes. |
| F13.3 | Unique sprites | Each ship has a distinct 24×16 pixel sprite with a recognizable silhouette. |
| F13.4 | Stat visualization | Horizontal bars for: Speed, Fire Rate, Bullet Speed, Special. |
| F13.5 | Ship persistence | Selected ship preference saved to localStorage. |

**Ship Table:**

| Ship | Speed | Fire Rate | Bullets | Special | Unlock Condition |
|------|-------|-----------|---------|---------|-----------------|
| **Classic** | 200 | 150ms CD | 3 max | — | Default |
| **Interceptor** | 280 | 120ms CD | 2 max | — | Reach wave 10 |
| **Fortress** | 150 | 180ms CD | 3 max | +1 starting life (4 total) | Destroy 500 aliens (lifetime) |
| **Sniper** | 200 | 300ms CD | 2 max | Bullets pierce 1 alien, 500 px/s speed | Achieve 5 Perfect Waves |
| **Ghost** | 220 | 150ms CD | 3 max | Invincibility time 3s (from 2s), 600ms respawn | Reach ADMIRAL tier |

#### Acceptance Criteria
- Each ship feels meaningfully different in play
- Unlock conditions are achievable but require investment
- Ship selection does not slow down the start-game flow (quick to select, easy to skip with default)

---

### F14: Difficulty Selection

**Priority:** P2 | **Effort:** Low | **Impact:** Medium

#### Description
Three difficulty modes for different experience levels. Named with respect — no condescending labels.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F14.1 | **Recruit** (Easy) | 5 lives. Alien fire interval +500ms. Alien bullet speed 100 px/s. Shields from wave 1 with 4HP blocks. UFOs worth 2× points. |
| F14.2 | **Veteran** (Normal) | Current game settings. The canonical experience. |
| F14.3 | **Admiral** (Hard) | 2 lives. Alien fire interval −200ms. Alien bullet speed 200 px/s. No shields. UFOs move 50% faster. Dive-bombers start at wave 4 instead of 7. |
| F14.4 | Selection UI | Shown on title screen before ship select. Selected difficulty highlighted. |
| F14.5 | Leaderboard tagging | Scores tagged with difficulty. Leaderboard filterable by difficulty. |
| F14.6 | HUD indicator | Small difficulty badge in corner during gameplay. |

#### Acceptance Criteria
- Recruit mode is accessible to newcomers without feeling patronizing
- Admiral mode is a genuine challenge even for experienced players
- Difficulty names reinforce the game's military sci-fi theme

---

### F15: Stats Dashboard

**Priority:** P2 | **Effort:** Medium | **Impact:** Medium

#### Description
A comprehensive statistics screen tracking lifetime play data, viewable from the title screen.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F15.1 | Stats tracked | Total games played, total play time, total aliens destroyed, total shots fired, lifetime accuracy %, highest score, highest wave, total UFOs destroyed, total bosses defeated, total power-ups collected, average score (last 10 games), most-used ship. |
| F15.2 | Trend visualization | A simple bar chart showing the player's last 10 scores, drawn on canvas. Highlights the best score in the series. |
| F15.3 | Session stats | After each game, the game over screen shows: aliens destroyed, accuracy %, wave reached, time survived, power-ups collected, combos achieved. |
| F15.4 | Persistence | All stats stored in localStorage. |
| F15.5 | Stat reset | Option to reset all stats (with confirmation dialog). |

#### Acceptance Criteria
- Stats load instantly with no perceptible delay
- The trend chart provides a clear visual of improvement (or decline)
- Session stats on the game-over screen encourage "one more try" behavior

---

## 7. P3 — Game Modes

### F16: Endless Mode

**Priority:** P3 | **Effort:** Medium | **Impact:** High

#### Description
A continuous-spawn survival mode with no wave breaks. Aliens appear in varied formations from the top of the screen in an endless stream. Difficulty ramps smoothly. The goal is pure score.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F16.1 | Spawn system | Small groups of 3–8 aliens spawn from the top at random X positions every 4–8 seconds. Spawn rate increases over time (interval decreases by 0.1s per minute, min 1.5s). |
| F16.2 | Formation variety | Random formations: line, V-shape, diamond, cluster, single-file column. Each formation has a movement pattern. |
| F16.3 | No wave breaks | Gameplay is continuous. A running timer replaces the wave counter in the HUD. |
| F16.4 | Power-up frequency | Power-ups drop 50% more frequently than standard mode. |
| F16.5 | Separate leaderboard | Endless mode has its own leaderboard, separate from standard. |
| F16.6 | Mode select | Accessible from the title screen: "STANDARD / ENDLESS / TIME ATTACK" |

#### Acceptance Criteria
- The experience feels relentless but not unfair — the player always has room to dodge
- Formations create visual variety that keeps the screen interesting
- High scores in Endless mode feel distinct from Standard mode scores

---

### F17: Time Attack Mode

**Priority:** P3 | **Effort:** Medium | **Impact:** Medium

#### Description
A 90-second timed challenge focused on aggressive play. Aliens spawn rapidly. Consecutive kills build a combo multiplier. The mode rewards offense over defense.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F17.1 | Timer | 90-second countdown, prominently displayed at top center (24px, bold). Flashes red in the final 10 seconds. |
| F17.2 | Continuous spawns | Aliens spawn in quick waves — a new group every 3 seconds. No pauses. |
| F17.3 | Combo multiplier | Kills within 1.5 seconds of each other build a combo. Combo multiplier: ×1 (1 kill), ×2 (3 kills), ×3 (6 kills), ×4 (10 kills), ×5 max (15+ kills). Displayed prominently in HUD. |
| F17.4 | Combo break | Missing a shot or going 2 seconds without a kill resets the combo. Audio: descending tone on break. |
| F17.5 | Infinite lives | Player respawns instantly on death with a 0.5s invincibility. Deaths reset the combo. |
| F17.6 | Results screen | Total kills, highest combo, accuracy %, final score, letter grade (S/A/B/C/D). |
| F17.7 | Separate leaderboard | Time Attack has its own leaderboard. |

#### Acceptance Criteria
- The mode feels frantic and exciting — 90 seconds flies by
- Combos create a satisfying feedback loop of sound, visual, and score escalation
- The letter grade system gives players a clear target for improvement

---

### F18: Daily Challenge

**Priority:** P3 | **Effort:** High | **Impact:** High

#### Description
A daily seeded challenge that all players worldwide face identically. One official attempt per day. Creates shared competitive experience and daily return motivation.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F18.1 | Deterministic seed | Seed = YYYY-MM-DD string hashed to integer. Seed controls: alien formation layout, power-up spawn times and types, UFO schedule, shield positions. |
| F18.2 | One official attempt | First play of the day is the "official" attempt — score submitted to the daily leaderboard. Subsequent plays are marked as "practice" and don't count. |
| F18.3 | Daily leaderboard | Server-side leaderboard that resets at midnight UTC. Shows rank, initials, score. |
| F18.4 | Calendar view | Title screen shows a calendar of the current week with the player's daily scores and global rank for each day played. |
| F18.5 | Special modifier | Each daily challenge has a random modifier displayed before the run: "Double UFOs," "Fast Aliens," "Powerup Rain," "No Shields," "Mirror Mode" (controls reversed), etc. |
| F18.6 | Share result | After completing the daily, a "Share" button generates a copyable text: `SPACE INVADERS DAILY #147 ★★★★☆ Score: 12,450 | Wave: 8 | Combo: 14` |

#### Acceptance Criteria
- All players face the exact same challenge on the same day
- The daily modifier creates variety that makes each day feel fresh
- The "one official attempt" constraint makes each run feel consequential

---

### F19: Challenge Mode

**Priority:** P3 | **Effort:** Medium | **Impact:** Medium

#### Description
10 hand-crafted challenge scenarios with bronze/silver/gold ratings. Each teaches or tests a specific skill.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F19.1 | Challenge list | See table below. |
| F19.2 | Rating system | Each challenge has bronze/silver/gold thresholds. Shown as stars (★★★). |
| F19.3 | Challenge select | Grid of 10 challenges accessible from mode select. Shows best rating per challenge. |
| F19.4 | Locked progression | Challenges 1–3 unlocked by default. Each subsequent challenge unlocks by earning at least bronze on the previous. |
| F19.5 | Persistence | Best ratings stored in localStorage. |

**Challenge Table:**

| # | Name | Constraint | Bronze | Silver | Gold |
|---|------|-----------|--------|--------|------|
| 1 | Boot Camp | Standard wave, 5 lives | Clear wave | Clear with 3+ lives | Clear with 5 lives |
| 2 | Sharpshooter | Only 30 bullets for the entire wave | Clear wave | 70% accuracy | 90% accuracy |
| 3 | Speed Run | Clear 3 waves | Under 120s | Under 90s | Under 60s |
| 4 | No Miss | 1 life, standard wave | Reach 20 kills | Reach 40 kills | Clear wave |
| 5 | Bullet Hell | Triple alien fire rate | Survive 60s | Survive 120s | Clear wave |
| 6 | Last Stand | Start at wave 10, 1 life, no shields | Reach 10 kills | Reach 30 kills | Clear wave |
| 7 | UFO Hunt | UFOs spawn every 5s, only UFO kills count | Score 500 | Score 1500 | Score 3000 |
| 8 | Boss Rush | 3 bosses back-to-back, 5 lives | Beat 1 boss | Beat 2 bosses | Beat all 3 |
| 9 | Minimalist | Max 1 bullet on screen, no power-ups | Clear 1 wave | Clear 3 waves | Clear 5 waves |
| 10 | ADMIRAL Trial | Wave 13+ settings from start, 2 lives | Survive 60s | Survive 120s | Clear wave |

#### Acceptance Criteria
- Each challenge feels like a distinct puzzle with a learnable solution
- Gold ratings are genuinely difficult to achieve
- Completing all challenges at gold is a prestige accomplishment

---

## 8. P4 — Platform Features

### F20: Online Leaderboard

**Priority:** P4 | **Effort:** High | **Impact:** High

#### Description
A server-backed global leaderboard with daily, weekly, and all-time rankings.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F20.1 | API endpoints | `POST /api/scores` — submit score. `GET /api/scores?mode=standard&period=alltime&limit=50` — retrieve leaderboard. |
| F20.2 | Score submission | Payload: `{ initials, score, wave, mode, difficulty, ship, accuracy, date }`. |
| F20.3 | Anti-cheat | Server-side validation: max score per wave heuristic (reject impossibly high scores), rate limiting (max 1 submission per 30 seconds per IP), score hash verification (client sends a hash of game events that server can validate). |
| F20.4 | Leaderboard views | Top 50 for each combination of mode (Standard/Endless/Time Attack) and period (Daily/Weekly/All-time). Player's own rank highlighted if present. |
| F20.5 | Database | SQLite for simplicity. Single `scores` table. Indexes on `mode`, `date`, `score`. |
| F20.6 | Leaderboard UI | Full-screen overlay accessible from title screen. Tab navigation for mode/period. Scrollable list showing rank, initials, score, wave, ship, date. |
| F20.7 | Offline fallback | If server is unreachable, fall back to localStorage leaderboard seamlessly. Queue submissions for retry. |

#### Acceptance Criteria
- Leaderboard loads within 500ms
- Anti-cheat catches obviously invalid scores without false-positiving legitimate high scores
- The leaderboard feels like a real arcade high score board — compact, competitive, visible

---

### F21: Share Score Card

**Priority:** P4 | **Effort:** Low | **Impact:** Medium

#### Description
Generate a shareable result card after each game, optimized for social media and messaging.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F21.1 | Text format | Copyable text block (Wordle-style): `SPACE INVADERS 🕹️ Score: 8,450 │ Wave: 12 │ Rank: COMMANDER │ Accuracy: 74% │ Ship: Sniper │ ★★★★☆ [play at URL]` |
| F21.2 | Image format | Canvas-rendered retro-styled card (400×200px) with dark blue background, green phosphor text, game stats, and the game's logo. Downloadable as PNG. |
| F21.3 | Share button | Shown on game over screen. Uses Web Share API on mobile, clipboard copy on desktop. "Copied!" confirmation toast. |
| F21.4 | Star rating | 1–5 stars based on wave reached: ★ (wave 1–3), ★★ (4–6), ★★★ (7–9), ★★★★ (10–14), ★★★★★ (15+). |

#### Acceptance Criteria
- Share text copies cleanly to all major platforms (Twitter/X, Discord, iMessage)
- The image card looks good on both light and dark social media backgrounds
- Sharing is a single tap/click — minimal friction

---

### F22: Cosmetic Unlockables

**Priority:** P4 | **Effort:** Medium | **Impact:** Medium

#### Description
Visual customization options that reward long-term play without affecting gameplay balance.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F22.1 | Bullet trails | Default (white), Blue Plasma, Red Laser, Green Retro, Rainbow. Unlocked at score milestones (lifetime cumulative: 10K, 25K, 50K, 100K). |
| F22.2 | Explosion styles | Default (current), Pixel Burst (square fragments), Fireworks (upward scatter), Electric (lightning arcs), Vaporize (dissolve). Unlocked via achievements. |
| F22.3 | Background themes | Deep Space (default, current dark blue), Nebula (purple/pink gradient with gas clouds), Asteroid Field (slowly drifting rocks), Retro CRT (green-on-black with scanlines and screen curvature), Synthwave (grid horizon with neon sunset). Unlocked at play-time milestones (1hr, 3hr, 5hr, 10hr). |
| F22.4 | Cosmetics menu | Accessible from title screen. Preview each cosmetic before selecting. |
| F22.5 | Persistence | Selected cosmetics saved to localStorage. |

#### Acceptance Criteria
- Cosmetics are visually distinct and satisfying to unlock
- The Retro CRT theme is a love letter to the original arcade cabinet aesthetic
- No cosmetic obscures gameplay-critical information

---

### F23: Ghost Replay System

**Priority:** P4 | **Effort:** High | **Impact:** Medium

#### Description
Records the player's best run and replays it as a translucent "ghost" during subsequent runs, creating a race-against-yourself dynamic borrowed from racing game time trials.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F23.1 | Recording | Record player X position and fire events at 10Hz. Record score milestones (every 500 points) with timestamps. Estimated size: ~3KB per minute. |
| F23.2 | Ghost display | 30% opacity version of the player sprite, offset 4px upward to avoid overlap. Replays recorded positions. Does not interact with any game objects. |
| F23.3 | Ghost score | Ghost's score displayed in a small label next to the ghost, updating at recorded milestones. |
| F23.4 | Ahead/behind indicator | If player's current score > ghost's score at the same timestamp: green "AHEAD +X" label. If behind: red "BEHIND -X" label. |
| F23.5 | Ghost selection | Default: best score run. Option to race against: best score, best wave, or most recent run. |
| F23.6 | Toggle | Ghost can be enabled/disabled in settings. Off by default. |
| F23.7 | Storage | Best ghost recording stored in localStorage. Only the single best recording per mode is kept. |

#### Acceptance Criteria
- The ghost is visible enough to notice but does not distract from active gameplay
- Overtaking your ghost feels triumphant
- Ghost recording/playback has no perceptible performance impact

---

### F24: Colorblind & Accessibility Mode

**Priority:** P4 | **Effort:** Medium | **Impact:** Medium

#### Description
Accessibility options ensuring the game is playable by all users, with particular attention to color vision deficiency and keyboard-only navigation.

#### Requirements

| ID | Requirement | Details |
|----|------------|---------|
| F24.1 | High-contrast mode | All game elements gain 2px white outlines. Background darkens to pure black. Bullets become bright white. Shields become bright cyan. |
| F24.2 | Shape differentiation | Power-up types use distinct shapes in addition to color: Spread Shot (triangle), Rapid Fire (circle), Shield Bubble (square), Score Multiplier (star). |
| F24.3 | Colorblind palette option | Swap green shields to blue, red alien bullets to orange, yellow power-up to purple. Uses a palette proven safe for protanopia and deuteranopia. |
| F24.4 | Full keyboard navigation | All menus navigable with arrow keys + Enter. Tab order on all interactive elements. Visual focus indicator. |
| F24.5 | Screen reader basics | Title screen, menus, game over screen, and leaderboard have ARIA labels. Score and lives announced via `aria-live` region on change. |
| F24.6 | Reduced motion option | Disables screen shake, particles, and transition animations. Keeps gameplay-critical feedback (hit flash, invincibility blink). |
| F24.7 | Settings persistence | All accessibility settings in localStorage. Accessible from title screen settings menu. |

#### Acceptance Criteria
- A player with deuteranopia can distinguish all game elements without relying on color
- All menus are fully navigable without a mouse
- Reduced motion mode maintains game feel while eliminating potentially problematic visual effects

---

## 9. Technical Architecture

### New Files (Projected)

```
src/
├── actors/
│   ├── ufo.ts                  # F1: UFO mystery ship
│   ├── power-up.ts             # F3: Power-up drops
│   ├── boss.ts                 # F5: Base boss class
│   ├── bosses/
│   │   ├── mothership.ts       # F5: Wave 5 boss
│   │   ├── commander.ts        # F5: Wave 10 boss
│   │   └── admiral.ts          # F5: Wave 15 boss
│   └── particles.ts            # F6: Particle system wrapper
├── scenes/
│   ├── ship-select.ts          # F13: Ship selection
│   ├── endless.ts              # F16: Endless mode
│   ├── time-attack.ts          # F17: Time attack mode
│   ├── challenge.ts            # F19: Challenge mode
│   ├── leaderboard.ts          # F20: Leaderboard display
│   ├── stats.ts                # F15: Stats dashboard
│   ├── settings.ts             # F10/F24: Settings & accessibility
│   └── achievements.ts         # F11: Achievement display
├── services/
│   ├── achievement.ts          # F11: Achievement tracking
│   ├── stats.ts                # F15: Lifetime stats
│   ├── cosmetics.ts            # F22: Cosmetic persistence
│   ├── ghost.ts                # F23: Ghost recording/playback
│   ├── daily.ts                # F18: Daily challenge seed
│   ├── settings.ts             # F10/F24: Settings persistence
│   └── api.ts                  # F20: Server communication
├── systems/
│   ├── music.ts                # F7: Adaptive music
│   ├── weapon-upgrade.ts       # F12: Weapon progression
│   └── difficulty.ts           # F4/F14: Difficulty tier system
└── config.ts                   # Extended with new constants

server/
├── server.ts                   # Extended Express server
├── db.ts                       # F20: SQLite setup
└── routes/
    ├── scores.ts               # F20: Leaderboard API
    └── daily.ts                # F18: Daily challenge API
```

### Data Model (Server)

```sql
-- scores table
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  initials TEXT NOT NULL,
  score INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  mode TEXT NOT NULL,           -- 'standard', 'endless', 'time_attack', 'daily'
  difficulty TEXT NOT NULL,     -- 'recruit', 'veteran', 'admiral'
  ship TEXT NOT NULL,           -- 'classic', 'interceptor', etc.
  accuracy REAL,
  daily_seed TEXT,              -- NULL for non-daily modes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT                  -- For rate limiting
);

CREATE INDEX idx_scores_mode_score ON scores(mode, score DESC);
CREATE INDEX idx_scores_daily ON scores(daily_seed, score DESC);
CREATE INDEX idx_scores_created ON scores(created_at);
```

### localStorage Keys

| Key | Feature | Data |
|-----|---------|------|
| `space-invaders-high-scores` | Existing | Top 5 local scores |
| `space-invaders-achievements` | F11 | `{ unlocked: string[], progress: Record<string, number> }` |
| `space-invaders-stats` | F15 | Lifetime aggregate stats object |
| `space-invaders-settings` | F10/F24 | Volume levels, accessibility flags |
| `space-invaders-cosmetics` | F22 | `{ unlocked: string[], selected: Record<string, string> }` |
| `space-invaders-ghost-standard` | F23 | Best run recording for standard mode |
| `space-invaders-ghost-endless` | F23 | Best run recording for endless mode |
| `space-invaders-ship` | F13 | Selected ship ID |
| `space-invaders-difficulty` | F14 | Selected difficulty |
| `space-invaders-daily-attempts` | F18 | `{ [date]: { official: boolean, score: number } }` |

---

## 10. Dependencies & Build Order

```
F1 (UFO) ─────────────────────────────────────── standalone
F2 (Shield degradation) ─────────────────────── standalone
F3 (Power-ups) ──────────────────────────────── standalone
F4 (Alien behaviors) ────────────────────────── standalone
F5 (Bosses) ─────────────────────────────────── standalone
F6 (Particles) ──────────────────────────────── standalone, enhances F1-F5
F7 (Music) ──────────────────────────────────── depends on F10 (volume)
F8 (Death animations) ──────────────────────── depends on F6 (particles)
F9 (Transitions) ────────────────────────────── standalone
F10 (Volume controls) ──────────────────────── standalone
F11 (Achievements) ─────── depends on F1, F3, F5 (for achievement conditions)
F12 (Weapon upgrades) ──────────────────────── standalone
F13 (Ships) ─────────────── depends on F11 (unlock conditions)
F14 (Difficulty) ────────────────────────────── standalone
F15 (Stats) ─────────────── depends on F11 (shared stat tracking)
F16 (Endless mode) ──────── depends on F3 (power-ups)
F17 (Time Attack) ───────── depends on F3 (power-ups)
F18 (Daily challenge) ───── depends on F20 (server leaderboard)
F19 (Challenges) ────────── depends on F5 (boss rush challenge)
F20 (Online leaderboard) ── standalone (server work)
F21 (Share card) ────────── standalone
F22 (Cosmetics) ─────────── depends on F6 (particles), F11 (unlock conditions)
F23 (Ghost replay) ──────── standalone
F24 (Accessibility) ─────── standalone
```

**Recommended implementation order:**

1. **Sprint 1 (Foundation):** F1, F2, F10, F9 — Quick wins that dramatically improve feel
2. **Sprint 2 (Core Gameplay):** F3, F4, F6 — Transform the gameplay loop
3. **Sprint 3 (Bosses):** F5, F8 — Major content addition
4. **Sprint 4 (Audio):** F7, F14 — Audio layer and difficulty
5. **Sprint 5 (Progression):** F11, F12, F15 — Retention systems
6. **Sprint 6 (Content):** F13, F16, F17, F19 — Ships and modes
7. **Sprint 7 (Platform):** F20, F21, F24 — Server and accessibility
8. **Sprint 8 (Meta):** F18, F22, F23 — Daily challenges, cosmetics, ghost

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average session length | >8 minutes | Stats tracking (F15) |
| Return rate (daily) | >30% of players return next day | Daily challenge participation (F18) |
| Wave reached (median) | Wave 6–8 on Veteran | Stats tracking (F15) |
| Achievement unlock rate | >60% of players unlock 5+ achievements | Achievement tracking (F11) |
| Leaderboard participation | >50% of players submit at least one score | Server analytics (F20) |
| Share rate | >10% of game-over screens result in a share | Share button click tracking (F21) |

---

## 12. Out of Scope (For Now)

The following ideas were considered but deferred for a potential future version:

- **Multiplayer / Co-op** — Significant networking complexity; revisit after single-player is polished
- **Seasonal Events** — Requires ongoing content commitment; revisit after player base is established
- **User Accounts** — Adds complexity for minimal benefit over initials + localStorage
- **Mobile App Wrapper** — PWA features may suffice; evaluate after web version is mature
- **Level Editor** — Interesting but low priority vs. core gameplay
- **Procedural alien types** — Risk of unbalanced encounters; hand-crafted content is safer
- **Virtual joystick** — Current zone-based touch controls are sufficient for the retro audience; revisit based on mobile feedback

---

*End of document.*
