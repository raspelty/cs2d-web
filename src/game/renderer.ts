import { Player, Enemy, Bullet, Particle, KillFeedEntry, Wall, Vec2 } from './types';
import { GameMap } from './types';
import { mapZones, mapCrates, MapZone, Crate } from './map';
import { WEAPONS, BUY_CATEGORIES, WeaponDef } from './weapons';
import { GameState } from './engine';
import { hasLineOfSight } from './utils';

const COLORS = {
  background: 'hsl(35, 30%, 25%)',
  foreground: 'hsl(210, 10%, 85%)',
  sand: 'hsl(38, 35%, 45%)',
  sandLight: 'hsl(40, 30%, 55%)',
  stone: 'hsl(30, 15%, 35%)',
  stoneLight: 'hsl(30, 12%, 45%)',
  concrete: 'hsl(25, 10%, 32%)',
  wood: 'hsl(25, 40%, 30%)',
  wall: 'hsl(30, 20%, 28%)',
  wallTop: 'hsl(30, 15%, 42%)',
  wallShadow: 'rgba(0,0,0,0.35)',
  accent: 'hsl(180, 50%, 55%)',
  ctColor: 'hsl(210, 70%, 55%)',
  tColor: 'hsl(40, 80%, 55%)',
  enemy: 'hsl(210, 70%, 55%)',
  muzzleFlash: 'hsl(45, 100%, 70%)',
  tracer: 'hsla(45, 100%, 80%, 0.6)',
  blood: 'hsla(0, 70%, 60%, 0.7)',
  bombSite: 'hsla(0, 80%, 50%, 0.12)',
  bombSiteStroke: 'hsla(0, 80%, 50%, 0.4)',
  bombSiteText: 'hsla(0, 80%, 50%, 0.2)',
  healthBar: 'hsl(120, 50%, 45%)',
  healthBarBg: 'hsla(220, 10%, 10%, 0.6)',
  ammoBar: 'hsl(45, 80%, 60%)',
  crosshair: 'hsla(120, 100%, 60%, 0.9)',
  money: 'hsl(120, 60%, 50%)',
  fogOfWar: 'rgba(0,0,0,0.85)',
};

const ZONE_COLORS: Record<string, string> = {
  sand: COLORS.sand,
  stone: COLORS.stone,
  wood: COLORS.wood,
  concrete: COLORS.concrete,
  bombsite: 'hsl(35, 25%, 40%)',
  spawn_t: 'hsl(35, 30%, 38%)',
  spawn_ct: 'hsl(210, 15%, 35%)',
};

// Canvas pattern cache
let sandPattern: CanvasPattern | null = null;

function createSandTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const size = 64;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const octx = offscreen.getContext('2d');
  if (!octx) return null;

  octx.fillStyle = COLORS.sand;
  octx.fillRect(0, 0, size, size);

  // Add noise dots
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = 40 + Math.random() * 20;
    octx.fillStyle = `hsl(38, 30%, ${brightness}%)`;
    octx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  return ctx.createPattern(offscreen, 'repeat');
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  player: Player,
  enemies: Enemy[],
  bullets: Bullet[],
  particles: Particle[],
  bloodDecals: { pos: Vec2; alpha: number }[],
  killFeed: KillFeedEntry[],
  map: GameMap,
  mousePos: Vec2,
  roundTime: number,
  roundStatus: string,
  score: { kills: number; deaths: number },
  camera: Vec2,
  state: GameState
) {
  const w = canvas.width;
  const h = canvas.height;

  // Init sand pattern
  if (!sandPattern) sandPattern = createSandTexture(ctx);

  // Dark background
  ctx.fillStyle = 'hsl(20, 10%, 12%)';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Floor base
  if (sandPattern) {
    ctx.fillStyle = sandPattern;
    ctx.fillRect(0, 0, map.width, map.height);
  } else {
    ctx.fillStyle = COLORS.sand;
    ctx.fillRect(0, 0, map.width, map.height);
  }

  // Zone overlays with labels
  for (const zone of mapZones) {
    ctx.fillStyle = ZONE_COLORS[zone.type] || COLORS.sand;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.globalAlpha = 1;

    if (zone.label) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.font = 'bold 24px "Roboto Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + zone.h / 2);
    }
  }

  // Bomb sites
  for (const site of map.bombSites) {
    ctx.fillStyle = COLORS.bombSite;
    ctx.beginPath();
    ctx.arc(site.pos.x, site.pos.y, site.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.bombSiteStroke;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.bombSiteText;
    ctx.font = 'bold 80px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(site.label, site.pos.x, site.pos.y);
  }

  // Blood decals
  for (const decal of bloodDecals) {
    ctx.fillStyle = `hsla(0, 70%, 30%, ${decal.alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(decal.pos.x, decal.pos.y, 6 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Walls with Dust 2 styling
  for (const wall of map.walls) {
    // Shadow
    ctx.fillStyle = COLORS.wallShadow;
    ctx.fillRect(wall.x + 4, wall.y + 4, wall.w, wall.h);

    // Wall body - brick/stone texture effect
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

    // Brick lines for larger walls
    if (wall.w > 40 || wall.h > 40) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.5;
      const brickSize = 20;
      if (wall.w > wall.h) {
        for (let bx = wall.x; bx < wall.x + wall.w; bx += brickSize) {
          ctx.beginPath();
          ctx.moveTo(bx, wall.y);
          ctx.lineTo(bx, wall.y + wall.h);
          ctx.stroke();
        }
      } else {
        for (let by = wall.y; by < wall.y + wall.h; by += brickSize) {
          ctx.beginPath();
          ctx.moveTo(wall.x, by);
          ctx.lineTo(wall.x + wall.w, by);
          ctx.stroke();
        }
      }
    }

    // Top/left edge highlight
    ctx.strokeStyle = COLORS.wallTop;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wall.x, wall.y);
    ctx.lineTo(wall.x + wall.w, wall.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wall.x, wall.y);
    ctx.lineTo(wall.x, wall.y + wall.h);
    ctx.stroke();
  }

  // Crates
  for (const crate of mapCrates) {
    const s = crate.size;
    if (crate.type === 'barrel') {
      ctx.fillStyle = 'hsl(30, 15%, 30%)';
      ctx.beginPath();
      ctx.arc(crate.pos.x, crate.pos.y, s / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'hsl(30, 10%, 22%)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      const color = crate.type === 'wooden' ? 'hsl(25, 40%, 32%)' : 'hsl(200, 10%, 40%)';
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(crate.pos.x - s / 2 + 3, crate.pos.y - s / 2 + 3, s, s);
      ctx.fillStyle = color;
      ctx.fillRect(crate.pos.x - s / 2, crate.pos.y - s / 2, s, s);
      // Cross on wooden crate
      if (crate.type === 'wooden') {
        ctx.strokeStyle = 'hsl(25, 30%, 25%)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(crate.pos.x - s / 2, crate.pos.y);
        ctx.lineTo(crate.pos.x + s / 2, crate.pos.y);
        ctx.moveTo(crate.pos.x, crate.pos.y - s / 2);
        ctx.lineTo(crate.pos.x, crate.pos.y + s / 2);
        ctx.stroke();
      }
    }
  }

  // Bullet tracers
  for (const bullet of bullets) {
    const alpha = Math.max(0, 1 - bullet.time * 5);
    ctx.strokeStyle = `hsla(45, 100%, 80%, ${alpha * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bullet.start.x, bullet.start.y);
    ctx.lineTo(bullet.end.x, bullet.end.y);
    ctx.stroke();
  }

  // Particles
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl(', 'hsla(');
    ctx.fillRect(p.pos.x - p.size / 2, p.pos.y - p.size / 2, p.size, p.size);
  }

  // FOV cone - only show enemies within player's view
  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;

    // Check if in player's field of view (120 degree cone + line of sight)
    const angleToEnemy = Math.atan2(e.pos.y - player.pos.y, e.pos.x - player.pos.x);
    let angleDiff = angleToEnemy - player.angle;
    // Normalize
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const inFOV = Math.abs(angleDiff) < Math.PI / 2.5; // ~72 degrees each side
    const canSee = inFOV && hasLineOfSight(player.pos, e.pos, map.walls);

    if (!canSee && player.alive) continue; // Hidden by FOV

    // Body
    ctx.fillStyle = COLORS.enemy;
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();

    // Direction
    ctx.strokeStyle = 'hsl(210, 70%, 40%)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.pos.x, e.pos.y);
    ctx.lineTo(e.pos.x + Math.cos(e.angle) * (e.radius + 8), e.pos.y + Math.sin(e.angle) * (e.radius + 8));
    ctx.stroke();

    // Health bar
    const barW = 24;
    const barH = 3;
    const barX = e.pos.x - barW / 2;
    const barY = e.pos.y + e.radius + 6;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(barX, barY, barW * (e.health / e.maxHealth), barH);

    ctx.fillStyle = COLORS.enemy;
    ctx.font = '8px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CT', e.pos.x, e.pos.y - e.radius - 5);
  }

  // Player
  if (player.alive) {
    // FOV cone visualization
    const fovAngle = Math.PI / 2.5;
    const fovDist = 500;
    ctx.fillStyle = 'rgba(255, 255, 200, 0.03)';
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.arc(player.pos.x, player.pos.y, fovDist, player.angle - fovAngle, player.angle + fovAngle);
    ctx.closePath();
    ctx.fill();

    // Player body
    const teamColor = player.team === 't' ? COLORS.tColor : COLORS.ctColor;
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Gun barrel
    ctx.strokeStyle = 'hsl(30, 10%, 25%)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(
      player.pos.x + Math.cos(player.angle) * (player.radius + 12),
      player.pos.y + Math.sin(player.angle) * (player.radius + 12)
    );
    ctx.stroke();

    // Weapon sprite (small rectangle)
    if (player.weapon.id === 'knife') {
      ctx.fillStyle = 'hsl(200, 10%, 60%)';
      const kx = player.pos.x + Math.cos(player.angle) * (player.radius + 4);
      const ky = player.pos.y + Math.sin(player.angle) * (player.radius + 4);
      ctx.save();
      ctx.translate(kx, ky);
      ctx.rotate(player.angle);
      ctx.fillRect(0, -2, 14, 4);
      ctx.restore();
    }

    // Health bar
    const barW = 30;
    const barH = 3;
    const hBarX = player.pos.x - barW / 2;
    const hBarY = player.pos.y + player.radius + 6;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(hBarX, hBarY, barW, barH);
    const healthPct = player.health / player.maxHealth;
    ctx.fillStyle = healthPct > 0.5 ? COLORS.healthBar : healthPct > 0.25 ? 'hsl(45, 80%, 50%)' : 'hsl(0, 70%, 50%)';
    ctx.fillRect(hBarX, hBarY, barW * healthPct, barH);
  }

  ctx.restore();

  // === HUD ===
  drawHUD(ctx, w, h, player, mousePos, roundTime, roundStatus, score, killFeed, state);
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  player: Player,
  mousePos: Vec2,
  roundTime: number,
  roundStatus: string,
  score: { kills: number; deaths: number },
  killFeed: KillFeedEntry[],
  state: GameState
) {
  // Crosshair (CS2 style)
  const cx = mousePos.x;
  const cy = mousePos.y;
  ctx.strokeStyle = COLORS.crosshair;
  ctx.lineWidth = 1;
  const gap = 4;
  const len = 8;
  ctx.beginPath();
  ctx.moveTo(cx - gap - len, cy); ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + len, cy);
  ctx.moveTo(cx, cy - gap - len); ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + gap + len);
  ctx.stroke();
  // Center dot
  ctx.fillStyle = COLORS.crosshair;
  ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);

  // Top bar (round time + score)
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(w / 2 - 100, 0, 200, 40);

  ctx.fillStyle = COLORS.foreground;
  ctx.font = '16px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  const minutes = Math.floor(Math.max(0, roundTime) / 60);
  const seconds = Math.floor(Math.max(0, roundTime) % 60);
  ctx.fillText(
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    w / 2, 26
  );

  // Freeze time overlay
  if (state.roundStatus === 'freezetime') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'hsl(45, 80%, 60%)';
    ctx.font = 'bold 24px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FREEZE TIME: ${Math.ceil(state.freezeTimer)}`, w / 2, h / 2 - 20);
    ctx.font = '14px "Roboto Mono", monospace';
    ctx.fillStyle = COLORS.foreground;
    ctx.fillText('Press B to open buy menu', w / 2, h / 2 + 10);
  }

  if (roundStatus !== 'playing' && roundStatus !== 'freezetime') {
    ctx.font = 'bold 20px "Roboto Mono", monospace';
    ctx.fillStyle = roundStatus === 'won' ? 'hsl(120, 60%, 50%)' : 'hsl(0, 70%, 55%)';
    ctx.textAlign = 'center';
    ctx.fillText(
      roundStatus === 'won' ? 'COUNTER-TERRORISTS WIN' : 'TERRORISTS WIN',
      w / 2, 70
    );
    ctx.fillStyle = 'hsl(210, 10%, 55%)';
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.fillText('PRESS R TO RESTART', w / 2, 95);
  }

  // Kill feed
  ctx.textAlign = 'right';
  ctx.font = '10px "Roboto Mono", monospace';
  const now = Date.now();
  const visibleKills = killFeed.filter(k => now - k.time < 5000).slice(-5);
  visibleKills.forEach((k, i) => {
    const alpha = Math.max(0, 1 - (now - k.time) / 5000);
    ctx.globalAlpha = alpha;
    // Kill feed background
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(w - 260, 8 + i * 22, 250, 18);
    ctx.fillStyle = k.killer === 'YOU' ? COLORS.tColor : COLORS.enemy;
    ctx.fillText(`${k.killer}  [${k.weapon}]  ${k.victim}`, w - 16, 22 + i * 22);
  });
  ctx.globalAlpha = 1;

  // Score (top left)
  ctx.textAlign = 'left';
  ctx.font = '11px "Roboto Mono", monospace';
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText(`K: ${score.kills}  D: ${score.deaths}`, 16, 26);

  // Bottom HUD bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, h - 70, w, 70);

  // Health + armor
  ctx.fillStyle = COLORS.healthBar;
  ctx.font = 'bold 20px "Roboto Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`♥ ${Math.max(0, player.health)}`, 20, h - 30);

  // Money
  ctx.fillStyle = COLORS.money;
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.fillText(`$${player.money}`, 20, h - 10);

  // Weapon + ammo (bottom right)
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.foreground;
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.fillText(player.weapon.name, w - 20, h - 45);

  if (player.weapon.id !== 'knife') {
    ctx.font = 'bold 22px "Roboto Mono", monospace';
    ctx.fillStyle = player.ammo <= 5 ? 'hsl(0, 70%, 55%)' : COLORS.foreground;
    ctx.fillText(`${player.ammo}`, w - 60, h - 18);
    ctx.fillStyle = 'hsl(210, 10%, 50%)';
    ctx.font = '14px "Roboto Mono", monospace';
    ctx.fillText(` / ${player.reserveAmmo}`, w - 20, h - 18);
  } else {
    ctx.font = 'bold 16px "Roboto Mono", monospace';
    ctx.fillStyle = 'hsl(200, 10%, 60%)';
    ctx.fillText('∞', w - 20, h - 18);
  }

  // Reload indicator
  if (player.reloadTimer > 0) {
    ctx.fillStyle = 'hsl(45, 80%, 60%)';
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RELOADING...', w / 2, h - 85);
  }

  // Inspect indicator
  if (player.inspecting) {
    ctx.fillStyle = 'hsl(210, 10%, 60%)';
    ctx.font = '10px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Inspecting...', w / 2, h - 85);
  }

  // Buy menu
  if (state.buyMenuOpen) {
    renderBuyMenu(ctx, w, h, state);
  }
}

