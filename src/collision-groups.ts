import { CollisionGroup, CollisionGroupManager } from 'excalibur';

const PlayerGroup = CollisionGroupManager.create('player');
const AlienGroup = CollisionGroupManager.create('alien');
const PlayerBulletGroup = CollisionGroupManager.create('playerBullet');
const AlienBulletGroup = CollisionGroupManager.create('alienBullet');

export const PlayerCollisionGroup = CollisionGroup.collidesWith([AlienBulletGroup]);
export const AlienCollisionGroup = CollisionGroup.collidesWith([PlayerBulletGroup]);
export const PlayerBulletCollisionGroup = CollisionGroup.collidesWith([AlienGroup]);
export const AlienBulletCollisionGroup = CollisionGroup.collidesWith([PlayerGroup]);
