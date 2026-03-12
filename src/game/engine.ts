import { Player, Enemy, Bullet, Particle, KillFeedEntry, Vec2 } from './types';
import { gameMap } from './map';
import { WEAPONS, weaponDefToWeapon, BUY_CATEGORIES, WeaponDef } from './weapons';
import { distance, circleRectCollision, raycast, hasLineOfSight, randomPointInMap, normalize } from './utils';

export interface GameState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  bloodDecals: { pos: Vec2; alpha: number }[];
  killFeed: KillFeedEntry[];
  keys: Set<string>;
  mousePos: Vec2;
  mouseDown: boolean;
  camera: Vec2;
  roundTime: number;
  roundStatus: 'playing' | 'won' | 'dead' | 'freezetime';
  score: { kills: number; deaths: number };
  gamePhase: 'menu' | 'playing';
  hoveredButton: string | null;
  nextEnemyId: number;
  buyMenuOpen: boolean;
  buyMenuCategory: number;
  buyMenuSelection: number;
  freezeTimer: number;
  playerTeam: 'ct' | 't';
}

export function createInitialState(): GameState {
  return {
    player: createPlayer('t'),
    enemies: [],
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
  };
}

function createPlayer(team: 'ct' | 't'): Player {
  const startWeaponId = team === 't' ? 'glock' : 'usp';
  const wp = WEAPONS[startWeaponId];
  return {
    pos: { ...gameMap.spawnPoints[0] },
    angle: 0,
    health: 100,
    maxHealth: 100,
    ammo: wp.ammo,
    maxAmmo: wp.maxAmmo,
    reserveAmmo: wp.reserveAmmo,
    speed: 220,
    radius: 12,
    weapon: weaponDefToWeapon(wp),
    secondaryWeapon: null,
    knife: weaponDefToWeapon(WEAPONS.knife),
    alive: true,
    reloadTimer: 0,
    shootCooldown: 0,
    money: 800,
    shotsFired: 0,
    lastShotTime: 0,
    recoilAngle: 0,
    isMoving: false,
    team,
    inspecting: false,
    inspectTimer: 0,
  };
}

function createEnemy(id: number, pos: Vec2): Enemy {
  return {
    id,
    pos: { ...pos },
    angle: Math.random() * Math.PI * 2,
    health: 100,
    maxHealth: 100,
    speed: 140,
    radius: 12,
    alive: true,
    shootCooldown: 0,
    patrolTarget: randomPointInMap(gameMap.width, gameMap.height, gameMap.walls, 12),
    alertTimer: 0,
    lastKnownPlayerPos: null,
    state: 'patrol',
  };
}

export function startRound(state: GameState) {
  state.player = createPlayer(state.playerTeam);
  state.bullets = [];
  state.particles = [];
  state.bloodDecals = [];
  state.roundTime = 115;
  state.roundStatus = 'freezetime';
  state.freezeTimer = 5;
  state.enemies = [];
  state.nextEnemyId = 0;
  state.buyMenuOpen = false;
  state.player.money = 800;

  for (const spawn of gameMap.enemySpawns) {
    state.enemies.push(createEnemy(state.nextEnemyId++, spawn));
  }
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
  } else if (def.type !== 'knife') {
    state.player.weapon = wp;
    state.player.ammo = wp.ammo;
    state.player.maxAmmo = wp.maxAmmo;
    state.player.reserveAmmo = wp.reserveAmmo;
  }

  state.player.shotsFired = 0;
  state.player.recoilAngle = 0;
  return true;
}

export function update(state: GameState, dt: number) {
  if (state.gamePhase !== 'playing') return;

  // Freeze time
  if (state.roundStatus === 'freezetime') {
    state.freezeTimer -= dt;
    updateCamera(state);
    if (state.freezeTimer <= 0) {
      state.roundStatus = 'playing';
    }
    return;
  }

  if (state.roundStatus !== 'playing') return;

  updatePlayer(state, dt);
  updateEnemies(state, dt);
  updateBullets(state, dt);
  updateParticles(state, dt);
  updateBloodDecals(state, dt);
  updateCamera(state);

  state.roundTime -= dt;
  if (state.roundTime <= 0) {
    state.roundStatus = 'won';
  }

  if (state.enemies.every(e => !e.alive)) {
    state.roundStatus = 'won';
  }
}

