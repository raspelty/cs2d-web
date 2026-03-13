import { Player, Enemy, Ally, Bullet, Particle, KillFeedEntry, Vec2, Bomb, Settings, LeaderboardEntry, SkinData } from './types';
import { MAPS, dust2Map } from './map';
import { WEAPONS, weaponDefToWeapon, WeaponDef } from './weapons';
import { distance, circleRectCollision, raycast, hasLineOfSight, normalize } from './utils';
import { GameMap } from './types';
import { NavigationMesh } from './navigation';

export interface GameState {
  // Game objects
  player: Player;
  enemies: Enemy[];
  allies: Ally[];
  bullets: Bullet[];
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
  gamePhase: 'menu' | 'playing' | 'skinSelect' | 'settings';
  hoveredButton: string | null;
  
  // IDs
  nextEnemyId: number;
  
  // Buy menu
  buyMenuOpen: boolean;
  buyMenuCategory: number;
  buyMenuSelection: number;
  
  // Timers
  freezeTimer: number;
  roundEndTimer: number;
  
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
  
  // Navigation
  navMesh: NavigationMesh | null;
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

const ALLY_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India'];
const BASE_SPEED = 130;
const KNIFE_SPEED_BONUS = 1.15;
const CROUCH_SPEED_MULT = 0.4;

export function createInitialState(): GameState {
  const settings: Settings = {
    volume: 0.7,
    musicVolume: 0.5,
    sensitivity: 1.0,
    crosshairColor: '#00FF00',
    crosshairSize: 1.0,
    crosshairStyle: 'default',
    showFPS: false,
    showKillFeed: true,
    showMinimap: true,
    showDamage: true,
    showImpactMarkers: true,
    mouseInvert: false,
    showBlood: true,
  };

  return {
    player: createPlayer('t', dust2Map),
    enemies: [],
    allies: [],
    bullets: [],
    particles: [],
    bloodDecals: [],
    killFeed: [],
    keys: new Set(),
    mousePos: { x: 0, y: 0 },
    mouseDown: false,
    mouseRightDown: false,
    camera: { x: 0, y: 0 },
    roundTime: 115,
    roundStatus: 'playing',
    score: { kills: 0, deaths: 0, assists: 0 },
    gamePhase: 'menu',
    hoveredButton: null,
    nextEnemyId: 0,
    buyMenuOpen: false,
    buyMenuCategory: 0,
    buyMenuSelection: 0,
    freezeTimer: 0,
    roundEndTimer: 0,
    playerTeam: 't',
    currentRound: 0,
    maxRounds: 5,
    roundsWon: 0,
    roundsLost: 0,
    matchOver: false,
    enemyCount: 5,
    allyCount: 3,
    spectatingIndex: -1,
    spectatingMode: 'follow',
    selectedMapIndex: 0,
    currentMap: dust2Map,
    navMesh: null,
    enemyPaths: new Map(),
    playerSkins: new Map(),
    hitMarkers: [],
    damageIndicators: [],
    bomb: null,
    isPlanting: false,
    plantTimer: 0,
    isDefusing: false,
    defuseTimer: 0,
    settings,
    showLeaderboard: false,
    showSettings: false,
    showPauseMenu: false,
    showScoreboard: false,
    fps: 0,
    lastHitTime: 0,
    hitAssists: new Map(),
    roundKills: 0,
    roundDamage: 0,
    matchKills: 0,
    matchDeaths: 0,
    matchAssists: 0,
  };
}

function createPlayer(team: 'ct' | 't', map: GameMap, money?: number): Player {
  const pistolId = team === 't' ? 'glock' : 'usp';
  const pistolDef = WEAPONS[pistolId];
  const pistolWp = weaponDefToWeapon(pistolDef);
  const knifeWp = weaponDefToWeapon(WEAPONS.knife);
  return {
    pos: { ...map.spawnPoints[0] },
    angle: 0,
    health: 100,
    maxHealth: 100,
    ammo: pistolWp.ammo,
    maxAmmo: pistolWp.maxAmmo,
    reserveAmmo: pistolWp.reserveAmmo,
    speed: BASE_SPEED,
    radius: 12,
    weapon: pistolWp,
    primaryWeapon: null,
    secondaryWeapon: pistolWp,
    knife: knifeWp,
    activeSlot: 'secondary',
    alive: true,
    reloadTimer: 0,
    shootCooldown: 0,
    money: money ?? 800,
    shotsFired: 0,
    lastShotTime: 0,
    recoilAngle: 0,
    isMoving: false,
    team,
    inspecting: false,
    inspectTimer: 0,
    isCrouching: false,
    isJumping: false,
    jumpTimer: 0,
    isScoped: false,
    hasBomb: team === 't', // T side starts with bomb
  };
}

function createEnemy(id: number, pos: Vec2, map: GameMap): Enemy {
  return {
    id,
    pos: { ...pos },
    angle: Math.random() * Math.PI * 2,
    health: 100,
    maxHealth: 100,
    speed: 110 + Math.random() * 20,
    radius: 12,
    alive: true,
    shootCooldown: 0,
    patrolTarget: { x: pos.x + (Math.random() - 0.5) * 200, y: pos.y + (Math.random() - 0.5) * 200 },
    alertTimer: 0,
    lastKnownPlayerPos: null,
    lastKnownBombPos: null,
    state: 'patrol',
    path: [],
    isDefusing: false,
    defuseTimer: 0,
  };
}

function createAlly(id: number, pos: Vec2, map: GameMap): Ally {
  return {
    id,
    pos: { ...pos },
    angle: Math.random() * Math.PI * 2,
    health: 100,
    maxHealth: 100,
    speed: 110,
    radius: 12,
    alive: true,
    shootCooldown: 0,
    patrolTarget: randomPointInMap(map.width, map.height, map.walls, 12),
    alertTimer: 0,
    lastKnownEnemyPos: null,
    state: 'patrol',
    name: ALLY_NAMES[id % ALLY_NAMES.length],
    isDefusing: false,
    defuseTimer: 0,
  };
}

export function startRound(state: GameState) {
  const map = state.currentMap;
  const carryMoney = state.currentRound === 0 ? 800 : state.player.money;
  state.player = createPlayer(state.playerTeam, map, carryMoney);
  state.player.hasBomb = state.playerTeam === 't'; // Give bomb to T side
  
  // Apply skins
  if (state.playerSkins.size > 0) {
    applyPlayerSkins(state);
  }
  
  state.bullets = [];
  state.particles = [];
  state.bloodDecals = [];
  state.hitMarkers = [];
  state.damageIndicators = [];
  state.roundTime = 115;
  state.roundStatus = 'freezetime';
  state.freezeTimer = 5;
  state.enemies = [];
  state.allies = [];
  state.nextEnemyId = 0;
  state.buyMenuOpen = false;
  state.roundEndTimer = 0;
  state.spectatingIndex = -1;
  state.currentRound++;
  state.enemyPaths.clear();
  state.bomb = null;
  state.isPlanting = false;
  state.isDefusing = false;
  state.roundKills = 0;
  state.roundDamage = 0;
  state.hitAssists.clear();

  // Create navigation mesh
  state.navMesh = new NavigationMesh(map.width, map.height, map.walls);

  // Spawn enemies
  for (let i = 0; i < state.enemyCount; i++) {
    const spawnIdx = i % map.enemySpawns.length;
    const baseSpawn = map.enemySpawns[spawnIdx];
    
    let attempts = 0;
    let validPos = { ...baseSpawn };
    while (attempts < 20) {
      const testPos = {
        x: baseSpawn.x + (Math.random() - 0.5) * 150,
        y: baseSpawn.y + (Math.random() - 0.5) * 150
      };
      let valid = true;
      for (const wall of map.walls) {
        if (circleRectCollision(testPos.x, testPos.y, 12, wall.x, wall.y, wall.w, wall.h)) {
          valid = false;
          break;
        }
      }
      if (valid) {
        validPos = testPos;
        break;
      }
      attempts++;
    }
    
    state.enemies.push(createEnemy(state.nextEnemyId++, validPos, map));
  }

  // Spawn allies
  const playerSpawn = map.spawnPoints[0];
  for (let i = 0; i < state.allyCount; i++) {
    const offset = {
      x: playerSpawn.x + 40 + Math.random() * 80,
      y: playerSpawn.y - 80 + i * 60 + Math.random() * 40,
    };
    state.allies.push(createAlly(100 + i, offset, map));
  }
}

function applyPlayerSkins(state: GameState) {
  if (state.player.primaryWeapon) {
    const skin = state.playerSkins.get(state.player.primaryWeapon.id);
    if (skin) state.player.primaryWeapon.skin = skin;
  }
  const skin = state.playerSkins.get(state.player.secondaryWeapon.id);
  if (skin) state.player.secondaryWeapon.skin = skin;
}

export function startNewMatch(state: GameState) {
  state.currentMap = MAPS[state.selectedMapIndex];
  state.currentRound = 0;
  state.roundsWon = 0;
  state.roundsLost = 0;
  state.matchOver = false;
  state.score = { kills: 0, deaths: 0, assists: 0 };
  state.matchKills = 0;
  state.matchDeaths = 0;
  state.matchAssists = 0;
  state.killFeed = [];
  startRound(state);
}

export function buyWeapon(state: GameState, weaponId: string): boolean {
  const def = WEAPONS[weaponId];
  if (!def) return false;
  if (state.player.money < def.price) return false;
  if (def.side !== 'both' && def.side !== state.playerTeam) return false;

  state.player.money -= def.price;
  const wp = weaponDefToWeapon(def);
  
  const skin = state.playerSkins.get(weaponId);
  if (skin) wp.skin = skin;

  if (def.type === 'pistol') {
    state.player.secondaryWeapon = wp;
    if (state.player.activeSlot === 'secondary') switchToSlot(state.player, 'secondary');
  } else if (def.type !== 'knife') {
    state.player.primaryWeapon = wp;
    switchToSlot(state.player, 'primary');
  }
  return true;
}

function switchToSlot(player: Player, slot: 'primary' | 'secondary' | 'knife') {
  let wp;
  if (slot === 'primary' && player.primaryWeapon) wp = player.primaryWeapon;
  else if (slot === 'secondary' && player.secondaryWeapon) wp = player.secondaryWeapon;
  else if (slot === 'knife') wp = player.knife;
  else return;

  player.activeSlot = slot;
  player.weapon = wp;
  player.ammo = wp.ammo;
  player.maxAmmo = wp.maxAmmo;
  player.reserveAmmo = wp.reserveAmmo;
  player.shotsFired = 0;
  player.recoilAngle = 0;
  player.reloadTimer = 0;
  player.shootCooldown = 0.3;
  player.isScoped = false;
}

export function switchWeaponSlot(player: Player, slot: 'primary' | 'secondary' | 'knife') {
  if (player.activeSlot === 'primary' && player.primaryWeapon) {
    player.primaryWeapon.ammo = player.ammo;
    player.primaryWeapon.reserveAmmo = player.reserveAmmo;
  } else if (player.activeSlot === 'secondary' && player.secondaryWeapon) {
    player.secondaryWeapon.ammo = player.ammo;
    player.secondaryWeapon.reserveAmmo = player.reserveAmmo;
  }
  switchToSlot(player, slot);
}

function getCameraTarget(state: GameState): Vec2 {
  if (state.player.alive) return state.player.pos;
  
  // Spectator mode
  if (state.spectatingMode === 'free') {
    return state.camera;
  }
  
  const aliveAllies = state.allies.filter(a => a.alive);
  const aliveEnemies = state.enemies.filter(e => e.alive);
  
  if (aliveAllies.length > 0) {
    const idx = Math.max(0, Math.min(state.spectatingIndex, aliveAllies.length - 1));
    return aliveAllies[idx].pos;
  } else if (aliveEnemies.length > 0) {
    const idx = Math.max(0, Math.min(state.spectatingIndex, aliveEnemies.length - 1));
    return aliveEnemies[idx].pos;
  }
  
  return state.player.pos;
}

export function cycleSpectator(state: GameState, direction: number) {
  const aliveAllies = state.allies.filter(a => a.alive);
  const aliveEnemies = state.enemies.filter(e => e.alive);
  const totalAlive = aliveAllies.length + aliveEnemies.length;
  
  if (totalAlive === 0) return;
  
  state.spectatingIndex = (state.spectatingIndex + direction + totalAlive) % totalAlive;
}

export function getSpectatorTarget(state: GameState): { pos: Vec2; name: string; team: 'ally' | 'enemy' } | null {
  const aliveAllies = state.allies.filter(a => a.alive);
  const aliveEnemies = state.enemies.filter(e => e.alive);
  const allAlive = [...aliveAllies, ...aliveEnemies];
  
  if (allAlive.length === 0) return null;
  
  const idx = Math.min(state.spectatingIndex, allAlive.length - 1);
  const target = allAlive[idx];
  
  if ('name' in target) {
    return { pos: target.pos, name: target.name, team: 'ally' };
  } else {
    return { pos: target.pos, name: `Enemy ${target.id}`, team: 'enemy' };
  }
}

export function startPlanting(state: GameState) {
  if (!state.player.alive || state.bomb || state.roundStatus !== 'playing') return;
  if (!state.player.hasBomb) return;
  
  // Check if on a bombsite
  const onBombsite = state.currentMap.bombSites.some(site => 
    distance(state.player.pos, site.pos) < site.radius
  );
  
  if (onBombsite && state.player.team === 't') {
    state.isPlanting = true;
    state.plantTimer = 3.5; // 3.5 second plant time
    
    // Alert nearby enemies
    for (const enemy of state.enemies) {
      if (enemy.alive && distance(enemy.pos, state.player.pos) < 800) {
        enemy.state = 'chase';
        enemy.lastKnownPlayerPos = { ...state.player.pos };
        enemy.alertTimer = 10;
      }
    }
  }
}

export function startDefusing(state: GameState) {
  if (!state.player.alive || !state.bomb || !state.bomb.isPlanted || state.bomb.isDefused) return;
  if (state.player.team !== 'ct') return;
  
  // Check if near bomb
  if (distance(state.player.pos, state.bomb.pos) < 50) {
    state.isDefusing = true;
    state.defuseTimer = 5; // 5 second defuse time (3.5 with kit)
  }
}

function updateBomb(state: GameState, dt: number) {
  const map = state.currentMap;
  
  // Planting
  if (state.isPlanting) {
    state.plantTimer -= dt;
    
    // Cancel if player moves, dies, or switches weapon
    if (!state.player.alive || state.player.isMoving || state.player.activeSlot === 'knife' || state.player.reloadTimer > 0) {
      state.isPlanting = false;
      state.plantTimer = 0;
    }
    
    if (state.plantTimer <= 0) {
      // Plant the bomb
      const site = map.bombSites.find(s => distance(state.player.pos, s.pos) < s.radius);
      state.bomb = {
        pos: { ...state.player.pos },
        isPlanted: true,
        isDefused: false,
        plantedTime: Date.now() / 1000,
        defuseTime: 0,
        plantedBy: 't',
        site: site?.label
      };
      state.isPlanting = false;
      state.player.hasBomb = false;
      state.roundStatus = 'bomb_planted';
      
      // Alert all enemies
      for (const enemy of state.enemies) {
        if (enemy.alive) {
          enemy.state = 'chase';
          enemy.lastKnownBombPos = { ...state.bomb.pos };
          enemy.alertTimer = 999; // Permanent until bomb is resolved
        }
      }
      
      // Add to kill feed
      state.killFeed.push({
        killer: 'BOMB',
        victim: 'has been planted',
        weapon: '💣',
        time: Date.now()
      });
    }
  }
  
  // Defusing
  if (state.isDefusing) {
    state.defuseTimer -= dt;
    
    // Cancel if player moves or dies
    if (!state.player.alive || state.player.isMoving) {
      state.isDefusing = false;
      state.defuseTimer = 0;
    }
    
    if (state.defuseTimer <= 0 && state.bomb && !state.bomb.isDefused) {
      state.bomb.isDefused = true;
      state.bomb.defuseTime = Date.now() / 1000;
      state.isDefusing = false;
      state.roundStatus = 'bomb_defused';
      
      // CT win
      state.roundStatus = 'won';
      state.roundsWon++;
      state.player.money += 3250;
      state.roundEndTimer = 3;
      
      // Add to kill feed
      state.killFeed.push({
        killer: 'YOU',
        victim: 'defused the bomb',
        weapon: '🔧',
        time: Date.now()
      });
    }
  }
  
  // Bomb timer (40 seconds)
  if (state.bomb && state.bomb.isPlanted && !state.bomb.isDefused) {
    const timeSincePlant = (Date.now() / 1000) - state.bomb.plantedTime;
    if (timeSincePlant > 40) {
      // Bomb explodes - T win
      state.bomb = null;
      state.roundStatus = 'bomb_exploded';
      state.roundStatus = 'lost';
      state.roundsLost++;
      state.player.money += 1400;
      state.roundEndTimer = 3;
      
      // Add to kill feed
      state.killFeed.push({
        killer: '💣',
        victim: 'BOMB EXPLODED',
        weapon: '💥',
        time: Date.now()
      });
    }
  }
  
  // Enemy defusing logic
  if (state.bomb && state.bomb.isPlanted && !state.bomb.isDefused && state.player.team === 't') {
    for (const enemy of state.enemies) {
      if (!enemy.alive || enemy.isDefusing) continue;
      
      // Check if enemy is near bomb
      if (distance(enemy.pos, state.bomb.pos) < 50) {
        enemy.isDefusing = true;
        enemy.defuseTimer = 7; // Enemies take longer to defuse
      }
    }
  }
  
  // Update enemy defusing
  for (const enemy of state.enemies) {
    if (enemy.isDefusing) {
      enemy.defuseTimer = (enemy.defuseTimer || 0) - dt;
      
      // Stop defusing if they move
      if (enemy.isDefusing && enemy.state === 'chase') {
        enemy.isDefusing = false;
        enemy.defuseTimer = 0;
      }
      
      if (enemy.defuseTimer && enemy.defuseTimer <= 0 && state.bomb && !state.bomb.isDefused) {
        state.bomb.isDefused = true;
        state.roundStatus = 'lost';
        state.roundsLost++;
        state.roundEndTimer = 3;
        
        state.killFeed.push({
          killer: `ENEMY_${enemy.id}`,
          victim: 'defused the bomb',
          weapon: '🔧',
          time: Date.now()
        });
      }
    }
  }
}

export function update(state: GameState, dt: number) {
  if (state.gamePhase !== 'playing') return;
  
  const map = state.currentMap;

  // Update hit markers
  state.hitMarkers = state.hitMarkers.filter(h => Date.now() - h.time < 800);
  state.damageIndicators = state.damageIndicators.filter(d => Date.now() - d.time < 1000);

  // Update bomb
  updateBomb(state, dt);

  if (state.roundEndTimer > 0) {
    state.roundEndTimer -= dt;
    updateCamera(state);
    if (state.roundEndTimer <= 0) {
      if (state.currentRound >= state.maxRounds || state.roundsWon >= 3 || state.roundsLost >= 3) {
        state.matchOver = true;
      } else {
        startRound(state);
      }
    }
    return;
  }

  if (state.roundStatus === 'freezetime') {
    state.freezeTimer -= dt;
    updateCamera(state);
    if (state.freezeTimer <= 0) state.roundStatus = 'playing';
    return;
  }

  if (state.roundStatus !== 'playing' && state.roundStatus !== 'bomb_planted') return;

  updatePlayer(state, dt);
  updateEnemies(state, dt);
  updateAllies(state, dt);
  updateBullets(state, dt);
  updateParticles(state, dt);
  updateBloodDecals(state, dt);
  updateCamera(state);

  state.roundTime -= dt;

  // Check win conditions
  const allEnemiesDead = state.enemies.every(e => !e.alive);
  const allAlliesDead = !state.player.alive && state.allies.every(a => !a.alive);
  const tWinByElimination = allEnemiesDead && state.playerTeam === 't';
  const ctWinByElimination = allAlliesDead && state.playerTeam === 'ct';

  if (tWinByElimination || ctWinByElimination) {
    if (tWinByElimination) {
      state.roundStatus = 'won';
      state.roundsWon++;
      state.player.money += 3250;
    } else {
      state.roundStatus = 'lost';
      state.roundsLost++;
      state.player.money += 1400;
    }
    state.roundEndTimer = 3;
  } else if (state.roundTime <= 0) {
    // Time ran out
    if (state.playerTeam === 'ct') {
      // CT win if bomb not planted
      if (!state.bomb || !state.bomb.isPlanted) {
        state.roundStatus = 'won';
        state.roundsWon++;
        state.player.money += 3250;
      } else {
        state.roundStatus = 'lost';
        state.roundsLost++;
        state.player.money += 1400;
      }
    } else {
      // T win if bomb not planted
      if (!state.bomb || !state.bomb.isPlanted) {
        state.roundStatus = 'lost';
        state.roundsLost++;
        state.player.money += 1400;
      } else {
        state.roundStatus = 'won';
        state.roundsWon++;
        state.player.money += 3250;
      }
    }
    state.roundEndTimer = 3;
  }
}

function updatePlayer(state: GameState, dt: number) {
  const { player, keys } = state;
  const map = state.currentMap;
  
  if (!player.alive) {
    // Spectator mode
    if (state.spectatingIndex < 0) {
      const aliveAllies = state.allies.filter(a => a.alive);
      const aliveEnemies = state.enemies.filter(e => e.alive);
      if (aliveAllies.length > 0 || aliveEnemies.length > 0) state.spectatingIndex = 0;
    }
    return;
  }
  
  if (state.buyMenuOpen) return;

  // Animation timers
  if (player.inspecting) {
    player.inspectTimer -= dt;
    if (player.inspectTimer <= 0) player.inspecting = false;
  }

  if (player.isJumping) {
    player.jumpTimer -= dt;
    if (player.jumpTimer <= 0) player.isJumping = false;
  }

  player.isCrouching = keys.has('control') || keys.has('shift');

  // Movement
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy = -1;
  if (keys.has('s') || keys.has('arrowdown')) dy = 1;
  if (keys.has('a') || keys.has('arrowleft')) dx = -1;
  if (keys.has('d') || keys.has('arrowright')) dx = 1;

  player.isMoving = dx !== 0 || dy !== 0;

  const weaponDef = WEAPONS[player.weapon.id];
  let moveMultiplier = weaponDef ? weaponDef.movementSpeed : 1;
  if (player.activeSlot === 'knife') moveMultiplier = KNIFE_SPEED_BONUS;
  if (player.isCrouching) moveMultiplier *= CROUCH_SPEED_MULT;
  if (player.isScoped) moveMultiplier *= 0.5;

  if (player.isMoving) {
    const dir = normalize({ x: dx, y: dy });
    const speed = player.speed * moveMultiplier;
    const newX = player.pos.x + dir.x * speed * dt;
    const newY = player.pos.y + dir.y * speed * dt;

    let canX = true, canY = true;
    for (const wall of map.walls) {
      if (circleRectCollision(newX, player.pos.y, player.radius, wall.x, wall.y, wall.w, wall.h)) canX = false;
      if (circleRectCollision(player.pos.x, newY, player.radius, wall.x, wall.y, wall.w, wall.h)) canY = false;
    }
    if (canX) player.pos.x = newX;
    if (canY) player.pos.y = newY;
    player.pos.x = Math.max(player.radius, Math.min(map.width - player.radius, player.pos.x));
    player.pos.y = Math.max(player.radius, Math.min(map.height - player.radius, player.pos.y));

    if (player.isScoped && player.isMoving) player.isScoped = false;
  }

  // Aim with sensitivity
  const targetAngle = Math.atan2(
    (state.mousePos.y + state.camera.y) - player.pos.y,
    (state.mousePos.x + state.camera.x) - player.pos.x
  );
  
  // Smooth aiming
  let angleDiff = targetAngle - player.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  player.angle += angleDiff * Math.min(1, dt * 15);

  // Recoil recovery
  const now = performance.now() / 1000;
  const timeSinceShot = now - player.lastShotTime;
  if (timeSinceShot > 0.1 && player.recoilAngle > 0) {
    const recovery = weaponDef ? weaponDef.recoilRecovery : 5;
    player.recoilAngle = Math.max(0, player.recoilAngle - recovery * dt * 0.02);
    if (player.recoilAngle < 0.001) { 
      player.shotsFired = 0; 
      player.recoilAngle = 0; 
    }
  }

  // Reload
  if (player.reloadTimer > 0) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      const needed = player.maxAmmo - player.ammo;
      const available = Math.min(needed, player.reserveAmmo);
      player.ammo += available;
      player.reserveAmmo -= available;
    }
    return;
  }

  if (keys.has('r') && player.ammo < player.maxAmmo && player.reserveAmmo > 0 && player.weapon.id !== 'knife') {
    const reloadTime = weaponDef ? weaponDef.reloadTime : 2;
    player.reloadTimer = reloadTime;
    player.isScoped = false;
  }

  // Shoot
  player.shootCooldown -= dt;

  if (player.weapon.id === 'knife') {
    if (state.mouseDown && player.shootCooldown <= 0) knifeAttack(state);
  } else {
    if (state.mouseDown && player.shootCooldown <= 0 && player.ammo > 0) {
      if (weaponDef?.automatic || player.shotsFired === 0 || timeSinceShot < weaponDef.fireRate * 1.5) {
        playerShoot(state);
      }
    }
  }

  // Auto reload
  if (player.ammo <= 0 && player.reloadTimer <= 0 && player.reserveAmmo > 0 && player.weapon.id !== 'knife') {
    const reloadTime = weaponDef ? weaponDef.reloadTime : 2;
    player.reloadTimer = reloadTime;
  }
}

