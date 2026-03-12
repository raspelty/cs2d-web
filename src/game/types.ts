export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vec2;
  angle: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  speed: number;
  radius: number;
  weapon: Weapon;
  primaryWeapon: Weapon | null;
  secondaryWeapon: Weapon | null;
  knife: Weapon;
  activeSlot: 'primary' | 'secondary' | 'knife';
  alive: boolean;
  reloadTimer: number;
  shootCooldown: number;
  money: number;
  shotsFired: number;
  lastShotTime: number;
  recoilAngle: number;
  isMoving: boolean;
  team: 'ct' | 't';
  inspecting: boolean;
  inspectTimer: number;
  isCrouching: boolean;
  isJumping: boolean;
  jumpTimer: number;
}

export interface Ally {
  id: number;
  pos: Vec2;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  radius: number;
  alive: boolean;
  shootCooldown: number;
  patrolTarget: Vec2;
  alertTimer: number;
  lastKnownEnemyPos: Vec2 | null;
  state: 'patrol' | 'alert' | 'chase';
}

export interface Enemy {
  id: number;
  pos: Vec2;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  radius: number;
  alive: boolean;
  shootCooldown: number;
  patrolTarget: Vec2;
  alertTimer: number;
  lastKnownPlayerPos: Vec2 | null;
  state: 'patrol' | 'alert' | 'chase';
}

export interface Bullet {
  start: Vec2;
  end: Vec2;
  time: number;
  isEnemy: boolean;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface KillFeedEntry {
  killer: string;
  victim: string;
  weapon: string;
  time: number;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  spread: number;
  automatic: boolean;
}

export interface GameMap {
  walls: Wall[];
  spawnPoints: Vec2[];
  enemySpawns: Vec2[];
  width: number;
  height: number;
  bombSites: { pos: Vec2; label: string; radius: number }[];
}
