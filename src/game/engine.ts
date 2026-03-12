import { Player, Enemy, Ally, Bullet, Particle, KillFeedEntry, Vec2 } from './types';
import { MAPS, dust2Map } from './map';
import { WEAPONS, weaponDefToWeapon, WeaponDef } from './weapons';
import { distance, circleRectCollision, raycast, hasLineOfSight, randomPointInMap, normalize } from './utils';
import { GameMap } from './types';

export interface GameState {
  player: Player;
  enemies: Enemy[];
  allies: Ally[];
  bullets: Bullet[];
  particles: Particle[];
  bloodDecals: { pos: Vec2; alpha: number }[];
  killFeed: KillFeedEntry[];
  keys: Set<string>;
  mousePos: Vec2;
  mouseDown: boolean;
  camera: Vec2;
  roundTime: number;
  roundStatus: 'playing' | 'won' | 'lost' | 'freezetime';
  score: { kills: number; deaths: number };
  gamePhase: 'menu' | 'playing';
  hoveredButton: string | null;
  nextEnemyId: number;
  buyMenuOpen: boolean;
  buyMenuCategory: number;
  buyMenuSelection: number;
  freezeTimer: number;
  playerTeam: 'ct' | 't';
  currentRound: number;
  maxRounds: number;
  roundsWon: number;
  roundsLost: number;
  matchOver: boolean;
  roundEndTimer: number;
  enemyCount: number;
  allyCount: number;
  // Spectator
  spectatingIndex: number;
  // Map selection
  selectedMapIndex: number;
  currentMap: GameMap;
}

const ALLY_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India'];
const BASE_SPEED = 130;
const KNIFE_SPEED_BONUS = 1.15;
const CROUCH_SPEED_MULT = 0.4;

export function createInitialState(): GameState {
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
    camera: { x: 0, y: 0 },
    roundTime: 115,
    roundStatus: 'playing',
    score: { kills: 0, deaths: 0 },
    gamePhase: 'menu',
    hoveredButton: null,
    nextEnemyId: 0,
    buyMenuOpen: false,
    buyMenuCategory: 0,
    buyMenuSelection: 0,
    freezeTimer: 0,
    playerTeam: 't',
    currentRound: 0,
    maxRounds: 5,
    roundsWon: 0,
    roundsLost: 0,
    matchOver: false,
    roundEndTimer: 0,
    enemyCount: 5,
    allyCount: 3,
    spectatingIndex: -1,
    selectedMapIndex: 0,
    currentMap: dust2Map,
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
  };
}

function createEnemy(id: number, pos: Vec2, map: GameMap): Enemy {
  return {
    id,
    pos: { ...pos },
    angle: Math.random() * Math.PI * 2,
    health: 100,
    maxHealth: 100,
    speed: 120,
    radius: 12,
    alive: true,
    shootCooldown: 0,
    patrolTarget: randomPointInMap(map.width, map.height, map.walls, 12),
    alertTimer: 0,
    lastKnownPlayerPos: null,
    state: 'patrol',
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
  };
}

export function startRound(state: GameState) {
  const map = state.currentMap;
  const carryMoney = state.currentRound === 0 ? 800 : state.player.money;
  state.player = createPlayer(state.playerTeam, map, carryMoney);
  state.bullets = [];
  state.particles = [];
  state.bloodDecals = [];
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

  for (let i = 0; i < state.enemyCount; i++) {
    const spawnIdx = i % map.enemySpawns.length;
    const baseSpawn = map.enemySpawns[spawnIdx];
    const offset = { x: baseSpawn.x + (Math.random() - 0.5) * 60, y: baseSpawn.y + (Math.random() - 0.5) * 60 };
    state.enemies.push(createEnemy(state.nextEnemyId++, offset, map));
  }

  const playerSpawn = map.spawnPoints[0];
  for (let i = 0; i < state.allyCount; i++) {
    const offset = {
      x: playerSpawn.x + 40 + Math.random() * 80,
      y: playerSpawn.y - 80 + i * 60 + Math.random() * 40,
    };
    state.allies.push(createAlly(100 + i, offset, map));
  }
}

