import { Player, Enemy, Bullet, Particle, KillFeedEntry, Vec2 } from './types';
import { gameMap } from './map';
import { distance, circleRectCollision, raycast, hasLineOfSight, randomPointInMap, normalize } from './utils';

const WEAPONS = {
  ak47: { name: 'AK-47', damage: 25, fireRate: 0.1, ammo: 30, maxAmmo: 30, spread: 0.04 },
};

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
  roundStatus: 'playing' | 'won' | 'dead';
  score: { kills: number; deaths: number };
  gamePhase: 'menu' | 'playing';
  hoveredButton: string | null;
  nextEnemyId: number;
}

export function createInitialState(): GameState {
  return {
    player: createPlayer(),
    enemies: [],
    bullets: [],
    particles: [],
    bloodDecals: [],
    killFeed: [],
    keys: new Set(),
    mousePos: { x: 0, y: 0 },
    mouseDown: false,
    camera: { x: 0, y: 0 },
    roundTime: 120,
    roundStatus: 'playing',
    score: { kills: 0, deaths: 0 },
    gamePhase: 'menu',
    hoveredButton: null,
    nextEnemyId: 0,
  };
}

function createPlayer(): Player {
  const wp = { ...WEAPONS.ak47 };
  return {
    pos: { ...gameMap.spawnPoints[0] },
    angle: 0,
    health: 100,
    maxHealth: 100,
    ammo: wp.ammo,
    maxAmmo: wp.maxAmmo,
    speed: 220,
    radius: 12,
    weapon: wp,
    alive: true,
    reloadTimer: 0,
    shootCooldown: 0,
  };
}

function createEnemy(id: number, pos: Vec2): Enemy {
  return {
    id,
    pos: { ...pos },
    angle: Math.random() * Math.PI * 2,
    health: 80,
    maxHealth: 80,
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
  state.player = createPlayer();
  state.bullets = [];
  state.particles = [];
  state.bloodDecals = [];
  state.roundTime = 120;
  state.roundStatus = 'playing';
  state.enemies = [];
  state.nextEnemyId = 0;

  for (const spawn of gameMap.enemySpawns) {
    state.enemies.push(createEnemy(state.nextEnemyId++, spawn));
  }
}

export function update(state: GameState, dt: number) {
  if (state.gamePhase !== 'playing' || state.roundStatus !== 'playing') return;

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

  // Movement (binary, no accel)
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy = -1;
  if (keys.has('s') || keys.has('arrowdown')) dy = 1;
  if (keys.has('a') || keys.has('arrowleft')) dx = -1;
  if (keys.has('d') || keys.has('arrowright')) dx = 1;

  if (dx !== 0 || dy !== 0) {
    const dir = normalize({ x: dx, y: dy });
    const newX = player.pos.x + dir.x * player.speed * dt;
    const newY = player.pos.y + dir.y * player.speed * dt;

    // Collision per axis
    let canX = true, canY = true;
    for (const wall of gameMap.walls) {
      if (circleRectCollision(newX, player.pos.y, player.radius, wall.x, wall.y, wall.w, wall.h)) canX = false;
      if (circleRectCollision(player.pos.x, newY, player.radius, wall.x, wall.y, wall.w, wall.h)) canY = false;
    }
    if (canX) player.pos.x = newX;
    if (canY) player.pos.y = newY;

    // Clamp to map
    player.pos.x = Math.max(player.radius, Math.min(gameMap.width - player.radius, player.pos.x));
    player.pos.y = Math.max(player.radius, Math.min(gameMap.height - player.radius, player.pos.y));
  }

  // Aim
  const worldMouse = {
    x: state.mousePos.x + state.camera.x,
    y: state.mousePos.y + state.camera.y,
  };
  player.angle = Math.atan2(worldMouse.y - player.pos.y, worldMouse.x - player.pos.x);

  // Reload
  if (player.reloadTimer > 0) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      player.ammo = player.maxAmmo;
    }
    return;
  }

  // Reload key
  if (keys.has('r') && player.ammo < player.maxAmmo) {
    player.reloadTimer = 2;
  }

  // Shoot
  player.shootCooldown -= dt;
  if (state.mouseDown && player.shootCooldown <= 0 && player.ammo > 0) {
    playerShoot(state);
  }

  // Auto reload on empty
  if (player.ammo <= 0 && player.reloadTimer <= 0) {
    player.reloadTimer = 2;
  }
}

