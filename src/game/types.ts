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
  activeSlot: 'primary' | 'secondary' | 'knife' | 'grenade' | 'equipment';
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
  isScoped: boolean;
  hasBomb: boolean;
  skin?: SkinData;
  equipment: PlayerEquipment;
  selectedGrenade: GrenadeType;
  throwPower: number;
  isThrowing: boolean;
  throwTimer: number;
  respawnTimer: number;
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
  state: 'patrol' | 'alert' | 'chase' | 'retreat' | 'defending';
  name: string;
  isDefusing?: boolean;
  defuseTimer?: number;
  equipment?: PlayerEquipment;
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
  lastKnownBombPos: Vec2 | null;
  state: 'patrol' | 'alert' | 'chase' | 'defending' | 'searching' | 'retreat';
  path?: Vec2[];
  isDefusing?: boolean;
  defuseTimer?: number;
  equipment?: PlayerEquipment;
  stuckTimer?: number;
  lastPos?: Vec2;
  pathUpdateTimer?: number;
  investigateTimer?: number;
  idleTimer?: number;
}

export interface Bullet {
  start: Vec2;
  end: Vec2;
  time: number;
  isEnemy: boolean;
  isHeadshot?: boolean;
  damage?: number;
}

export type GrenadeType = 'he' | 'flash' | 'smoke' | 'molotov' | 'decoy';

export interface Grenade {
  id: string;
  type: GrenadeType;
  pos: Vec2;
  vel: Vec2;
  angle: number;
  fuse: number;
  exploded: boolean;
  owner: 'player' | 'ally' | 'enemy';
  ownerId?: number;
  radius: number;
  damage?: number;
  flashDuration?: number;
  smokeDuration?: number;
  smokeParticles?: SmokeParticle[];
  flameParticles?: FlameParticle[];
}

export interface SmokeParticle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  size: number;
}

export interface FlameParticle {
  pos: Vec2;
  life: number;
  damage: number;
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
  headshot?: boolean;
  grenade?: boolean;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
  jumpable?: boolean;
  texture?: 'concrete' | 'metal' | 'wood' | 'brick';
  bulletproof?: boolean;
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
  skin?: SkinData;
  type?: string;
}

export interface GameMap {
  walls: Wall[];
  spawnPoints: Vec2[];
  enemySpawns: Vec2[];
  bombSites: { pos: Vec2; label: string; radius: number }[];
  hostageZones?: { pos: Vec2; rescued: boolean }[];
  width: number;
  height: number;
  name: string;
  groundTexture?: 'dust' | 'concrete' | 'grass' | 'tile';
  props?: Prop[];
  ambientSound?: string;
}

export interface Prop {
  pos: Vec2;
  type: 'box' | 'barrel' | 'car' | 'dumpster' | 'pallet' | 'tire' | 'van' | 'cover';
  width: number;
  height: number;
  destructible?: boolean;
  health?: number;
}

export interface Bomb {
  pos: Vec2;
  isPlanted: boolean;
  isDefused: boolean;
  plantedTime: number;
  defuseTime: number;
  plantedBy: 't' | 'ct';
  site?: string;
  defusingPlayer?: 'player' | 'ally' | 'enemy';
  defuseStartTime?: number;
  beepInterval?: number;
  lastBeep?: number;
}

export interface PlayerEquipment {
  armor: number;
  helmet: boolean;
  hasDefuse: boolean;
  hasZeus: boolean;
  grenades: {
    he: number;
    flash: number;
    smoke: number;
    molotov: number;
    decoy: number;
  };
}

export interface Settings {
  volume: number;
  musicVolume: number;
  sensitivity: number;
  crosshairColor: string;
  crosshairSize: number;
  crosshairStyle: 'default' | 'dot' | 'cross' | 'circle';
  showFPS: boolean;
  showKillFeed: boolean;
  showMinimap: boolean;
  showDamage: boolean;
  showImpactMarkers: boolean;
  mouseInvert: boolean;
  showBlood: boolean;
  showGrenadeTrajectory: boolean;
  autoSwitchGrenade: boolean;
  quickSwitch: boolean;
}

export interface LeaderboardEntry {
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  money: number;
  team: 'ct' | 't';
  isPlayer: boolean;
  ping: number;
  alive: boolean;
  armor: number;
  equipment: string;
}

export interface SkinData {
  name: string;
  weapon: string;
  rarity: string;
  collection: string;
  url: string;
  price?: { min: number; max: number };
  pattern?: string;
  wear?: 'FN' | 'MW' | 'FT' | 'WW' | 'BS';
}

export interface GameMode {
  name: string;
  type: 'casual' | 'deathmatch' | 'competitive' | 'armsrace' | 'demolition' | 'zombie' | 'hostage';
  maxRounds?: number;
  maxScore?: number;
  respawn: boolean;
  respawnTime?: number;
  teamSwitch?: boolean;
  description: string;
  infiniteMoney?: boolean;
}

export interface GameState {
  // Game objects
  player: Player;
  enemies: Enemy[];
  allies: Ally[];
  bullets: Bullet[];
  grenades: Grenade[];
  particles: Particle[];
  bloodDecals: { pos: Vec2; alpha: number }[];
  killFeed: KillFeedEntry[];
  
  // Input
  keys: Set<string>;
  mousePos: Vec2;
  mouseDown: boolean;
  mouseRightDown: boolean;
  
  // Camera
  camera: Vec2;
  
  // Round state
  roundTime: number;
  roundStatus: 'playing' | 'won' | 'lost' | 'freezetime' | 'bomb_planted' | 'bomb_defused' | 'bomb_exploded';
  score: { kills: number; deaths: number; assists: number };
  
  // Game flow
  gamePhase: 'menu' | 'playing' | 'skinSelect' | 'settings' | 'scoreboard';
  hoveredButton: string | null;
  
  // IDs
  nextEnemyId: number;
  nextGrenadeId: number;
  
  // Buy menu
  buyMenuOpen: boolean;
  buyMenuCategory: number;
  buyMenuSelection: number;
  
  // Timers
  freezeTimer: number;
  roundEndTimer: number;
  respawnTimer: number;
  
  // Teams
  playerTeam: 'ct' | 't';
  currentRound: number;
  maxRounds: number;
  roundsWon: number;
  roundsLost: number;
  matchOver: boolean;
  
  // Counts
  enemyCount: number;
  allyCount: number;
  
  // Spectator
  spectatingIndex: number;
  spectatingMode: 'free' | 'follow' | 'firstperson';
  
  // Map
  selectedMapIndex: number;
  currentMap: GameMap;
  currentMode: GameMode | null;
  
  // Navigation
  navMesh: any; // Would be NavigationMesh type
  enemyPaths: Map<number, Vec2[]>;
  
  // Skins
  playerSkins: Map<string, SkinData>;
  
  // Effects
  hitMarkers: { pos: Vec2; time: number; headshot: boolean; damage: number }[];
  damageIndicators: { pos: Vec2; damage: number; time: number; isEnemy: boolean }[];
  
  // Bomb
  bomb: Bomb | null;
  isPlanting: boolean;
  plantTimer: number;
  isDefusing: boolean;
  defuseTimer: number;
  
  // Settings & UI
  settings: Settings;
  showLeaderboard: boolean;
  showSettings: boolean;
  showPauseMenu: boolean;
  showScoreboard: boolean;
  fps: number;
  
  // Stats
  lastHitTime: number;
  hitAssists: Map<number, number>;
  roundKills: number;
  roundDamage: number;
  matchKills: number;
  matchDeaths: number;
  matchAssists: number;
}
