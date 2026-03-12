import { Player, Enemy, Ally, Bullet, Particle, KillFeedEntry, Wall, Vec2 } from './types';
import { GameMap } from './types';
import { mapZones, mapCrates } from './map';
import { WEAPONS, BUY_CATEGORIES } from './weapons';
import { GameState } from './engine';
import { hasLineOfSight } from './utils';

const COLORS = {
  background: 'hsl(35, 30%, 25%)',
  foreground: 'hsl(210, 10%, 85%)',
  sand: 'hsl(38, 35%, 45%)',
  stone: 'hsl(30, 15%, 35%)',
  concrete: 'hsl(25, 10%, 32%)',
  wood: 'hsl(25, 40%, 30%)',
  wall: 'hsl(30, 20%, 28%)',
  wallTop: 'hsl(30, 15%, 42%)',
  wallShadow: 'rgba(0,0,0,0.35)',
  ctColor: 'hsl(210, 70%, 55%)',
  tColor: 'hsl(40, 80%, 55%)',
  enemy: 'hsl(210, 70%, 55%)',
  bombSite: 'hsla(0, 80%, 50%, 0.12)',
  bombSiteStroke: 'hsla(0, 80%, 50%, 0.4)',
  bombSiteText: 'hsla(0, 80%, 50%, 0.2)',
  healthBar: 'hsl(120, 50%, 45%)',
  healthBarBg: 'hsla(220, 10%, 10%, 0.6)',
  crosshair: 'hsla(120, 100%, 60%, 0.9)',
  money: 'hsl(120, 60%, 50%)',
  allyColor: 'hsl(40, 80%, 55%)',
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

const FOV_HALF_ANGLE = Math.PI / 4; // 45 degrees each side = 90 total

let sandPattern: CanvasPattern | null = null;

function createSandTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const o = c.getContext('2d');
  if (!o) return null;
  o.fillStyle = COLORS.sand;
  o.fillRect(0, 0, size, size);
  for (let i = 0; i < 80; i++) {
    o.fillStyle = `hsl(38, 30%, ${40 + Math.random() * 20}%)`;
    o.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  return ctx.createPattern(c, 'repeat');
}

function isInFOV(player: Player, targetPos: Vec2, walls: Wall[]): boolean {
  if (!player.alive) return true;
  const angle = Math.atan2(targetPos.y - player.pos.y, targetPos.x - player.pos.x);
  let diff = angle - player.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) < FOV_HALF_ANGLE && hasLineOfSight(player.pos, targetPos, walls);
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState,
  map: GameMap
) {
  const { player, enemies, allies, bullets, particles, bloodDecals, killFeed,
    mousePos, roundTime, roundStatus, score, camera } = state;
  const w = canvas.width;
  const h = canvas.height;

  if (!sandPattern) sandPattern = createSandTexture(ctx);

  ctx.fillStyle = 'hsl(20, 10%, 12%)';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Floor
  if (sandPattern) { ctx.fillStyle = sandPattern; } else { ctx.fillStyle = COLORS.sand; }
  ctx.fillRect(0, 0, map.width, map.height);

  // Zones
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
  for (const d of bloodDecals) {
    ctx.fillStyle = `hsla(0, 70%, 30%, ${d.alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(d.pos.x, d.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Walls
  for (const wall of map.walls) {
    ctx.fillStyle = COLORS.wallShadow;
    ctx.fillRect(wall.x + 4, wall.y + 4, wall.w, wall.h);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    if (wall.w > 40 || wall.h > 40) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.5;
      const bs = 20;
      if (wall.w > wall.h) {
        for (let bx = wall.x; bx < wall.x + wall.w; bx += bs) {
          ctx.beginPath(); ctx.moveTo(bx, wall.y); ctx.lineTo(bx, wall.y + wall.h); ctx.stroke();
        }
      } else {
        for (let by = wall.y; by < wall.y + wall.h; by += bs) {
          ctx.beginPath(); ctx.moveTo(wall.x, by); ctx.lineTo(wall.x + wall.w, by); ctx.stroke();
        }
      }
    }
    ctx.strokeStyle = COLORS.wallTop;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(wall.x, wall.y); ctx.lineTo(wall.x + wall.w, wall.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wall.x, wall.y); ctx.lineTo(wall.x, wall.y + wall.h); ctx.stroke();
  }

  // Crates
  for (const crate of mapCrates) {
    const s = crate.size;
    if (crate.type === 'barrel') {
      ctx.fillStyle = 'hsl(30, 15%, 30%)';
      ctx.beginPath(); ctx.arc(crate.pos.x, crate.pos.y, s / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'hsl(30, 10%, 22%)'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(crate.pos.x - s / 2 + 3, crate.pos.y - s / 2 + 3, s, s);
      ctx.fillStyle = crate.type === 'wooden' ? 'hsl(25, 40%, 32%)' : 'hsl(200, 10%, 40%)';
      ctx.fillRect(crate.pos.x - s / 2, crate.pos.y - s / 2, s, s);
      if (crate.type === 'wooden') {
        ctx.strokeStyle = 'hsl(25, 30%, 25%)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(crate.pos.x - s / 2, crate.pos.y); ctx.lineTo(crate.pos.x + s / 2, crate.pos.y);
        ctx.moveTo(crate.pos.x, crate.pos.y - s / 2); ctx.lineTo(crate.pos.x, crate.pos.y + s / 2);
        ctx.stroke();
      }
    }
  }

  // Tracers
  for (const bullet of bullets) {
    const alpha = Math.max(0, 1 - bullet.time * 5);
    ctx.strokeStyle = `hsla(45, 100%, 80%, ${alpha * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bullet.start.x, bullet.start.y); ctx.lineTo(bullet.end.x, bullet.end.y); ctx.stroke();
  }

  // Particles
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl(', 'hsla(');
    ctx.fillRect(p.pos.x - p.size / 2, p.pos.y - p.size / 2, p.size, p.size);
  }

  // Allies
  for (const ally of allies) {
    if (!ally.alive) continue;
    ctx.fillStyle = COLORS.allyColor;
    ctx.beginPath(); ctx.arc(ally.pos.x, ally.pos.y, ally.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'hsl(40, 60%, 35%)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ally.pos.x, ally.pos.y);
    ctx.lineTo(ally.pos.x + Math.cos(ally.angle) * (ally.radius + 8), ally.pos.y + Math.sin(ally.angle) * (ally.radius + 8));
    ctx.stroke();
    // Health bar
    const bw = 22, bh = 2, bx = ally.pos.x - bw / 2, by = ally.pos.y + ally.radius + 5;
    ctx.fillStyle = COLORS.healthBarBg; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.healthBar; ctx.fillRect(bx, by, bw * (ally.health / ally.maxHealth), bh);
    ctx.fillStyle = COLORS.allyColor; ctx.font = '7px "Roboto Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('ALLY', ally.pos.x, ally.pos.y - ally.radius - 4);
  }

  // Enemies (only in FOV)
  for (const e of enemies) {
    if (!e.alive) continue;
    if (player.alive && !isInFOV(player, e.pos, map.walls)) continue;

    ctx.fillStyle = COLORS.enemy;
    ctx.beginPath(); ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'hsl(210, 70%, 40%)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(e.pos.x, e.pos.y);
    ctx.lineTo(e.pos.x + Math.cos(e.angle) * (e.radius + 8), e.pos.y + Math.sin(e.angle) * (e.radius + 8));
    ctx.stroke();
    const bw = 22, bh = 2, bx = e.pos.x - bw / 2, by = e.pos.y + e.radius + 5;
    ctx.fillStyle = COLORS.healthBarBg; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.enemy; ctx.fillRect(bx, by, bw * (e.health / e.maxHealth), bh);
    ctx.fillStyle = COLORS.enemy; ctx.font = '7px "Roboto Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('CT', e.pos.x, e.pos.y - e.radius - 4);
  }

  // Player
  if (player.alive) {
    // FOV cone
    ctx.fillStyle = 'rgba(255, 255, 200, 0.025)';
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.arc(player.pos.x, player.pos.y, 350, player.angle - FOV_HALF_ANGLE, player.angle + FOV_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();

    // Body
    const radius = player.isCrouching ? player.radius * 0.85 : player.radius;
    const teamColor = player.team === 't' ? COLORS.tColor : COLORS.ctColor;

    // Jump effect
    if (player.isJumping) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(player.pos.x, player.pos.y + 4, radius * 0.8, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = teamColor;
    ctx.beginPath();
    const drawY = player.isJumping ? player.pos.y - 4 : player.pos.y;
    ctx.arc(player.pos.x, drawY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Crouch indicator
    if (player.isCrouching) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(player.pos.x, drawY, radius + 3, 0, Math.PI * 2); ctx.stroke();
    }

    // Gun barrel
    ctx.strokeStyle = 'hsl(30, 10%, 25%)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(player.pos.x, drawY);
    ctx.lineTo(player.pos.x + Math.cos(player.angle) * (radius + 12), drawY + Math.sin(player.angle) * (radius + 12));
    ctx.stroke();

    // Knife sprite
    if (player.activeSlot === 'knife') {
      ctx.fillStyle = 'hsl(200, 10%, 60%)';
      const kx = player.pos.x + Math.cos(player.angle) * (radius + 4);
      const ky = drawY + Math.sin(player.angle) * (radius + 4);
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(player.angle);
      ctx.fillRect(0, -2, 14, 4); ctx.restore();
    }

    // Health bar
    const bw = 28, bh = 3, bx = player.pos.x - bw / 2, by = drawY + radius + 6;
    ctx.fillStyle = COLORS.healthBarBg; ctx.fillRect(bx, by, bw, bh);
    const hp = player.health / player.maxHealth;
    ctx.fillStyle = hp > 0.5 ? COLORS.healthBar : hp > 0.25 ? 'hsl(45, 80%, 50%)' : 'hsl(0, 70%, 50%)';
    ctx.fillRect(bx, by, bw * hp, bh);
  }

  ctx.restore();

  // === HUD ===
  drawHUD(ctx, w, h, state, map);
}

function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, map: GameMap) {
  const { player, mousePos, roundTime, roundStatus, score, killFeed } = state;

  // Crosshair
  const cx = mousePos.x, cy = mousePos.y;
  ctx.strokeStyle = COLORS.crosshair; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 12, cy);
  ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 4);
  ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 12);
  ctx.stroke();

  // Top center - Round info
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(w / 2 - 120, 0, 240, 35);

  ctx.fillStyle = COLORS.tColor; ctx.font = 'bold 14px "Roboto Mono", monospace'; ctx.textAlign = 'right';
  ctx.fillText(`${state.playerTeam === 't' ? state.roundsWon : state.roundsLost}`, w / 2 - 15, 24);
  ctx.fillStyle = COLORS.foreground; ctx.textAlign = 'center'; ctx.font = '10px "Roboto Mono", monospace';
  ctx.fillText(`R${state.currentRound}/${state.maxRounds}`, w / 2, 14);
  ctx.fillStyle = COLORS.ctColor; ctx.font = 'bold 14px "Roboto Mono", monospace'; ctx.textAlign = 'left';
  ctx.fillText(`${state.playerTeam === 'ct' ? state.roundsWon : state.roundsLost}`, w / 2 + 15, 24);

  // Round status messages
  if (roundStatus === 'won' || roundStatus === 'lost') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(w / 2 - 180, 40, 360, 40);
    ctx.font = 'bold 18px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = roundStatus === 'won' ? 'hsl(120, 60%, 50%)' : 'hsl(0, 70%, 55%)';
    ctx.fillText(roundStatus === 'won' ? 'ROUND WON' : 'ROUND LOST', w / 2, 66);
  }

  if (state.matchOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold 32px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = state.roundsWon > state.roundsLost ? 'hsl(120, 60%, 50%)' : 'hsl(0, 70%, 55%)';
    ctx.fillText(state.roundsWon > state.roundsLost ? 'MATCH WON!' : 'MATCH LOST', w / 2, h / 2 - 20);
    ctx.fillStyle = COLORS.foreground; ctx.font = '14px "Roboto Mono", monospace';
    ctx.fillText(`Final Score: ${state.roundsWon} - ${state.roundsLost}`, w / 2, h / 2 + 15);
    ctx.fillText(`K/D: ${score.kills}/${score.deaths}`, w / 2, h / 2 + 40);
    ctx.fillStyle = 'hsl(210, 10%, 55%)'; ctx.font = '12px "Roboto Mono", monospace';
    ctx.fillText('PRESS R TO PLAY AGAIN', w / 2, h / 2 + 70);
  }

  // Freeze time
  if (roundStatus === 'freezetime' as any) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'hsl(45, 80%, 60%)'; ctx.font = 'bold 24px "Roboto Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText(`FREEZE TIME: ${Math.ceil(state.freezeTimer)}`, w / 2, h / 2 - 20);
    ctx.font = '14px "Roboto Mono", monospace'; ctx.fillStyle = COLORS.foreground;
    ctx.fillText('Press B to open buy menu', w / 2, h / 2 + 10);
  }

  // Kill feed (top right)
  ctx.textAlign = 'right'; ctx.font = '9px "Roboto Mono", monospace';
  const now = Date.now();
  const visible = killFeed.filter(k => now - k.time < 5000).slice(-5);
  visible.forEach((k, i) => {
    ctx.globalAlpha = Math.max(0, 1 - (now - k.time) / 5000);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(w - 240, 8 + i * 18, 230, 15);
    ctx.fillStyle = k.killer === 'YOU' ? COLORS.tColor : k.killer.startsWith('ALLY') ? COLORS.allyColor : COLORS.enemy;
    ctx.fillText(`${k.killer} [${k.weapon}] ${k.victim}`, w - 14, 19 + i * 18);
  });
  ctx.globalAlpha = 1;

  // K/D top left
  ctx.textAlign = 'left'; ctx.font = '10px "Roboto Mono", monospace'; ctx.fillStyle = COLORS.foreground;
  ctx.fillText(`K:${score.kills} D:${score.deaths}`, 16, 22);

  // Bottom HUD
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, h - 65, w, 65);

  // Health
  ctx.fillStyle = COLORS.healthBar; ctx.font = 'bold 18px "Roboto Mono", monospace'; ctx.textAlign = 'left';
  ctx.fillText(`♥ ${Math.max(0, player.health)}`, 16, h - 28);
  // Money
  ctx.fillStyle = COLORS.money; ctx.font = '12px "Roboto Mono", monospace';
  ctx.fillText(`$${player.money}`, 16, h - 10);

  // Timer at bottom center
  const minutes = Math.floor(Math.max(0, roundTime) / 60);
  const seconds = Math.floor(Math.max(0, roundTime) % 60);
  ctx.fillStyle = roundTime < 10 ? 'hsl(0, 70%, 55%)' : COLORS.foreground;
  ctx.font = 'bold 16px "Roboto Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, w / 2, h - 20);

  // Weapon slots indicator (bottom center-left)
  const slotX = w / 2 - 100;
  const slotY = h - 55;
  const slots = [
    { label: '1', name: player.primaryWeapon?.name || '—', active: player.activeSlot === 'primary', has: !!player.primaryWeapon },
    { label: '2', name: player.secondaryWeapon?.name || '—', active: player.activeSlot === 'secondary', has: !!player.secondaryWeapon },
    { label: '3', name: 'Knife', active: player.activeSlot === 'knife', has: true },
  ];
  slots.forEach((s, i) => {
    const sx = slotX + i * 65;
    ctx.fillStyle = s.active ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx, slotY, 60, 18);
    ctx.fillStyle = s.active ? 'hsl(45, 80%, 60%)' : s.has ? 'hsl(210, 10%, 50%)' : 'hsl(210, 10%, 30%)';
    ctx.font = '8px "Roboto Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText(`[${s.label}] ${s.name}`, sx + 30, slotY + 12);
  });

  // Ammo (bottom right)
  ctx.textAlign = 'right'; ctx.fillStyle = COLORS.foreground;
  ctx.font = '11px "Roboto Mono", monospace';
  ctx.fillText(player.weapon.name, w - 16, h - 45);
  if (player.weapon.id !== 'knife') {
    ctx.font = 'bold 20px "Roboto Mono", monospace';
    ctx.fillStyle = player.ammo <= 5 ? 'hsl(0, 70%, 55%)' : COLORS.foreground;
    ctx.fillText(`${player.ammo}`, w - 55, h - 16);
    ctx.fillStyle = 'hsl(210, 10%, 50%)'; ctx.font = '12px "Roboto Mono", monospace';
    ctx.fillText(`/ ${player.reserveAmmo}`, w - 16, h - 16);
  }

  if (player.reloadTimer > 0) {
    ctx.fillStyle = 'hsl(45, 80%, 60%)'; ctx.font = '11px "Roboto Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('RELOADING...', w / 2, h - 78);
  }

  if (player.isCrouching) {
    ctx.fillStyle = 'hsl(210, 10%, 60%)'; ctx.font = '9px "Roboto Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('CROUCHING', 120, h - 28);
  }

  if (state.buyMenuOpen) renderBuyMenu(ctx, w, h, state);
}