export function startNewMatch(state: GameState) {
  state.currentMap = MAPS[state.selectedMapIndex];
  state.currentRound = 0;
  state.roundsWon = 0;
  state.roundsLost = 0;
  state.matchOver = false;
  state.score = { kills: 0, deaths: 0 };
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

// Get the entity the camera should follow
function getCameraTarget(state: GameState): Vec2 {
  if (state.player.alive) return state.player.pos;
  const aliveAllies = state.allies.filter(a => a.alive);
  if (aliveAllies.length > 0) {
    const idx = Math.max(0, Math.min(state.spectatingIndex, aliveAllies.length - 1));
    state.spectatingIndex = idx;
    return aliveAllies[idx].pos;
  }
  return state.player.pos;
}

export function cycleSpectator(state: GameState, direction: number) {
  const aliveAllies = state.allies.filter(a => a.alive);
  if (aliveAllies.length === 0) return;
  state.spectatingIndex = ((state.spectatingIndex + direction) % aliveAllies.length + aliveAllies.length) % aliveAllies.length;
}

export function update(state: GameState, dt: number) {
  if (state.gamePhase !== 'playing') return;
  const map = state.currentMap;

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

  if (state.roundStatus !== 'playing') return;

  updatePlayer(state, dt);
  updateEnemies(state, dt);
  updateAllies(state, dt);
  updateBullets(state, dt);
  updateParticles(state, dt);
  updateBloodDecals(state, dt);
  updateCamera(state);

  state.roundTime -= dt;

  const allEnemiesDead = state.enemies.every(e => !e.alive);
  const allAlliesDead = !state.player.alive && state.allies.every(a => !a.alive);

  if (allEnemiesDead) {
    state.roundStatus = 'won';
    state.roundsWon++;
    state.player.money += 3250;
    state.roundEndTimer = 3;
  } else if (allAlliesDead) {
    state.roundStatus = 'lost';
    state.roundsLost++;
    state.player.money += 1400;
    state.roundEndTimer = 3;
  } else if (state.roundTime <= 0) {
    if (state.playerTeam === 'ct') {
      state.roundStatus = 'won'; state.roundsWon++; state.player.money += 3250;
    } else {
      state.roundStatus = 'lost'; state.roundsLost++; state.player.money += 1400;
    }
    state.roundEndTimer = 3;
  }
}

function updatePlayer(state: GameState, dt: number) {
  const { player, keys } = state;
  const map = state.currentMap;
  if (!player.alive) {
    // Spectator mode - start spectating if just died
    if (state.spectatingIndex < 0) {
      const aliveAllies = state.allies.filter(a => a.alive);
      if (aliveAllies.length > 0) state.spectatingIndex = 0;
    }
    return;
  }
  if (state.buyMenuOpen) return;

  if (player.inspecting) {
    player.inspectTimer -= dt;
    if (player.inspectTimer <= 0) player.inspecting = false;
  }

  if (player.isJumping) {
    player.jumpTimer -= dt;
    if (player.jumpTimer <= 0) player.isJumping = false;
  }

  player.isCrouching = keys.has('control') || keys.has('shift');

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

    // Unscope when moving
    if (player.isScoped && player.isMoving) player.isScoped = false;
  }

  // Aim
  const zoomFactor = player.isScoped ? 0.4 : 1;
  const worldMouse = {
    x: state.mousePos.x * zoomFactor + state.camera.x + (state.mousePos.x * (1 - zoomFactor)),
    y: state.mousePos.y * zoomFactor + state.camera.y + (state.mousePos.y * (1 - zoomFactor)),
  };
  // Simpler: just use camera + mouse
  const wmx = state.mousePos.x + state.camera.x;
  const wmy = state.mousePos.y + state.camera.y;
  player.angle = Math.atan2(wmy - player.pos.y, wmx - player.pos.x);

  // Recoil recovery
  const now = performance.now() / 1000;
  const timeSinceShot = now - player.lastShotTime;
  if (timeSinceShot > 0.1 && player.recoilAngle > 0) {
    const recovery = weaponDef ? weaponDef.recoilRecovery : 5;
    player.recoilAngle = Math.max(0, player.recoilAngle - recovery * dt * 0.02);
    if (player.recoilAngle < 0.001) { player.shotsFired = 0; player.recoilAngle = 0; }
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
  const map = state.currentMap;
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

        enemy.health -= isBackstab ? 180 : 40;
        enemy.state = 'chase';
        enemy.lastKnownPlayerPos = { ...player.pos };
        enemy.alertTimer = 5;

        for (let i = 0; i < 5; i++) {
          state.particles.push({
            pos: { ...enemy.pos },
            vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
            life: 0, maxLife: 0.3, color: 'hsl(0, 70%, 60%)', size: 3,
          });
        }

        if (enemy.health <= 0) {
          enemy.alive = false;
          state.killFeed.push({ killer: 'YOU', victim: `ENEMY_${enemy.id}`, weapon: 'Knife', time: Date.now() });
          state.score.kills++;
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

  let totalSpread = weaponDef.spread;
  if (player.isMoving) totalSpread += weaponDef.movementSpread;
  if (player.isCrouching) totalSpread *= 0.6;
  if (player.isJumping) totalSpread *= 3.5;
  // Scoped = much less spread
  if (player.isScoped) totalSpread *= 0.15;

  const shotIndex = Math.min(player.shotsFired, weaponDef.recoilPattern.length - 1);
  const verticalRecoil = weaponDef.recoilPattern[shotIndex] || 0;
  const horizontalRecoil = (Math.random() - 0.5) * weaponDef.recoilHorizontal * 0.02;

  player.recoilAngle += verticalRecoil * 0.01;
  player.shotsFired++;
  player.lastShotTime = performance.now() / 1000;

  const spread = (Math.random() - 0.5) * totalSpread + horizontalRecoil;
  const angle = player.angle + spread - player.recoilAngle;

  // Bullet range limited to distance to crosshair
  const wmx = state.mousePos.x + state.camera.x;
  const wmy = state.mousePos.y + state.camera.y;
  const distToCrosshair = distance(player.pos, { x: wmx, y: wmy });
  const maxRange = Math.min(weaponDef.range, distToCrosshair + 20); // small buffer

  const result = raycast(player.pos, angle, maxRange, map.walls);

  let hitEnemy: Enemy | null = null;
  let hitDist = result.dist;
  let isHeadshot = false;
  const endX = player.pos.x + Math.cos(angle) * maxRange;
  const endY = player.pos.y + Math.sin(angle) * maxRange;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dx2 = endX - player.pos.x;
    const dy2 = endY - player.pos.y;
    const fx = player.pos.x - enemy.pos.x;
    const fy = player.pos.y - enemy.pos.y;
    const a = dx2 * dx2 + dy2 * dy2;
    const b = 2 * (fx * dx2 + fy * dy2);
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
          // Headshot check: hit point close to center = headshot
          const hitX = player.pos.x + Math.cos(angle) * d;
          const hitY = player.pos.y + Math.sin(angle) * d;
          const distToCenter = distance({ x: hitX, y: hitY }, enemy.pos);
          isHeadshot = distToCenter < enemy.radius * 0.45;
        }
      }
    }
  }

  const bulletEnd = hitEnemy
    ? { x: player.pos.x + Math.cos(angle) * hitDist, y: player.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  state.bullets.push({ start: { ...player.pos }, end: bulletEnd, time: 0, isEnemy: false, isHeadshot });

  for (let i = 0; i < 3; i++) {
    state.particles.push({
      pos: { x: player.pos.x + Math.cos(angle) * 18, y: player.pos.y + Math.sin(angle) * 18 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 200, y: Math.sin(angle + (Math.random() - 0.5)) * 200 },
      life: 0, maxLife: 0.08, color: 'hsl(45, 100%, 70%)', size: 4,
    });
  }

  if (hitEnemy) {
    // Headshot = instant kill for most weapons, big multiplier
    const dmgMultiplier = isHeadshot ? 4.0 : 1.0;
    const finalDmg = Math.round(weaponDef.damage * dmgMultiplier);
    hitEnemy.health -= finalDmg;
    hitEnemy.state = 'chase';
    hitEnemy.lastKnownPlayerPos = { ...player.pos };
    hitEnemy.alertTimer = 5;

    const particleCount = isHeadshot ? 10 : 5;
    for (let i = 0; i < particleCount; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * (isHeadshot ? 250 : 150), y: (Math.random() - 0.5) * (isHeadshot ? 250 : 150) },
        life: 0, maxLife: isHeadshot ? 0.5 : 0.3, color: isHeadshot ? 'hsl(0, 90%, 50%)' : 'hsl(0, 70%, 60%)', size: isHeadshot ? 4 : 3,
      });
    }
    state.bloodDecals.push({ pos: { ...bulletEnd }, alpha: 1 });

    if (hitEnemy.health <= 0) {
      hitEnemy.alive = false;
      state.killFeed.push({ killer: 'YOU', victim: `ENEMY_${hitEnemy.id}`, weapon: player.weapon.name, time: Date.now(), headshot: isHeadshot });
      state.score.kills++;
      state.player.money += weaponDef.killReward;
    }
  } else {
    for (let i = 0; i < 3; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
        life: 0, maxLife: 0.2, color: 'hsl(210, 10%, 50%)', size: 2,
      });
    }
  }

  // Unscope after AWP shot
  if (weaponDef.type === 'sniper' && player.isScoped) {
    player.isScoped = false;
  }
}