function updatePlayer(state: GameState, dt: number) {
  const { player, keys } = state;
  if (!player.alive) return;
  if (state.buyMenuOpen) return;

  // Inspect
  if (player.inspecting) {
    player.inspectTimer -= dt;
    if (player.inspectTimer <= 0) player.inspecting = false;
  }

  // Movement
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy = -1;
  if (keys.has('s') || keys.has('arrowdown')) dy = 1;
  if (keys.has('a') || keys.has('arrowleft')) dx = -1;
  if (keys.has('d') || keys.has('arrowright')) dx = 1;

  player.isMoving = dx !== 0 || dy !== 0;

  // Get weapon def for movement speed
  const weaponDef = WEAPONS[player.weapon.id];
  const moveMultiplier = weaponDef ? weaponDef.movementSpeed : 1;

  if (player.isMoving) {
    const dir = normalize({ x: dx, y: dy });
    const speed = player.speed * moveMultiplier;
    const newX = player.pos.x + dir.x * speed * dt;
    const newY = player.pos.y + dir.y * speed * dt;

    let canX = true, canY = true;
    for (const wall of gameMap.walls) {
      if (circleRectCollision(newX, player.pos.y, player.radius, wall.x, wall.y, wall.w, wall.h)) canX = false;
      if (circleRectCollision(player.pos.x, newY, player.radius, wall.x, wall.y, wall.w, wall.h)) canY = false;
    }
    if (canX) player.pos.x = newX;
    if (canY) player.pos.y = newY;

    player.pos.x = Math.max(player.radius, Math.min(gameMap.width - player.radius, player.pos.x));
    player.pos.y = Math.max(player.radius, Math.min(gameMap.height - player.radius, player.pos.y));
  }

  // Aim
  const worldMouse = {
    x: state.mousePos.x + state.camera.x,
    y: state.mousePos.y + state.camera.y,
  };
  player.angle = Math.atan2(worldMouse.y - player.pos.y, worldMouse.x - player.pos.x);

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

  // Reload key
  if (keys.has('r') && player.ammo < player.maxAmmo && player.reserveAmmo > 0 && state.roundStatus === 'playing') {
    const reloadTime = weaponDef ? weaponDef.reloadTime : 2;
    player.reloadTimer = reloadTime;
  }

  // Shoot
  player.shootCooldown -= dt;
  const canShoot = weaponDef?.automatic ? state.mouseDown : state.mouseDown;
  if (canShoot && player.shootCooldown <= 0 && player.ammo > 0 && player.weapon.id !== 'knife') {
    playerShoot(state);
  }

  // Knife attack
  if (state.mouseDown && player.shootCooldown <= 0 && player.weapon.id === 'knife') {
    knifeAttack(state);
  }

  // Auto reload on empty
  if (player.ammo <= 0 && player.reloadTimer <= 0 && player.reserveAmmo > 0 && player.weapon.id !== 'knife') {
    const reloadTime = weaponDef ? weaponDef.reloadTime : 2;
    player.reloadTimer = reloadTime;
  }
}