function renderBuyMenu(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, h);

  const menuW = 580, menuH = 420;
  const mx = w / 2 - menuW / 2, my = h / 2 - menuH / 2;

  ctx.fillStyle = 'hsl(220, 15%, 12%)'; ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = 'hsl(210, 10%, 30%)'; ctx.lineWidth = 2; ctx.strokeRect(mx, my, menuW, menuH);

  ctx.fillStyle = COLORS.foreground; ctx.font = 'bold 16px "Roboto Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText('BUY MENU', w / 2, my + 28);
  ctx.fillStyle = COLORS.money; ctx.font = '13px "Roboto Mono", monospace';
  ctx.fillText(`$${state.player.money}`, w / 2, my + 46);

  const catX = mx + 10, catW = 110, catStartY = my + 60;
  for (let i = 0; i < BUY_CATEGORIES.length; i++) {
    const cy = catStartY + i * 32;
    ctx.fillStyle = state.buyMenuCategory === i ? 'hsl(210, 20%, 25%)' : 'transparent';
    ctx.fillRect(catX, cy, catW, 28);
    ctx.fillStyle = state.buyMenuCategory === i ? 'hsl(45, 80%, 60%)' : COLORS.foreground;
    ctx.font = '11px "Roboto Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}. ${BUY_CATEGORIES[i].name}`, catX + 6, cy + 18);
  }

  const wpX = mx + 130, wpStartY = my + 60;
  const category = BUY_CATEGORIES[state.buyMenuCategory];
  if (category) {
    for (let i = 0; i < category.weapons.length; i++) {
      const def = WEAPONS[category.weapons[i]];
      if (!def) continue;
      const wy = wpStartY + i * 45;
      const sel = state.buyMenuSelection === i;
      const afford = state.player.money >= def.price;
      const wrong = def.side !== 'both' && def.side !== state.playerTeam;

      ctx.fillStyle = sel ? 'hsl(210, 20%, 22%)' : 'transparent';
      ctx.fillRect(wpX, wy, 435, 40);
      if (sel) { ctx.strokeStyle = 'hsl(45, 80%, 50%)'; ctx.lineWidth = 1; ctx.strokeRect(wpX, wy, 435, 40); }

      ctx.fillStyle = wrong ? 'hsl(0, 50%, 50%)' : afford ? COLORS.foreground : 'hsl(0, 0%, 40%)';
      ctx.font = 'bold 11px "Roboto Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillText(def.name, wpX + 8, wy + 16);
      ctx.fillStyle = afford ? COLORS.money : 'hsl(0, 50%, 50%)';
      ctx.font = '10px "Roboto Mono", monospace';
      ctx.fillText(`$${def.price}`, wpX + 8, wy + 32);
      ctx.fillStyle = 'hsl(210, 10%, 50%)'; ctx.font = '9px "Roboto Mono", monospace';
      ctx.fillText(`DMG:${def.damage} | ${def.ammo}/${def.reserveAmmo} | ROF:${Math.round(1 / def.fireRate)}/s`, wpX + 110, wy + 16);
      if (wrong) ctx.fillText(`${def.side.toUpperCase()} only`, wpX + 110, wy + 32);
    }
  }

  ctx.fillStyle = 'hsl(210, 10%, 45%)'; ctx.font = '9px "Roboto Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText('1-5: Category | ↑↓: Select | ENTER: Buy | B/ESC: Close', w / 2, my + menuH - 12);
}

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  hoveredButton: string | null,
  state: GameState
) {
  const w = canvas.width, h = canvas.height;

  ctx.fillStyle = 'hsl(20, 10%, 10%)'; ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'hsl(45, 80%, 60%)'; ctx.font = 'bold 42px "Roboto Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText('CS2D', w / 2, h / 2 - 160);
  ctx.fillStyle = 'hsl(38, 30%, 55%)'; ctx.font = '13px "Roboto Mono", monospace';
  ctx.fillText('DUST II', w / 2, h / 2 - 130);

  // Team selection
  ctx.fillStyle = COLORS.foreground; ctx.font = '13px "Roboto Mono", monospace';
  ctx.fillText('SELECT TEAM', w / 2, h / 2 - 90);

  const btnW = 150, btnH = 36;
  const tBtnX = w / 2 - btnW - 15, tBtnY = h / 2 - 70;
  ctx.fillStyle = state.playerTeam === 't' ? 'hsl(40, 70%, 35%)' : 'hsl(40, 30%, 20%)';
  ctx.fillRect(tBtnX, tBtnY, btnW, btnH);
  if (state.playerTeam === 't') { ctx.strokeStyle = COLORS.tColor; ctx.lineWidth = 2; ctx.strokeRect(tBtnX, tBtnY, btnW, btnH); }
  ctx.fillStyle = COLORS.tColor; ctx.font = '12px "Roboto Mono", monospace';
  ctx.fillText('TERRORIST', tBtnX + btnW / 2, tBtnY + 23);

  const ctBtnX = w / 2 + 15;
  ctx.fillStyle = state.playerTeam === 'ct' ? 'hsl(210, 50%, 25%)' : 'hsl(210, 20%, 18%)';
  ctx.fillRect(ctBtnX, tBtnY, btnW, btnH);
  if (state.playerTeam === 'ct') { ctx.strokeStyle = COLORS.ctColor; ctx.lineWidth = 2; ctx.strokeRect(ctBtnX, tBtnY, btnW, btnH); }
  ctx.fillStyle = COLORS.ctColor;
  ctx.fillText('COUNTER-T', ctBtnX + btnW / 2, tBtnY + 23);

  // Enemy count slider
  ctx.fillStyle = COLORS.foreground; ctx.font = '11px "Roboto Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText(`Enemies: ${state.enemyCount}`, w / 2, h / 2 - 15);

  // Slider
  const sliderW = 200, sliderX = w / 2 - sliderW / 2, sliderY = h / 2 - 5;
  ctx.fillStyle = 'hsl(220, 10%, 25%)'; ctx.fillRect(sliderX, sliderY, sliderW, 8);
  const knobX = sliderX + ((state.enemyCount - 1) / 9) * sliderW;
  ctx.fillStyle = 'hsl(45, 80%, 60%)';
  ctx.beginPath(); ctx.arc(knobX, sliderY + 4, 8, 0, Math.PI * 2); ctx.fill();
  // Notches
  for (let i = 1; i <= 10; i++) {
    const nx = sliderX + ((i - 1) / 9) * sliderW;
    ctx.fillStyle = 'hsl(210, 10%, 40%)'; ctx.font = '8px "Roboto Mono", monospace';
    ctx.fillText(`${i}`, nx, sliderY + 22);
  }

  // Ally count
  ctx.fillStyle = COLORS.foreground; ctx.font = '11px "Roboto Mono", monospace';
  ctx.fillText(`Allies: ${state.allyCount}`, w / 2, h / 2 + 35);
  const aSliderY = h / 2 + 45;
  ctx.fillStyle = 'hsl(220, 10%, 25%)'; ctx.fillRect(sliderX, aSliderY, sliderW, 8);
  const aKnobX = sliderX + (state.allyCount / 9) * sliderW;
  ctx.fillStyle = 'hsl(40, 80%, 55%)';
  ctx.beginPath(); ctx.arc(aKnobX, aSliderY + 4, 8, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i <= 9; i++) {
    const nx = sliderX + (i / 9) * sliderW;
    ctx.fillStyle = 'hsl(210, 10%, 40%)'; ctx.font = '8px "Roboto Mono", monospace';
    ctx.fillText(`${i}`, nx, aSliderY + 22);
  }

  // Start button
  const startW = 220, startH = 44;
  const startX = w / 2 - startW / 2, startY = h / 2 + 80;
  ctx.fillStyle = hoveredButton === 'start' ? 'hsl(30, 20%, 30%)' : 'hsl(30, 15%, 22%)';
  ctx.fillRect(startX, startY, startW, startH);
  ctx.fillStyle = COLORS.foreground; ctx.font = 'bold 14px "Roboto Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText('START MATCH', w / 2, startY + 28);

  // Controls
  ctx.fillStyle = 'hsl(210, 10%, 35%)'; ctx.font = '9px "Roboto Mono", monospace';
  ctx.fillText('WASD: Move | Mouse: Aim/Shoot | R: Reload | B: Buy | F: Inspect', w / 2, h / 2 + 155);
  ctx.fillText('1/2/3: Switch Weapons | Ctrl: Crouch | Space: Jump', w / 2, h / 2 + 170);
}