function knifeAttack(state: GameState) {
  const { player } = state;
  player.shootCooldown = 0.5;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dist = distance(player.pos, enemy.pos);
    if (dist < 60) {
      const angleToEnemy = Math.atan2(enemy.pos.y - player.pos.y, enemy.pos.x - player.pos.x);
      let angleDiff = Math.abs(player.angle - angleToEnemy);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      
      if (angleDiff < Math.PI / 3) {
        const attackDir = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
        let backDiff = Math.abs(enemy.angle - attackDir);
        if (backDiff > Math.PI) backDiff = Math.PI * 2 - backDiff;
        const isBackstab = backDiff < Math.PI / 2;

        const weaponDef = WEAPONS.knife;
        const damage = isBackstab ? weaponDef.headshotDamage : weaponDef.damage;
        
        enemy.health -= damage;
        registerHit(state, enemy.id, damage);
        enemy.state = 'chase';
        enemy.lastKnownPlayerPos = { ...player.pos };
        enemy.alertTimer = 5;

        if (state.settings.showBlood) {
          for (let i = 0; i < (isBackstab ? 8 : 5); i++) {
            state.particles.push({
              pos: { ...enemy.pos },
              vel: { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 },
              life: 0, maxLife: 0.4, color: 'hsl(0, 70%, 60%)', size: 4,
            });
          }
        }

        if (enemy.health <= 0) {
          enemy.alive = false;
          state.killFeed.push({ 
            killer: 'YOU', 
            victim: `ENEMY_${enemy.id}`, 
            weapon: 'Knife', 
            time: Date.now(),
            headshot: isBackstab 
          });
          state.score.kills++;
          state.matchKills++;
          state.roundKills++;
          state.player.money += 1500;
        }
      }
    }
  }
}