function knifeAttack(state: GameState) {
  const { player } = state;
  player.shootCooldown = 0.5;

  // Check enemies in range
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dist = distance(player.pos, enemy.pos);
    if (dist < 60) {
      // Check if facing enemy
      const angleToEnemy = Math.atan2(enemy.pos.y - player.pos.y, enemy.pos.x - player.pos.x);
      const angleDiff = Math.abs(player.angle - angleToEnemy);
      if (angleDiff < Math.PI / 3 || angleDiff > Math.PI * 5 / 3) {
        // Check if backstab
        const enemyFacing = Math.atan2(Math.sin(enemy.angle), Math.cos(enemy.angle));
        const attackDir = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
        const backDiff = Math.abs(enemyFacing - attackDir);
        const isBackstab = backDiff < Math.PI / 2 || backDiff > Math.PI * 3 / 2;

        enemy.health -= isBackstab ? 180 : 40;
        enemy.state = 'chase';
        enemy.lastKnownPlayerPos = { ...player.pos };
        enemy.alertTimer = 5;

        // Blood
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
  const weaponDef = WEAPONS[player.weapon.id];
  if (!weaponDef) return;

  player.ammo--;
  player.shootCooldown = weaponDef.fireRate;
  player.inspecting = false;

  // Calculate spread with movement and spray
  let totalSpread = weaponDef.spread;
  if (player.isMoving) totalSpread += weaponDef.movementSpread;

  // Spray pattern recoil
  const shotIndex = Math.min(player.shotsFired, weaponDef.recoilPattern.length - 1);
  const verticalRecoil = weaponDef.recoilPattern[shotIndex] || 0;
  const horizontalRecoil = (Math.random() - 0.5) * weaponDef.recoilHorizontal * 0.02;

  player.recoilAngle += verticalRecoil * 0.01;
  player.shotsFired++;
  player.lastShotTime = performance.now() / 1000;

  const spread = (Math.random() - 0.5) * totalSpread + horizontalRecoil;
  const angle = player.angle + spread - player.recoilAngle;

  const result = raycast(player.pos, angle, weaponDef.range, gameMap.walls);

  // Check enemy hits
  let hitEnemy: Enemy | null = null;
  let hitDist = result.dist;
  const endX = player.pos.x + Math.cos(angle) * weaponDef.range;
  const endY = player.pos.y + Math.sin(angle) * weaponDef.range;

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
        }
      }
    }
  }

  const bulletEnd = hitEnemy
    ? { x: player.pos.x + Math.cos(angle) * hitDist, y: player.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  state.bullets.push({ start: { ...player.pos }, end: bulletEnd, time: 0, isEnemy: false });

  // Muzzle flash
  for (let i = 0; i < 3; i++) {
    state.particles.push({
      pos: { x: player.pos.x + Math.cos(angle) * 18, y: player.pos.y + Math.sin(angle) * 18 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 200, y: Math.sin(angle + (Math.random() - 0.5)) * 200 },
      life: 0, maxLife: 0.08, color: 'hsl(45, 100%, 70%)', size: 4,
    });
  }

  if (hitEnemy) {
    hitEnemy.health -= weaponDef.damage;
    hitEnemy.state = 'chase';
    hitEnemy.lastKnownPlayerPos = { ...player.pos };
    hitEnemy.alertTimer = 5;

    for (let i = 0; i < 5; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
        life: 0, maxLife: 0.3, color: 'hsl(0, 70%, 60%)', size: 3,
      });
    }
    state.bloodDecals.push({ pos: { ...bulletEnd }, alpha: 1 });

    if (hitEnemy.health <= 0) {
      hitEnemy.alive = false;
      state.killFeed.push({ killer: 'YOU', victim: `ENEMY_${hitEnemy.id}`, weapon: player.weapon.name, time: Date.now() });
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
}

