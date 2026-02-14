# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Space Invaders — a browser-based game built with Excalibur.js, TypeScript, and Vite.

## Commands

- **Dev server**: `npm run dev` (Vite dev server with HMR)
- **Build**: `npm run build` (Vite client build + TypeScript server compile)
- **Preview**: `npm run preview` (Vite preview of production build)
- **Start**: `npm start` (Express production server on port 3000)

## Architecture

- **Engine**: Excalibur.js 2D game engine with TypeScript
- **Build**: Vite for client bundling, separate tsconfig for Express server
- **Deployment**: Express serves static files from `dist/public/`, designed for Railway

### File Structure

- `src/main.ts` — Engine initialization, scene registration
- `src/config.ts` — All game constants (speeds, grid size, scoring)
- `src/collision-groups.ts` — Centralized collision group definitions
- `src/actors/player.ts` — Player actor with movement and shooting
- `src/actors/bullet.ts` — Bullet actor (player and alien variants)
- `src/actors/alien.ts` — Alien actor with type/color/points
- `src/actors/alien-grid.ts` — Grid formation, movement stepping, alien shooting
- `src/scenes/game.ts` — Main game scene: HUD, collisions, scoring, wave progression, game over
- `src/resources.ts` — Sprite sheet loading
- `server.ts` — Express production server