function playerShoot(state: GameState) {
  const { player } = state;
  const map = state.currentMap;
  const weaponDef = WEAPONS[player.weapon.id];
  if (!weaponDef) return;

  player.ammo--;
  player.shootCooldown = weaponDef.fireRate;
  player.inspecting = false;

  // Spread calculation
  let totalSpread = weaponDef.spread;
  if (player.isMoving) totalSpread += weaponDef.movementSpread;
  if (player.isCrouching) totalSpread *= 0.6;
  if (player.isJumping) totalSpread *= 3.5;
  if (player.isScoped) totalSpread *= 0.15;

  const shotIndex = Math.min(player.shotsFired, weaponDef.recoilPattern.length - 1);
  const verticalRecoil = weaponDef.recoilPattern[shotIndex] || 0;
  const horizontalRecoil = (Math.random() - 0.5) * weaponDef.recoilHorizontal * 0.02;

  player.recoilAngle += verticalRecoil * 0.01;
  player.shotsFired++;
  player.lastShotTime = performance.now() / 1000;

  const spread = (Math.random() - 0.5) * totalSpread + horizontalRecoil;
  const angle = player.angle + spread - player.recoilAngle;

  // Get crosshair position and limit range
  const crosshairX = state.mousePos.x + state.camera.x;
  const crosshairY = state.mousePos.y + state.camera.y;
  const distToCrosshair = distance(player.pos, { x: crosshairX, y: crosshairY });
  const maxRange = Math.min(weaponDef.range, distToCrosshair + 30);

  // Raycast
  const result = raycast(player.pos, angle, maxRange, map.walls);
  
  // Check for enemy hits
  let hitEnemy: Enemy | null = null;
  let hitDist = result.dist;
  let hitLocation: 'head' | 'body' | 'limb' = 'body';
  
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    
    const dx = Math.cos(angle) * maxRange;
    const dy = Math.sin(angle) * maxRange;
    const fx = player.pos.x - enemy.pos.x;
    const fy = player.pos.y - enemy.pos.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - enemy.radius * enemy.radius;
    
    let disc = b * b - 4 * a * c;
    if (disc >= 0) {
      disc = Math.sqrt(disc);
      const t = (-b - disc) / (2 * a);
      if (t >= 0 && t <= 1) {
        const d = t * Math.sqrt(a);
        if (d < hitDist) {
          hitDist = d;
          hitEnemy = enemy;
          
          const hitY = player.pos.y + dy * t;
          const localY = hitY - enemy.pos.y;
          
          if (localY < -enemy.radius * 0.3) {
            hitLocation = 'head';
          } else if (Math.abs(localY) < enemy.radius * 0.3) {
            hitLocation = 'body';
          } else {
            hitLocation = 'limb';
          }
        }
      }
    }
  }

  const bulletEnd = hitEnemy
    ? { x: player.pos.x + Math.cos(angle) * hitDist, y: player.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  // Add bullet tracer
  state.bullets.push({ 
    start: { ...player.pos }, 
    end: bulletEnd, 
    time: 0, 
    isEnemy: false,
    isHeadshot: hitLocation === 'head'
  });

  // Muzzle flash
  for (let i = 0; i < 3; i++) {
    state.particles.push({
      pos: { x: player.pos.x + Math.cos(angle) * 18, y: player.pos.y + Math.sin(angle) * 18 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 200, y: Math.sin(angle + (Math.random() - 0.5)) * 200 },
      life: 0, maxLife: 0.08, color: 'hsl(45, 100%, 70%)', size: 4,
    });
  }

  // Handle hit
  if (hitEnemy) {
    let damage = weaponDef.damage;
    if (hitLocation === 'head') {
      damage = weaponDef.headshotDamage;
    } else if (hitLocation === 'limb') {
      damage *= 0.75;
    }
    
    damage *= weaponDef.armorPenetration;
    
    hitEnemy.health -= damage;
    registerHit(state, hitEnemy.id, damage);
    state.roundDamage += damage;
    
    hitEnemy.state = 'chase';
    hitEnemy.lastKnownPlayerPos = { ...player.pos };
    hitEnemy.alertTimer = 5;

    // Hit markers
    state.hitMarkers.push({
      pos: bulletEnd,
      time: Date.now(),
      headshot: hitLocation === 'head',
      damage: Math.round(damage)
    });

    if (state.settings.showDamage) {
      state.damageIndicators.push({
        pos: bulletEnd,
        damage: Math.round(damage),
        time: Date.now(),
        isEnemy: true
      });
    }

    if (state.settings.showBlood) {
      const particleCount = hitLocation === 'head' ? 12 : 6;
      const particleColor = hitLocation === 'head' ? 'hsl(0, 90%, 50%)' : 'hsl(0, 70%, 60%)';
      
      for (let i = 0; i < particleCount; i++) {
        state.particles.push({
          pos: { ...bulletEnd },
          vel: { 
            x: (Math.random() - 0.5) * (hitLocation === 'head' ? 300 : 150), 
            y: (Math.random() - 0.5) * (hitLocation === 'head' ? 300 : 150) 
          },
          life: 0, 
          maxLife: hitLocation === 'head' ? 0.6 : 0.3, 
          color: particleColor, 
          size: hitLocation === 'head' ? 5 : 3,
        });
      }
    }
    
    state.bloodDecals.push({ pos: { ...bulletEnd }, alpha: 1 });

    if (hitEnemy.health <= 0) {
      hitEnemy.alive = false;
      
      // Calculate assist
      const damageDone = state.hitAssists.get(hitEnemy.id) || 0;
      if (damageDone >= 40) {
        state.score.assists++;
        state.matchAssists++;
      }
      
      state.killFeed.push({ 
        killer: 'YOU', 
        victim: `ENEMY_${hitEnemy.id}`, 
        weapon: player.weapon.name, 
        time: Date.now(), 
        headshot: hitLocation === 'head' 
      });
      state.score.kills++;
      state.matchKills++;
      state.roundKills++;
      state.player.money += weaponDef.killReward;
    }
  } else {
    // Wall impact
    if (state.settings.showImpactMarkers) {
      for (let i = 0; i < 3; i++) {
        state.particles.push({
          pos: { ...bulletEnd },
          vel: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
          life: 0, maxLife: 0.2, color: 'hsl(210, 10%, 50%)', size: 2,
        });
      }
    }
  }

  if (weaponDef.type === 'sniper' && player.isScoped) {
    player.isScoped = false;
  }
}

