import { CollisionGroup, CollisionGroupManager } from 'excalibur';

// Base groups — assigned to "target" actors
export const PlayerGroup = CollisionGroupManager.create('player');
export const AlienGroup = CollisionGroupManager.create('alien');
export const ShieldGroup = CollisionGroupManager.create('shield');

// Derived groups — assigned to actors needing filtered collisions
// Player bullets collide with aliens and shields
export const PlayerBulletCollisionGroup = CollisionGroup.collidesWith([AlienGroup, ShieldGroup]);
// Alien bullets collide with the player and shields
export const AlienBulletCollisionGroup = CollisionGroup.collidesWith([PlayerGroup, ShieldGroup]);