function updateEnemies(state: GameState, dt: number) {
  const map = state.currentMap;
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    let targetEntity: { pos: Vec2, alive: boolean } | null = null;
    let canSeeTarget = false;

    if (state.player.alive) {
      const canSeePlayer = distance(enemy.pos, state.player.pos) < 600 &&
        hasLineOfSight(enemy.pos, state.player.pos, map.walls);
      if (canSeePlayer) { targetEntity = state.player; canSeeTarget = true; }
    }

    if (!canSeeTarget) {
      for (const ally of state.allies) {
        if (!ally.alive) continue;
        if (distance(enemy.pos, ally.pos) < 500 && hasLineOfSight(enemy.pos, ally.pos, map.walls)) {
          targetEntity = ally; canSeeTarget = true; break;
        }
      }
    }

    if (canSeeTarget && targetEntity) {
      enemy.state = 'chase';
      enemy.lastKnownPlayerPos = { ...targetEntity.pos };
      enemy.alertTimer = 5;
    }

    enemy.alertTimer -= dt;
    if (enemy.alertTimer <= 0 && enemy.state !== 'patrol') {
      enemy.state = 'patrol';
      enemy.patrolTarget = randomPointInMap(map.width, map.height, map.walls, enemy.radius);
    }

    let targetPos: Vec2;
    let moveSpeed = enemy.speed;

    if (enemy.state === 'chase' && enemy.lastKnownPlayerPos) {
      targetPos = canSeeTarget && targetEntity ? targetEntity.pos : enemy.lastKnownPlayerPos;
      if (distance(enemy.pos, targetPos) < 150 && canSeeTarget) moveSpeed = 0;
    } else {
      targetPos = enemy.patrolTarget;
      moveSpeed = enemy.speed * 0.5;
      if (distance(enemy.pos, enemy.patrolTarget) < 30) {
        enemy.patrolTarget = randomPointInMap(map.width, map.height, map.walls, enemy.radius);
      }
    }

    if (moveSpeed > 0) {
      const dir = normalize({ x: targetPos.x - enemy.pos.x, y: targetPos.y - enemy.pos.y });
      const newX = enemy.pos.x + dir.x * moveSpeed * dt;
      const newY = enemy.pos.y + dir.y * moveSpeed * dt;
      let canX = true, canY = true;
      for (const wall of map.walls) {
        if (circleRectCollision(newX, enemy.pos.y, enemy.radius, wall.x, wall.y, wall.w, wall.h)) canX = false;
        if (circleRectCollision(enemy.pos.x, newY, enemy.radius, wall.x, wall.y, wall.w, wall.h)) canY = false;
      }
      if (canX) enemy.pos.x = newX;
      if (canY) enemy.pos.y = newY;
    }

    if (canSeeTarget && targetEntity) {
      enemy.angle = Math.atan2(targetEntity.pos.y - enemy.pos.y, targetEntity.pos.x - enemy.pos.x);
    } else {
      enemy.angle = Math.atan2(targetPos.y - enemy.pos.y, targetPos.x - enemy.pos.x);
    }

    enemy.shootCooldown -= dt;
    if (canSeeTarget && targetEntity && enemy.shootCooldown <= 0) {
      enemyShoot(state, enemy, targetEntity.pos);
    }
  }
}