export function registerHit(state: GameState, enemyId: number, damage: number) {
  const current = state.hitAssists.get(enemyId) || 0;
  state.hitAssists.set(enemyId, current + damage);
  state.lastHitTime = Date.now() / 1000;
}

function updateEnemies(state: GameState, dt: number) {
  const map = state.currentMap;
  if (!state.navMesh) return;
  
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    // Determine target based on bomb state
    let targetPos: Vec2 | null = null;
    let canSeeTarget = false;
    
    // Priority 1: Defend bomb if planted
    if (state.bomb && state.bomb.isPlanted && !state.bomb.isDefused) {
      targetPos = state.bomb.pos;
      enemy.state = 'defending';
    }
    // Priority 2: Chase player
    else if (state.player.alive) {
      const distToPlayer = distance(enemy.pos, state.player.pos);
      const canSeePlayer = distToPlayer < 700 && 
        hasLineOfSight(enemy.pos, state.player.pos, map.walls);
      
      if (canSeePlayer) { 
        targetPos = state.player.pos; 
        canSeeTarget = true;
        enemy.state = 'chase';
        enemy.lastKnownPlayerPos = { ...state.player.pos };
        enemy.alertTimer = 8;
      } else if (enemy.lastKnownPlayerPos && distToPlayer < 400) {
        targetPos = enemy.lastKnownPlayerPos;
        enemy.state = 'searching';
      }
    }

    // Update alert timer
    enemy.alertTimer -= dt;
    if (enemy.alertTimer <= 0 && enemy.state !== 'patrol' && enemy.state !== 'defending') {
      enemy.state = 'patrol';
      enemy.path = [];
    }

    // Pathfinding and movement
    if (targetPos && (enemy.state === 'chase' || enemy.state === 'searching' || enemy.state === 'defending')) {
      if (!enemy.path || enemy.path.length === 0 || 
          (enemy.path.length > 0 && distance(enemy.pos, enemy.path[0]) < 30)) {
        enemy.path = state.navMesh.findPath(enemy.pos, targetPos, map.walls);
      }
      
      if (enemy.path && enemy.path.length > 1) {
        const nextPoint = enemy.path[1];
        const dir = normalize({ 
          x: nextPoint.x - enemy.pos.x, 
          y: nextPoint.y - enemy.pos.y 
        });
        
        const moveSpeed = enemy.state === 'chase' ? enemy.speed : enemy.speed * 0.7;
        const newX = enemy.pos.x + dir.x * moveSpeed * dt;
        const newY = enemy.pos.y + dir.y * moveSpeed * dt;
        
        let canMove = true;
        for (const wall of map.walls) {
          if (circleRectCollision(newX, newY, enemy.radius, wall.x, wall.y, wall.w, wall.h)) {
            canMove = false;
            break;
          }
        }
        
        for (const other of state.enemies) {
          if (other.id !== enemy.id && other.alive) {
            if (distance({ x: newX, y: newY }, other.pos) < enemy.radius * 2) {
              canMove = false;
              break;
            }
          }
        }
        
        if (canMove) {
          enemy.pos.x = newX;
          enemy.pos.y = newY;
        }
        
        if (distance(enemy.pos, nextPoint) < 25) {
          enemy.path.shift();
        }
      }
    } else {
      // Patrol mode
      if (!enemy.patrolTarget || distance(enemy.pos, enemy.patrolTarget) < 50) {
        enemy.patrolTarget = state.navMesh.getRandomValidPosition(map.walls);
      }
      
      const dir = normalize({ 
        x: enemy.patrolTarget.x - enemy.pos.x, 
        y: enemy.patrolTarget.y - enemy.pos.y 
      });
      
      const newX = enemy.pos.x + dir.x * enemy.speed * 0.4 * dt;
      const newY = enemy.pos.y + dir.y * enemy.speed * 0.4 * dt;
      
      let canMove = true;
      for (const wall of map.walls) {
        if (circleRectCollision(newX, newY, enemy.radius, wall.x, wall.y, wall.w, wall.h)) {
          canMove = false;
          break;
        }
      }
      
      if (canMove) {
        enemy.pos.x = newX;
        enemy.pos.y = newY;
      }
    }
    
    // Update angle
    if (targetPos) {
      enemy.angle = Math.atan2(targetPos.y - enemy.pos.y, targetPos.x - enemy.pos.x);
    } else if (enemy.patrolTarget) {
      enemy.angle = Math.atan2(enemy.patrolTarget.y - enemy.pos.y, enemy.patrolTarget.x - enemy.pos.x);
    }
    
    // Shooting
    enemy.shootCooldown -= dt;
    if (targetPos && canSeeTarget && enemy.shootCooldown <= 0) {
      const distToTarget = distance(enemy.pos, targetPos);
      if (distToTarget < 600) {
        enemyShoot(state, enemy, targetPos);
      }
    }
  }
}