function renderBuyMenu(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, h);

  const menuW = 600;
  const menuH = 450;
  const mx = w / 2 - menuW / 2;
  const my = h / 2 - menuH / 2;

  // Menu background
  ctx.fillStyle = 'hsl(220, 15%, 12%)';
  ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = 'hsl(210, 10%, 30%)';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, menuW, menuH);

  // Title
  ctx.fillStyle = COLORS.foreground;
  ctx.font = 'bold 18px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUY MENU', w / 2, my + 30);

  // Money display
  ctx.fillStyle = COLORS.money;
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.fillText(`$${state.player.money}`, w / 2, my + 50);

  // Categories on left
  const catX = mx + 10;
  const catW = 120;
  const catStartY = my + 70;

  for (let i = 0; i < BUY_CATEGORIES.length; i++) {
    const cat = BUY_CATEGORIES[i];
    const cy = catStartY + i * 35;
    const isSelected = state.buyMenuCategory === i;

    ctx.fillStyle = isSelected ? 'hsl(210, 20%, 25%)' : 'transparent';
    ctx.fillRect(catX, cy, catW, 30);

    ctx.fillStyle = isSelected ? 'hsl(45, 80%, 60%)' : COLORS.foreground;
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}. ${cat.name}`, catX + 8, cy + 20);
  }

  // Weapons list on right
  const wpX = mx + 145;
  const wpStartY = my + 70;
  const category = BUY_CATEGORIES[state.buyMenuCategory];

  if (category) {
    for (let i = 0; i < category.weapons.length; i++) {
      const wpId = category.weapons[i];
      const def = WEAPONS[wpId];
      if (!def) continue;

      const wy = wpStartY + i * 50;
      const isSelected = state.buyMenuSelection === i;
      const canAfford = state.player.money >= def.price;
      const wrongSide = def.side !== 'both' && def.side !== state.playerTeam;

      ctx.fillStyle = isSelected ? 'hsl(210, 20%, 22%)' : 'transparent';
      ctx.fillRect(wpX, wy, 440, 45);

      if (isSelected) {
        ctx.strokeStyle = 'hsl(45, 80%, 50%)';
        ctx.lineWidth = 1;
        ctx.strokeRect(wpX, wy, 440, 45);
      }

      // Weapon name
      ctx.fillStyle = wrongSide ? 'hsl(0, 50%, 50%)' : canAfford ? COLORS.foreground : 'hsl(0, 0%, 40%)';
      ctx.font = 'bold 12px "Roboto Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.name, wpX + 10, wy + 18);

      // Price
      ctx.fillStyle = canAfford ? COLORS.money : 'hsl(0, 50%, 50%)';
      ctx.font = '11px "Roboto Mono", monospace';
      ctx.fillText(`$${def.price}`, wpX + 10, wy + 35);

      // Stats
      ctx.fillStyle = 'hsl(210, 10%, 50%)';
      ctx.font = '10px "Roboto Mono", monospace';
      ctx.fillText(`DMG: ${def.damage}  |  ${def.ammo}/${def.reserveAmmo}  |  ROF: ${Math.round(1 / def.fireRate)}/s`, wpX + 120, wy + 18);

      if (wrongSide) {
        ctx.fillText(`${def.side.toUpperCase()} only`, wpX + 120, wy + 35);
      }
    }
  }

  // Instructions
  ctx.fillStyle = 'hsl(210, 10%, 45%)';
  ctx.font = '10px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('1-5: Category  |  ↑↓: Select  |  ENTER: Buy  |  B/ESC: Close', w / 2, my + menuH - 15);
}

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  hoveredButton: string | null,
  playerTeam: 'ct' | 't'
) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = 'hsl(20, 10%, 10%)';
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = 'hsl(45, 80%, 60%)';
  ctx.font = 'bold 42px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CS2D', w / 2, h / 2 - 130);

  ctx.fillStyle = 'hsl(38, 30%, 55%)';
  ctx.font = '13px "Roboto Mono", monospace';
  ctx.fillText('DUST II', w / 2, h / 2 - 100);

  // Team selection
  ctx.fillStyle = COLORS.foreground;
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.fillText('SELECT TEAM', w / 2, h / 2 - 60);

  // T button
  const btnW = 160;
  const btnH = 40;
  const tBtnX = w / 2 - btnW - 20;
  const tBtnY = h / 2 - 35;
  ctx.fillStyle = playerTeam === 't' ? 'hsl(40, 70%, 35%)' : 'hsl(40, 30%, 20%)';
  ctx.fillRect(tBtnX, tBtnY, btnW, btnH);
  ctx.strokeStyle = playerTeam === 't' ? COLORS.tColor : 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeRect(tBtnX, tBtnY, btnW, btnH);
  ctx.fillStyle = COLORS.tColor;
  ctx.font = '13px "Roboto Mono", monospace';
  ctx.fillText('TERRORIST', tBtnX + btnW / 2, tBtnY + 25);

  // CT button
  const ctBtnX = w / 2 + 20;
  ctx.fillStyle = playerTeam === 'ct' ? 'hsl(210, 50%, 25%)' : 'hsl(210, 20%, 18%)';
  ctx.fillRect(ctBtnX, tBtnY, btnW, btnH);
  ctx.strokeStyle = playerTeam === 'ct' ? COLORS.ctColor : 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeRect(ctBtnX, tBtnY, btnW, btnH);
  ctx.fillStyle = COLORS.ctColor;
  ctx.fillText('COUNTER-T', ctBtnX + btnW / 2, tBtnY + 25);

  // Start button
  const startW = 240;
  const startH = 48;
  const startX = w / 2 - startW / 2;
  const startY = h / 2 + 30;

  ctx.fillStyle = hoveredButton === 'start' ? 'hsl(30, 20%, 30%)' : 'hsl(30, 15%, 22%)';
  ctx.fillRect(startX, startY, startW, startH);
  ctx.fillStyle = COLORS.foreground;
  ctx.font = 'bold 14px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('START MATCH', w / 2, startY + 30);

  // Controls
  ctx.fillStyle = 'hsl(210, 10%, 40%)';
  ctx.font = '10px "Roboto Mono", monospace';
  ctx.fillText('WASD: Move | Mouse: Aim/Shoot | R: Reload | B: Buy | F: Inspect | 1-3: Switch', w / 2, h / 2 + 120);
}