function updateAllies(state: GameState, dt: number) {
  const map = state.currentMap;
  for (const ally of state.allies) {
    if (!ally.alive) continue;

    let targetEnemy: Enemy | null = null;
    let canSeeEnemy = false;

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      if (distance(ally.pos, enemy.pos) < 500 && hasLineOfSight(ally.pos, enemy.pos, map.walls)) {
        targetEnemy = enemy; canSeeEnemy = true; break;
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

  const dx2 = Math.cos(angle) * 800;
  const dy2 = Math.sin(angle) * 800;
  const fx = ally.pos.x - target.pos.x;
  const fy = ally.pos.y - target.pos.y;
  const a = dx2 * dx2 + dy2 * dy2;
  const b2 = 2 * (fx * dx2 + fy * dy2);
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
    for (let i = 0; i < 4; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
        life: 0, maxLife: 0.25, color: 'hsl(0, 70%, 60%)', size: 3,
      });
    }
    state.bloodDecals.push({ pos: { ...bulletEnd }, alpha: 1 });

    if (target.health <= 0) {
      target.alive = false;
      state.killFeed.push({ killer: `ALLY ${ally.name}`, victim: `ENEMY_${target.id}`, weapon: 'AK-47', time: Date.now() });
    }
  }
}

function enemyShoot(state: GameState, enemy: Enemy, targetPos: Vec2) {
  const map = state.currentMap;
  enemy.shootCooldown = 0.4 + Math.random() * 0.3;
  const spread = (Math.random() - 0.5) * 0.12;
  const angle = enemy.angle + spread;
  const result = raycast(enemy.pos, angle, 800, map.walls);

  let hitEntity: 'player' | number | null = null;
  let hitDist = result.dist;

  if (state.player.alive) {
    const hd = checkHit(enemy.pos, angle, state.player.pos, state.player.radius, hitDist);
    if (hd !== null) { hitDist = hd; hitEntity = 'player'; }
  }

  for (const ally of state.allies) {
    if (!ally.alive) continue;
    const hd = checkHit(enemy.pos, angle, ally.pos, ally.radius, hitDist);
    if (hd !== null) { hitDist = hd; hitEntity = ally.id; }
  }

  const bulletEnd = hitEntity !== null
    ? { x: enemy.pos.x + Math.cos(angle) * hitDist, y: enemy.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  state.bullets.push({ start: { ...enemy.pos }, end: bulletEnd, time: 0, isEnemy: true });

  for (let i = 0; i < 2; i++) {
    state.particles.push({
      pos: { x: enemy.pos.x + Math.cos(angle) * 16, y: enemy.pos.y + Math.sin(angle) * 16 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 150, y: Math.sin(angle + (Math.random() - 0.5)) * 150 },
      life: 0, maxLife: 0.06, color: 'hsl(45, 100%, 70%)', size: 3,
    });
  }

  if (hitEntity === 'player') {
    state.player.health -= 18;
    spawnBloodParticles(state, bulletEnd);
    if (state.player.health <= 0) {
      state.player.alive = false;
      state.player.isScoped = false;
      state.score.deaths++;
      state.killFeed.push({ killer: `ENEMY_${enemy.id}`, victim: 'YOU', weapon: 'AK-47', time: Date.now() });
    }
  } else if (typeof hitEntity === 'number') {
    const ally = state.allies.find(a => a.id === hitEntity);
    if (ally) {
      ally.health -= 18;
      spawnBloodParticles(state, bulletEnd);
      if (ally.health <= 0) {
        ally.alive = false;
        state.killFeed.push({ killer: `ENEMY_${enemy.id}`, victim: `ALLY ${ally.name}`, weapon: 'AK-47', time: Date.now() });
      }
    }
  }
}

function checkHit(origin: Vec2, angle: number, target: Vec2, radius: number, maxDist: number): number | null {
  const dx2 = Math.cos(angle) * 800;
  const dy2 = Math.sin(angle) * 800;
  const fx = origin.x - target.x;
  const fy = origin.y - target.y;
  const a = dx2 * dx2 + dy2 * dy2;
  const b2 = 2 * (fx * dx2 + fy * dy2);
  const c = fx * fx + fy * fy - radius * radius;
  let disc = b2 * b2 - 4 * a * c;
  if (disc >= 0) {
    disc = Math.sqrt(disc);
    const t = (-b2 - disc) / (2 * a);
    if (t >= 0 && t <= 1) {
      const d = t * Math.sqrt(a);
      if (d < maxDist) return d;
    }
  }
  return null;
}

function spawnBloodParticles(state: GameState, pos: Vec2) {
  for (let i = 0; i < 4; i++) {
    state.particles.push({
      pos: { ...pos },
      vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
      life: 0, maxLife: 0.25, color: 'hsl(0, 70%, 60%)', size: 3,
    });
  }
  state.bloodDecals.push({ pos: { ...pos }, alpha: 1 });
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