function updateAllies(state: GameState, dt: number) {
  const map = state.currentMap;
  for (const ally of state.allies) {
    if (!ally.alive) continue;

    // Ally defusing logic
    if (state.bomb && state.bomb.isPlanted && !state.bomb.isDefused && state.player.team === 'ct') {
      if (!ally.isDefusing && distance(ally.pos, state.bomb.pos) < 50) {
        ally.isDefusing = true;
        ally.defuseTimer = 6;
      }
    }
    
    if (ally.isDefusing) {
      ally.defuseTimer = (ally.defuseTimer || 0) - dt;
      if (ally.defuseTimer && ally.defuseTimer <= 0 && state.bomb && !state.bomb.isDefused) {
        state.bomb.isDefused = true;
        state.roundStatus = 'won';
        state.roundsWon++;
        state.roundEndTimer = 3;
        
        state.killFeed.push({
          killer: `ALLY ${ally.name}`,
          victim: 'defused the bomb',
          weapon: '🔧',
          time: Date.now()
        });
      }
    }

    // Find target enemy
    let targetEnemy: Enemy | null = null;
    let canSeeEnemy = false;

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      if (distance(ally.pos, enemy.pos) < 500 && 
          hasLineOfSight(ally.pos, enemy.pos, map.walls)) {
        targetEnemy = enemy;
        canSeeEnemy = true;
        break;
      }
    }

    if (canSeeEnemy && targetEnemy) {
      ally.state = 'chase';
      ally.lastKnownEnemyPos = { ...targetEnemy.pos };
      ally.alertTimer = 5;
    }

    ally.alertTimer -= dt;
    if (ally.alertTimer <= 0 && ally.state !== 'patrol') {
      ally.state = 'patrol';
      ally.patrolTarget = {
        x: state.player.pos.x + (Math.random() - 0.5) * 200,
        y: state.player.pos.y + (Math.random() - 0.5) * 200,
      };
    }

    let targetPos: Vec2;
    let moveSpeed = ally.speed;

    if (ally.state === 'chase' && ally.lastKnownEnemyPos) {
      targetPos = canSeeEnemy && targetEnemy ? targetEnemy.pos : ally.lastKnownEnemyPos;
      if (distance(ally.pos, targetPos) < 160 && canSeeEnemy) moveSpeed = 0;
    } else {
      targetPos = ally.patrolTarget;
      moveSpeed = ally.speed * 0.6;
      if (distance(ally.pos, ally.patrolTarget) < 40) {
        ally.patrolTarget = {
          x: state.player.pos.x + (Math.random() - 0.5) * 200,
          y: state.player.pos.y + (Math.random() - 0.5) * 200,
        };
      }
    }

    if (moveSpeed > 0) {
      const dir = normalize({ x: targetPos.x - ally.pos.x, y: targetPos.y - ally.pos.y });
      const newX = ally.pos.x + dir.x * moveSpeed * dt;
      const newY = ally.pos.y + dir.y * moveSpeed * dt;
      let canX = true, canY = true;
      for (const wall of map.walls) {
        if (circleRectCollision(newX, ally.pos.y, ally.radius, wall.x, wall.y, wall.w, wall.h)) canX = false;
        if (circleRectCollision(ally.pos.x, newY, ally.radius, wall.x, wall.y, wall.w, wall.h)) canY = false;
      }
      if (canX) ally.pos.x = newX;
      if (canY) ally.pos.y = newY;
    }

    if (canSeeEnemy && targetEnemy) {
      ally.angle = Math.atan2(targetEnemy.pos.y - ally.pos.y, targetEnemy.pos.x - ally.pos.x);
    } else {
      ally.angle = Math.atan2(targetPos.y - ally.pos.y, targetPos.x - ally.pos.x);
    }

    ally.shootCooldown -= dt;
    if (canSeeEnemy && targetEnemy && ally.shootCooldown <= 0) {
      allyShoot(state, ally, targetEnemy);
    }
  }
}