function updateEnemies(state: GameState, dt: number) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    const canSeePlayer = state.player.alive &&
      distance(enemy.pos, state.player.pos) < 600 &&
      hasLineOfSight(enemy.pos, state.player.pos, gameMap.walls);

    if (canSeePlayer) {
      enemy.state = 'chase';
      enemy.lastKnownPlayerPos = { ...state.player.pos };
      enemy.alertTimer = 5;
    }

    enemy.alertTimer -= dt;
    if (enemy.alertTimer <= 0 && enemy.state !== 'patrol') {
      enemy.state = 'patrol';
      enemy.patrolTarget = randomPointInMap(gameMap.width, gameMap.height, gameMap.walls, enemy.radius);
    }

    let targetPos: Vec2;
    let moveSpeed = enemy.speed;

    if (enemy.state === 'chase' && enemy.lastKnownPlayerPos) {
      targetPos = canSeePlayer ? state.player.pos : enemy.lastKnownPlayerPos;
      const dist = distance(enemy.pos, targetPos);
      if (dist < 150 && canSeePlayer) moveSpeed = 0;
    } else {
      targetPos = enemy.patrolTarget;
      moveSpeed = enemy.speed * 0.5;
      if (distance(enemy.pos, enemy.patrolTarget) < 30) {
        enemy.patrolTarget = randomPointInMap(gameMap.width, gameMap.height, gameMap.walls, enemy.radius);
      }
    }

    if (moveSpeed > 0) {
      const dir = normalize({ x: targetPos.x - enemy.pos.x, y: targetPos.y - enemy.pos.y });
      const newX = enemy.pos.x + dir.x * moveSpeed * dt;
      const newY = enemy.pos.y + dir.y * moveSpeed * dt;
      let canX = true, canY = true;
      for (const wall of gameMap.walls) {
        if (circleRectCollision(newX, enemy.pos.y, enemy.radius, wall.x, wall.y, wall.w, wall.h)) canX = false;
        if (circleRectCollision(enemy.pos.x, newY, enemy.radius, wall.x, wall.y, wall.w, wall.h)) canY = false;
      }
      if (canX) enemy.pos.x = newX;
      if (canY) enemy.pos.y = newY;
    }

    if (canSeePlayer) {
      enemy.angle = Math.atan2(state.player.pos.y - enemy.pos.y, state.player.pos.x - enemy.pos.x);
    } else {
      enemy.angle = Math.atan2(targetPos.y - enemy.pos.y, targetPos.x - enemy.pos.x);
    }

    enemy.shootCooldown -= dt;
    if (canSeePlayer && enemy.shootCooldown <= 0) {
      enemyShoot(state, enemy);
    }
  }
}

function enemyShoot(state: GameState, enemy: Enemy) {
  enemy.shootCooldown = 0.4 + Math.random() * 0.3;
  const spread = (Math.random() - 0.5) * 0.12;
  const angle = enemy.angle + spread;
  const result = raycast(enemy.pos, angle, 800, gameMap.walls);

  let hitPlayer = false;
  let hitDist = result.dist;

  if (state.player.alive) {
    const dx2 = Math.cos(angle) * 800;
    const dy2 = Math.sin(angle) * 800;
    const fx = enemy.pos.x - state.player.pos.x;
    const fy = enemy.pos.y - state.player.pos.y;
    const a = dx2 * dx2 + dy2 * dy2;
    const b2 = 2 * (fx * dx2 + fy * dy2);
    const c = fx * fx + fy * fy - state.player.radius * state.player.radius;
    let disc = b2 * b2 - 4 * a * c;
    if (disc >= 0) {
      disc = Math.sqrt(disc);
      const t = (-b2 - disc) / (2 * a);
      if (t >= 0 && t <= 1) {
        const d = t * Math.sqrt(a);
        if (d < hitDist) { hitDist = d; hitPlayer = true; }
      }
    }
  }

  const bulletEnd = hitPlayer
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

  if (hitPlayer) {
    state.player.health -= 15;
    for (let i = 0; i < 4; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
        life: 0, maxLife: 0.25, color: 'hsl(0, 70%, 60%)', size: 3,
      });
    }
    state.bloodDecals.push({ pos: { ...bulletEnd }, alpha: 1 });

    if (state.player.health <= 0) {
      state.player.alive = false;
      state.roundStatus = 'dead';
      state.score.deaths++;
      state.killFeed.push({ killer: `ENEMY_${enemy.id}`, victim: 'YOU', weapon: 'AK-47', time: Date.now() });
    }
  }
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
  const targetX = state.player.pos.x - canvas.width / 2;
  const targetY = state.player.pos.y - canvas.height / 2;
  state.camera.x += (targetX - state.camera.x) * 0.1;
  state.camera.y += (targetY - state.camera.y) * 0.1;
  state.camera.x = Math.max(0, Math.min(gameMap.width - canvas.width, state.camera.x));
  state.camera.y = Math.max(0, Math.min(gameMap.height - canvas.height, state.camera.y));
}
