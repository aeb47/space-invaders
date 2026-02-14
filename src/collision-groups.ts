import { CollisionGroup, CollisionGroupManager } from 'excalibur';

// Base groups — assigned to "target" actors
export const PlayerGroup = CollisionGroupManager.create('player');
export const AlienGroup = CollisionGroupManager.create('alien');

// Derived groups — assigned to actors needing filtered collisions
// Player bullets only collide with aliens (not player, not other bullets)
export const PlayerBulletCollisionGroup = CollisionGroup.collidesWith([AlienGroup]);
// Alien bullets only collide with the player (not aliens, not other bullets)
export const AlienBulletCollisionGroup = CollisionGroup.collidesWith([PlayerGroup]);