function allyShoot(state: GameState, ally: Ally, target: Enemy) {
  const map = state.currentMap;
  ally.shootCooldown = 0.35 + Math.random() * 0.25;
  const spread = (Math.random() - 0.5) * 0.1;
  const angle = ally.angle + spread;
  const result = raycast(ally.pos, angle, 800, map.walls);

  let hitDist = result.dist;
  let hitTarget = false;

  const dx = Math.cos(angle) * 800;
  const dy = Math.sin(angle) * 800;
  const fx = ally.pos.x - target.pos.x;
  const fy = ally.pos.y - target.pos.y;
  const a = dx * dx + dy * dy;
  const b2 = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - target.radius * target.radius;
  let disc = b2 * b2 - 4 * a * c;
  if (disc >= 0) {
    disc = Math.sqrt(disc);
    const t = (-b2 - disc) / (2 * a);
    if (t >= 0 && t <= 1) {
      const d = t * Math.sqrt(a);
      if (d < hitDist) { hitDist = d; hitTarget = true; }
    }
  }

  const bulletEnd = hitTarget
    ? { x: ally.pos.x + Math.cos(angle) * hitDist, y: ally.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  state.bullets.push({ start: { ...ally.pos }, end: bulletEnd, time: 0, isEnemy: false });

  for (let i = 0; i < 2; i++) {
    state.particles.push({
      pos: { x: ally.pos.x + Math.cos(angle) * 16, y: ally.pos.y + Math.sin(angle) * 16 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 150, y: Math.sin(angle + (Math.random() - 0.5)) * 150 },
      life: 0, maxLife: 0.06, color: 'hsl(45, 100%, 70%)', size: 3,
    });
  }

  if (hitTarget) {
    target.health -= 25;
    registerHit(state, target.id, 25);
    
    if (state.settings.showBlood) {
      for (let i = 0; i < 4; i++) {
        state.particles.push({
          pos: { ...bulletEnd },
          vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
          life: 0, maxLife: 0.25, color: 'hsl(0, 70%, 60%)', size: 3,
        });
      }
    }
    state.bloodDecals.push({ pos: { ...bulletEnd }, alpha: 1 });

    if (target.health <= 0) {
      target.alive = false;
      state.killFeed.push({ 
        killer: `ALLY ${ally.name}`, 
        victim: `ENEMY_${target.id}`, 
        weapon: 'AK-47', 
        time: Date.now() 
      });
    }
  }
}

function enemyShoot(state: GameState, enemy: Enemy, targetPos: Vec2) {
  const map = state.currentMap;
  enemy.shootCooldown = 0.3 + Math.random() * 0.2;
  const spread = (Math.random() - 0.5) * 0.08;
  const angle = enemy.angle + spread;
  const result = raycast(enemy.pos, angle, 800, map.walls);

  let hitEntity: 'player' | number | null = null;
  let hitDist = result.dist;
  let hitLocation: 'head' | 'body' = 'body';

  if (state.player.alive) {
    const hd = checkHitWithLocation(enemy.pos, angle, state.player.pos, state.player.radius, hitDist);
    if (hd.hit) { 
      hitDist = hd.dist; 
      hitEntity = 'player';
      hitLocation = hd.location;
    }
  }

  for (const ally of state.allies) {
    if (!ally.alive) continue;
    const hd = checkHitWithLocation(enemy.pos, angle, ally.pos, ally.radius, hitDist);
    if (hd.hit) { 
      hitDist = hd.dist; 
      hitEntity = ally.id;
      hitLocation = hd.location;
    }
  }

  const bulletEnd = hitEntity !== null
    ? { x: enemy.pos.x + Math.cos(angle) * hitDist, y: enemy.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  state.bullets.push({ 
    start: { ...enemy.pos }, 
    end: bulletEnd, 
    time: 0, 
    isEnemy: true,
    isHeadshot: hitLocation === 'head'
  });

  for (let i = 0; i < 2; i++) {
    state.particles.push({
      pos: { x: enemy.pos.x + Math.cos(angle) * 16, y: enemy.pos.y + Math.sin(angle) * 16 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 150, y: Math.sin(angle + (Math.random() - 0.5)) * 150 },
      life: 0, maxLife: 0.06, color: 'hsl(45, 100%, 70%)', size: 3,
    });
  }

  if (hitEntity === 'player') {
    const damage = hitLocation === 'head' ? 85 : 25;
    state.player.health -= damage;
    
    if (state.settings.showDamage) {
      state.damageIndicators.push({
        pos: bulletEnd,
        damage: damage,
        time: Date.now(),
        isEnemy: true
      });
    }
    
    if (state.settings.showBlood) {
      for (let i = 0; i < (hitLocation === 'head' ? 8 : 4); i++) {
        state.particles.push({
          pos: { ...bulletEnd },
          vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
          life: 0, maxLife: 0.3, color: 'hsl(0, 70%, 60%)', size: 3,
        });
      }
    }
    
    if (state.player.health <= 0) {
      state.player.alive = false;
      state.player.isScoped = false;
      state.score.deaths++;
      state.matchDeaths++;
      state.killFeed.push({ 
        killer: `ENEMY_${enemy.id}`, 
        victim: 'YOU', 
        weapon: 'AK-47', 
        time: Date.now(),
        headshot: hitLocation === 'head'
      });
    }
  } else if (typeof hitEntity === 'number') {
    const ally = state.allies.find(a => a.id === hitEntity);
    if (ally) {
      const damage = hitLocation === 'head' ? 85 : 25;
      ally.health -= damage;
      
      if (state.settings.showBlood) {
        for (let i = 0; i < (hitLocation === 'head' ? 8 : 4); i++) {
          state.particles.push({
            pos: { ...bulletEnd },
            vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
            life: 0, maxLife: 0.3, color: 'hsl(0, 70%, 60%)', size: 3,
          });
        }
      }
      
      if (ally.health <= 0) {
        ally.alive = false;
        state.killFeed.push({ 
          killer: `ENEMY_${enemy.id}`, 
          victim: `ALLY ${ally.name}`, 
          weapon: 'AK-47', 
          time: Date.now(),
          headshot: hitLocation === 'head'
        });
      }
    }
  }
}

function checkHitWithLocation(
  origin: Vec2, 
  angle: number, 
  target: Vec2, 
  radius: number, 
  maxDist: number
): { hit: boolean; dist: number; location: 'head' | 'body' } {
  const dx = Math.cos(angle) * 800;
  const dy = Math.sin(angle) * 800;
  const fx = origin.x - target.x;
  const fy = origin.y - target.y;
  const a = dx * dx + dy * dy;
  const b2 = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  let disc = b2 * b2 - 4 * a * c;
  
  if (disc >= 0) {
    disc = Math.sqrt(disc);
    const t = (-b2 - disc) / (2 * a);
    if (t >= 0 && t <= 1) {
      const d = t * Math.sqrt(a);
      if (d < maxDist) {
        const hitY = origin.y + dy * t;
        const localY = hitY - target.y;
        const location = localY < -radius * 0.3 ? 'head' : 'body';
        return { hit: true, dist: d, location };
      }
    }
  }
  return { hit: false, dist: maxDist, location: 'body' };
}

function updateBullets(state: GameState, dt: number) {
  for (const b of state.bullets) b.time += dt;
  state.bullets = state.bullets.filter(b => b.time < 0.3);
}

function updateParticles(state: GameState, dt: number) {
  for (const p of state.particles) {
    p.life += dt;
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.vel.x *= 0.92;
    p.vel.y *= 0.92;
  }
  state.particles = state.particles.filter(p => p.life < p.maxLife);
}

function updateBloodDecals(state: GameState, dt: number) {
  for (const d of state.bloodDecals) d.alpha -= dt * 0.03;
  state.bloodDecals = state.bloodDecals.filter(d => d.alpha > 0);
}

function updateCamera(state: GameState) {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  const map = state.currentMap;
  const target = getCameraTarget(state);
  const targetX = target.x - canvas.width / 2;
  const targetY = target.y - canvas.height / 2;
  state.camera.x += (targetX - state.camera.x) * 0.1;
  state.camera.y += (targetY - state.camera.y) * 0.1;
  state.camera.x = Math.max(0, Math.min(map.width - canvas.width, state.camera.x));
  state.camera.y = Math.max(0, Math.min(map.height - canvas.height, state.camera.y));
}

export function getLeaderboard(state: GameState): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  
  entries.push({
    name: 'YOU',
    kills: state.matchKills,
    deaths: state.matchDeaths,
    assists: state.matchAssists,
    money: state.player.money,
    team: state.playerTeam,
    isPlayer: true,
    ping: 5,
    alive: state.player.alive,
  });
  
  state.allies.forEach(ally => {
    entries.push({
      name: ally.name,
      kills: 0,
      deaths: ally.alive ? 0 : 1,
      assists: 0,
      money: 0,
      team: 'ct',
      isPlayer: false,
      ping: 10 + Math.floor(Math.random() * 20),
      alive: ally.alive,
    });
  });
  
  return entries.sort((a, b) => b.kills - a.kills);
}

export function randomPointInMap(width: number, height: number, walls: Wall[], radius: number): Vec2 {
  for (let i = 0; i < 100; i++) {
    const p = { x: 100 + Math.random() * (width - 200), y: 100 + Math.random() * (height - 200) };
    let valid = true;
    for (const w of walls) {
      if (circleRectCollision(p.x, p.y, radius, w.x, w.y, w.w, w.h)) {
        valid = false;
        break;
      }
    }
    if (valid) return p;
  }
  return { x: width / 2, y: height / 2 };
}