function playerShoot(state: GameState) {
  const { player } = state;
  player.ammo--;
  player.shootCooldown = player.weapon.fireRate;

  const spread = (Math.random() - 0.5) * player.weapon.spread;
  const angle = player.angle + spread;

  const result = raycast(player.pos, angle, 1200, gameMap.walls);

  // Check enemy hits
  let hitEnemy: Enemy | null = null;
  let hitDist = result.dist;
  const endX = player.pos.x + Math.cos(angle) * 1200;
  const endY = player.pos.y + Math.sin(angle) * 1200;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    // Simple circle-line intersection
    const dx = endX - player.pos.x;
    const dy = endY - player.pos.y;
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
        }
      }
    }
  }

  const bulletEnd = hitEnemy
    ? { x: player.pos.x + Math.cos(angle) * hitDist, y: player.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  state.bullets.push({ start: { ...player.pos }, end: bulletEnd, time: 0, isEnemy: false });

  // Muzzle flash particles
  for (let i = 0; i < 3; i++) {
    state.particles.push({
      pos: { x: player.pos.x + Math.cos(angle) * 18, y: player.pos.y + Math.sin(angle) * 18 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 200, y: Math.sin(angle + (Math.random() - 0.5)) * 200 },
      life: 0, maxLife: 0.08,
      color: 'hsl(45, 100%, 70%)', size: 4,
    });
  }

  // Impact
  if (hitEnemy) {
    hitEnemy.health -= player.weapon.damage;
    hitEnemy.state = 'chase';
    hitEnemy.lastKnownPlayerPos = { ...player.pos };
    hitEnemy.alertTimer = 5;

    // Blood particles
    for (let i = 0; i < 5; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150 },
        life: 0, maxLife: 0.3,
        color: 'hsl(0, 70%, 60%)', size: 3,
      });
    }
    state.bloodDecals.push({ pos: { ...bulletEnd }, alpha: 1 });

    if (hitEnemy.health <= 0) {
      hitEnemy.alive = false;
      state.killFeed.push({ killer: 'YOU', victim: `ENEMY_${hitEnemy.id}`, weapon: player.weapon.name, time: Date.now() });
      state.score.kills++;
    }
  } else {
    // Wall impact particles
    for (let i = 0; i < 3; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
        life: 0, maxLife: 0.2,
        color: 'hsl(210, 10%, 50%)', size: 2,
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
      
      // Keep some distance
      const dist = distance(enemy.pos, targetPos);
      if (dist < 150 && canSeePlayer) {
        moveSpeed = 0; // Stop and shoot
      }
    } else {
      targetPos = enemy.patrolTarget;
      moveSpeed = enemy.speed * 0.5;
      if (distance(enemy.pos, enemy.patrolTarget) < 30) {
        enemy.patrolTarget = randomPointInMap(gameMap.width, gameMap.height, gameMap.walls, enemy.radius);
      }
    }

    // Move toward target
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

    // Aim at player
    if (canSeePlayer) {
      enemy.angle = Math.atan2(state.player.pos.y - enemy.pos.y, state.player.pos.x - enemy.pos.x);
    } else {
      enemy.angle = Math.atan2(targetPos.y - enemy.pos.y, targetPos.x - enemy.pos.x);
    }

    // Shoot
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

  // Check player hit
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
        if (d < hitDist) {
          hitDist = d;
          hitPlayer = true;
        }
      }
    }
  }

  const bulletEnd = hitPlayer
    ? { x: enemy.pos.x + Math.cos(angle) * hitDist, y: enemy.pos.y + Math.sin(angle) * hitDist }
    : result.hit;

  state.bullets.push({ start: { ...enemy.pos }, end: bulletEnd, time: 0, isEnemy: true });

  // Muzzle flash
  for (let i = 0; i < 2; i++) {
    state.particles.push({
      pos: { x: enemy.pos.x + Math.cos(angle) * 16, y: enemy.pos.y + Math.sin(angle) * 16 },
      vel: { x: Math.cos(angle + (Math.random() - 0.5)) * 150, y: Math.sin(angle + (Math.random() - 0.5)) * 150 },
      life: 0, maxLife: 0.06,
      color: 'hsl(45, 100%, 70%)', size: 3,
    });
  }

  if (hitPlayer) {
    state.player.health -= 15;
    for (let i = 0; i < 4; i++) {
      state.particles.push({
        pos: { ...bulletEnd },
        vel: { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
        life: 0, maxLife: 0.25,
        color: 'hsl(0, 70%, 60%)', size: 3,
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
