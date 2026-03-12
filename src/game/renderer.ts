import { Player, Enemy, Ally, Wall, Vec2 } from './types';
import { GameMap } from './types';
import { MAPS } from './map';
import { WEAPONS, BUY_CATEGORIES } from './weapons';
import { GameState } from './engine';
import { hasLineOfSight, distance } from './utils';
import { createConcreteTexture, createDustTexture } from './map';

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
  jumpable: 'hsl(45, 60%, 50%)',
  jumpableStroke: 'hsl(45, 80%, 65%)',
};

const FOV_HALF_ANGLE = Math.PI / 4;

let concreteTexture: CanvasPattern | null = null;
let dustTexture: CanvasPattern | null = null;

function initTextures(ctx: CanvasRenderingContext2D) {
  if (!concreteTexture) concreteTexture = createConcreteTexture(ctx, 64, 64);
  if (!dustTexture) dustTexture = createDustTexture(ctx);
}

function isInFOV(player: Player, targetPos: Vec2, walls: Wall[]): boolean {
  if (!player.alive) return true;
  const angle = Math.atan2(targetPos.y - player.pos.y, targetPos.x - player.pos.x);
  let diff = angle - player.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) < FOV_HALF_ANGLE && hasLineOfSight(player.pos, targetPos, walls);
}

function getCameraTarget(state: GameState): Vec2 {
  if (state.player.alive) return state.player.pos;
  const aliveAllies = state.allies.filter(a => a.alive);
  if (aliveAllies.length > 0) {
    const idx = Math.max(0, Math.min(state.spectatingIndex, aliveAllies.length - 1));
    return aliveAllies[idx].pos;
  }
  return state.player.pos;
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState,
  map: GameMap
) {
  const { player, enemies, allies, bullets, particles, bloodDecals, hitMarkers, mousePos, camera } = state;
  const w = canvas.width;
  const h = canvas.height;

  initTextures(ctx);

  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#1A2639');
  gradient.addColorStop(1, '#2A3A4A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  
  if (player.isScoped && player.alive) {
    const cx = w / 2, cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(2, 2);
    ctx.translate(-cx, -cy);
  }

  ctx.translate(-camera.x, -camera.y);

  // Ground texture
  ctx.fillStyle = map.groundTexture === 'dust' && dustTexture ? dustTexture : 
                  concreteTexture ? concreteTexture : '#5A5E6B';
  ctx.fillRect(0, 0, map.width, map.height);

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
    
    ctx.fillStyle = COLORS.bombSiteText;
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(site.label, site.pos.x, site.pos.y);
    ctx.setLineDash([]);
  }

  // Walls
  for (const wall of map.walls) {
    // Shadow
    ctx.shadowColor = COLORS.wallShadow;
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    ctx.fillStyle = wall.jumpable ? 'hsl(35, 30%, 38%)' : COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    if (wall.jumpable) {
      ctx.strokeStyle = COLORS.jumpableStroke;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      ctx.setLineDash([]);
      
      // Jump arrow
      ctx.fillStyle = 'hsla(45, 80%, 65%, 0.5)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲', wall.x + wall.w / 2, wall.y + wall.h / 2);
    } else {
      // Edge highlights
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
  }

  // Blood decals
  for (const d of bloodDecals) {
    ctx.fillStyle = `hsla(0, 70%, 30%, ${d.alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(d.pos.x, d.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bullet tracers
  for (const bullet of bullets) {
    const alpha = Math.max(0, 1 - bullet.time * 5);
    ctx.strokeStyle = bullet.isHeadshot ? `hsla(0, 100%, 60%, ${alpha})` : `hsla(45, 100%, 80%, ${alpha})`;
    ctx.lineWidth = bullet.isHeadshot ? 2.5 : 1.5;
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

  // Allies
  for (const ally of allies) {
    if (!ally.alive) continue;
    
    ctx.fillStyle = COLORS.allyColor;
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ally.pos.x, ally.pos.y, ally.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'hsl(40, 60%, 35%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ally.pos.x, ally.pos.y);
    ctx.lineTo(ally.pos.x + Math.cos(ally.angle) * (ally.radius + 8), 
               ally.pos.y + Math.sin(ally.angle) * (ally.radius + 8));
    ctx.stroke();
    
    // Health bar
    const bw = 22, bh = 2, bx = ally.pos.x - bw / 2, by = ally.pos.y + ally.radius + 5;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.healthBar;
    ctx.fillRect(bx, by, bw * (ally.health / ally.maxHealth), bh);
    
    // Name
    ctx.fillStyle = 'hsl(120, 60%, 55%)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ally.name, ally.pos.x, ally.pos.y - ally.radius - 4);
  }

  // Enemies
  const viewEntity = player.alive ? player : null;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (viewEntity && !isInFOV(viewEntity, e.pos, map.walls)) continue;

    ctx.fillStyle = COLORS.enemy;
    ctx.shadowColor = 'rgba(255,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'hsl(210, 70%, 40%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.pos.x, e.pos.y);
    ctx.lineTo(e.pos.x + Math.cos(e.angle) * (e.radius + 8), 
               e.pos.y + Math.sin(e.angle) * (e.radius + 8));
    ctx.stroke();
    
    // Health bar
    const bw = 22, bh = 2, bx = e.pos.x - bw / 2, by = e.pos.y + e.radius + 5;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(bx, by, bw * (e.health / e.maxHealth), bh);
  }

  // Player
  if (player.alive) {
    const radius = player.isCrouching ? player.radius * 0.85 : player.radius;
    const teamColor = player.team === 't' ? COLORS.tColor : COLORS.ctColor;

    // Jump shadow
    if (player.isJumping) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(player.pos.x, player.pos.y + 4, radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player body
    ctx.fillStyle = teamColor;
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 10;
    const drawY = player.isJumping ? player.pos.y - 4 : player.pos.y;
    ctx.beginPath();
    ctx.arc(player.pos.x, drawY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Crouch indicator
    if (player.isCrouching) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(player.pos.x, drawY, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Aim line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'hsl(30, 10%, 25%)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.pos.x, drawY);
    ctx.lineTo(player.pos.x + Math.cos(player.angle) * (radius + 12), 
               drawY + Math.sin(player.angle) * (radius + 12));
    ctx.stroke();

    // Health bar
    const bw = 28, bh = 3, bx = player.pos.x - bw / 2, by = drawY + radius + 6;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(bx, by, bw, bh);
    const hp = player.health / player.maxHealth;
    ctx.fillStyle = hp > 0.5 ? COLORS.healthBar : hp > 0.25 ? 'hsl(45, 80%, 50%)' : 'hsl(0, 70%, 50%)';
    ctx.fillRect(bx, by, bw * hp, bh);
    
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  // === HUD ===
  drawHUD(ctx, w, h, state, map, mousePos);

  // Scope overlay
  if (player.isScoped && player.alive) {
    drawScopeOverlay(ctx, w, h);
  }
}

function drawScopeOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.4;

  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, map: GameMap, mousePos: Vec2) {
  const { player, roundTime, roundStatus, score, killFeed } = state;

  // === CROSSHAIR - FIXED: Always at mouse position ===
  if (!player.isScoped) {
    const cx = mousePos.x, cy = mousePos.y;
    ctx.strokeStyle = COLORS.crosshair;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 5;
    
    // Outer crosshair
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy);
    ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();
    
    // Inner dot
    ctx.fillStyle = COLORS.crosshair;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }

  // Spectator text
  if (!player.alive && state.roundStatus === 'playing') {
    const aliveAllies = state.allies.filter(a => a.alive);
    if (aliveAllies.length > 0) {
      const idx = Math.max(0, Math.min(state.spectatingIndex, aliveAllies.length - 1));
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(w / 2 - 140, 40, 280, 30);
      ctx.fillStyle = 'hsl(210, 10%, 70%)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SPECTATING: ${aliveAllies[idx].name}`, w / 2, 60);
    }
  }

  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(w / 2 - 120, 0, 240, 35);
  
  ctx.fillStyle = COLORS.tColor;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${state.playerTeam === 't' ? state.roundsWon : state.roundsLost}`, w / 2 - 15, 24);
  
  ctx.fillStyle = COLORS.foreground;
  ctx.textAlign = 'center';
  ctx.font = '10px monospace';
  ctx.fillText(`R${state.currentRound}/${state.maxRounds}`, w / 2, 14);
  
  ctx.fillStyle = COLORS.ctColor;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${state.playerTeam === 'ct' ? state.roundsWon : state.roundsLost}`, w / 2 + 15, 24);

  // Round status
  if (roundStatus === 'won' || roundStatus === 'lost') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(w / 2 - 180, 40, 360, 40);
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = roundStatus === 'won' ? 'hsl(120, 60%, 50%)' : 'hsl(0, 70%, 55%)';
    ctx.fillText(roundStatus === 'won' ? 'ROUND WON' : 'ROUND LOST', w / 2, 66);
  }

  if (state.matchOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = state.roundsWon > state.roundsLost ? 'hsl(120, 60%, 50%)' : 'hsl(0, 70%, 55%)';
    ctx.fillText(state.roundsWon > state.roundsLost ? 'MATCH WON!' : 'MATCH LOST', w / 2, h / 2 - 20);
    ctx.fillStyle = COLORS.foreground;
    ctx.font = '14px monospace';
    ctx.fillText(`Final Score: ${state.roundsWon} - ${state.roundsLost}`, w / 2, h / 2 + 15);
    ctx.fillText(`K/D: ${score.kills}/${score.deaths}`, w / 2, h / 2 + 40);
    ctx.fillStyle = 'hsl(210, 10%, 55%)';
    ctx.font = '12px monospace';
    ctx.fillText('PRESS R TO PLAY AGAIN', w / 2, h / 2 + 70);
  }

  // Freeze time
  if (roundStatus === 'freezetime') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'hsl(45, 80%, 60%)';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FREEZE TIME: ${Math.ceil(state.freezeTimer)}`, w / 2, h / 2 - 20);
    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.foreground;
    ctx.fillText('Press B to open buy menu', w / 2, h / 2 + 10);
  }

  // Kill feed
  ctx.textAlign = 'right';
  ctx.font = '9px monospace';
  const now = Date.now();
  const visible = killFeed.filter(k => now - k.time < 5000).slice(-5);
  visible.forEach((k, i) => {
    ctx.globalAlpha = Math.max(0, 1 - (now - k.time) / 5000);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(w - 260, 8 + i * 18, 250, 15);
    ctx.fillStyle = k.killer === 'YOU' ? COLORS.tColor : k.killer.startsWith('ALLY') ? COLORS.allyColor : COLORS.enemy;
    const hs = k.headshot ? ' 💀' : '';
    ctx.fillText(`${k.killer} [${k.weapon}${hs}] ${k.victim}`, w - 14, 19 + i * 18);
  });
  ctx.globalAlpha = 1;

  // K/D
  ctx.textAlign = 'left';
  ctx.font = '10px monospace';
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText(`K:${score.kills} D:${score.deaths}`, 16, 22);

  // Bottom HUD
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, h - 65, w, 65);

  // Health
  ctx.fillStyle = COLORS.healthBar;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`♥ ${Math.max(0, player.health)}`, 16, h - 28);
  
  // Money
  ctx.fillStyle = COLORS.money;
  ctx.font = '12px monospace';
  ctx.fillText(`$${player.money}`, 16, h - 10);

  // Timer
  const minutes = Math.floor(Math.max(0, roundTime) / 60);
  const seconds = Math.floor(Math.max(0, roundTime) % 60);
  ctx.fillStyle = roundTime < 10 ? 'hsl(0, 70%, 55%)' : COLORS.foreground;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, w / 2, h - 20);

  // Weapon slots
  const slotX = w / 2 - 100, slotY = h - 55;
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
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[${s.label}] ${s.name}`, sx + 30, slotY + 12);
  });

  // Ammo
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.foreground;
  ctx.font = '11px monospace';
  ctx.fillText(player.weapon.name, w - 16, h - 45);
  
  if (player.weapon.id !== 'knife') {
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = player.ammo <= 5 ? 'hsl(0, 70%, 55%)' : COLORS.foreground;
    ctx.fillText(`${player.ammo}`, w - 55, h - 16);
    ctx.fillStyle = 'hsl(210, 10%, 50%)';
    ctx.font = '12px monospace';
    ctx.fillText(`/ ${player.reserveAmmo}`, w - 16, h - 16);
  }

  if (player.reloadTimer > 0) {
    ctx.fillStyle = 'hsl(45, 80%, 60%)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RELOADING...', w / 2, h - 78);
  }

  if (player.isCrouching) {
    ctx.fillStyle = 'hsl(210, 10%, 60%)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CROUCHING', 120, h - 28);
  }

  if (state.buyMenuOpen) renderBuyMenu(ctx, w, h, state);
  drawMinimap(ctx, w, h, state, map);
}

function drawMinimap(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, map: GameMap) {
  const size = 150;
  const x = w - size - 10;
  const y = 40;
  const scale = size / map.width;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
  ctx.fillStyle = 'hsl(35, 20%, 25%)';
  ctx.fillRect(x, y, size, size);

  // Walls
  ctx.fillStyle = 'hsl(30, 15%, 45%)';
  for (const wall of map.walls) {
    ctx.fillRect(x + wall.x * scale, y + wall.y * scale, 
                 Math.max(1, wall.w * scale), Math.max(1, wall.h * scale));
  }

  // Bomb sites
  for (const site of map.bombSites) {
    ctx.fillStyle = 'hsla(0, 80%, 50%, 0.3)';
    ctx.beginPath();
    ctx.arc(x + site.pos.x * scale, y + site.pos.y * scale, site.radius * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Allies
  for (const ally of state.allies) {
    if (!ally.alive) continue;
    ctx.fillStyle = 'hsl(120, 60%, 50%)';
    ctx.beginPath();
    ctx.arc(x + ally.pos.x * scale, y + ally.pos.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
   // === FOV CONE - ADD THIS RIGHT HERE ===
  // Draw the vision cone first (behind player but above ground)
  ctx.fillStyle = 'rgba(255, 255, 200, 0.08)';
  ctx.beginPath();
  ctx.moveTo(player.pos.x, player.pos.y);
  ctx.arc(player.pos.x, player.pos.y, 400, player.angle - FOV_HALF_ANGLE, player.angle + FOV_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  
  // Optional: Add a faint line at the edges of the cone
  ctx.strokeStyle = 'rgba(255, 255, 200, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(player.pos.x, player.pos.y);
  ctx.lineTo(player.pos.x + Math.cos(player.angle - FOV_HALF_ANGLE) * 400, 
             player.pos.y + Math.sin(player.angle - FOV_HALF_ANGLE) * 400);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(player.pos.x, player.pos.y);
  ctx.lineTo(player.pos.x + Math.cos(player.angle + FOV_HALF_ANGLE) * 400, 
             player.pos.y + Math.sin(player.angle + FOV_HALF_ANGLE) * 400);
  ctx.stroke();

  const radius = player.isCrouching ? player.radius * 0.85 : player.radius;
  const teamColor = player.team === 't' ? COLORS.tColor : COLORS.ctColor;

  // Jump shadow
  if (player.isJumping) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y + 4, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player body
  ctx.fillStyle = teamColor;
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  ctx.shadowBlur = 10;
  const drawY = player.isJumping ? player.pos.y - 4 : player.pos.y;
  ctx.beginPath();
  ctx.arc(player.pos.x, drawY, radius, 0, Math.PI * 2);
  ctx.fill();const camTarget = getCameraTarget(state);
  ctx.fillStyle = state.player.alive ? 'hsl(45, 100%, 60%)' : 'hsl(210, 10%, 60%)';
  ctx.beginPath();
  ctx.arc(x + camTarget.x * scale, y + camTarget.y * scale, 3, 0, Math.PI * 2);
  ctx.fill();
}

function renderBuyMenu(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, h);

  const menuW = 580, menuH = 420;
  const mx = w / 2 - menuW / 2, my = h / 2 - menuH / 2;

  ctx.fillStyle = 'hsl(220, 15%, 12%)';
  ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = 'hsl(210, 10%, 30%)';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, menuW, menuH);

  ctx.fillStyle = COLORS.foreground;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUY MENU', w / 2, my + 28);
  ctx.fillStyle = COLORS.money;
  ctx.font = '13px monospace';
  ctx.fillText(`$${state.player.money}`, w / 2, my + 46);

  BUY_CATEGORIES.forEach((cat, i) => {
    const y = my + 60 + i * 32;
    ctx.fillStyle = state.buyMenuCategory === i ? 'hsl(210, 20%, 25%)' : 'transparent';
    ctx.fillRect(mx + 10, y, 110, 28);
    ctx.fillStyle = state.buyMenuCategory === i ? 'hsl(45, 80%, 60%)' : COLORS.foreground;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}. ${cat.name}`, mx + 16, y + 18);
  });

  const category = BUY_CATEGORIES[state.buyMenuCategory];
  if (category) {
    category.weapons.forEach((weaponId, i) => {
      const def = WEAPONS[weaponId];
      if (!def) return;
      
      const y = my + 60 + i * 45;
      const selected = state.buyMenuSelection === i;
      const afford = state.player.money >= def.price;
      const wrong = def.side !== 'both' && def.side !== state.playerTeam;

      ctx.fillStyle = selected ? 'hsl(210, 20%, 22%)' : 'transparent';
      ctx.fillRect(mx + 130, y, 435, 40);
      
      if (selected) {
        ctx.strokeStyle = 'hsl(45, 80%, 50%)';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx + 130, y, 435, 40);
      }

      ctx.fillStyle = wrong ? 'hsl(0, 50%, 50%)' : afford ? COLORS.foreground : 'hsl(0, 0%, 40%)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(def.name, mx + 138, y + 16);
      
      ctx.fillStyle = afford ? COLORS.money : 'hsl(0, 50%, 50%)';
      ctx.font = '10px monospace';
      ctx.fillText(`$${def.price}`, mx + 138, y + 32);
      
      ctx.fillStyle = 'hsl(210, 10%, 50%)';
      ctx.font = '9px monospace';
      ctx.fillText(`DMG:${def.damage} | ${def.ammo}/${def.reserveAmmo}`, mx + 240, y + 16);
      
      if (wrong) ctx.fillText(`${def.side.toUpperCase()} only`, mx + 240, y + 32);
    });
  }

  ctx.fillStyle = 'hsl(210, 10%, 45%)';
  ctx.font = '9px monospace';
  ctx.fillText('1-5: Category | ↑↓: Select | ENTER: Buy | B/ESC: Close', w / 2, my + menuH - 12);
}

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  hoveredButton: string | null,
  state: GameState
) {
  const w = canvas.width, h = canvas.height;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#0F1A2F');
  gradient.addColorStop(1, '#1F2A3F');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, 60);

  // Menu items
  const menuItems = ['INVENTORY', 'LOADOUT', 'PLAY', 'NEWS'];
  menuItems.forEach((item, i) => {
    ctx.fillStyle = item === 'PLAY' ? '#3B82F6' : '#94A3B8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item, 150 + i * 120, 35);
  });

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('CAFE', w - 30, 35);

  // Title
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CS2D', w/2, h/2 - 140);

  // Map selection
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '18px monospace';
  ctx.fillText('SELECT MAP', w/2, h/2 - 70);

  for (let i = 0; i < MAPS.length; i++) {
    const x = w/2 - 150 + i * 200;
    const y = h/2 - 40;
    
    ctx.fillStyle = state.selectedMapIndex === i ? '#3B82F6' : '#1E293B';
    ctx.fillRect(x, y, 140, 40);
    
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '14px monospace';
    ctx.fillText(MAPS[i].name, x + 70, y + 25);
  }

  // Team selection
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '18px monospace';
  ctx.fillText('SELECT TEAM', w/2, h/2 + 30);

  const btnY = h/2 + 50;
  
  // T button
  ctx.fillStyle = state.playerTeam === 't' ? '#F97316' : '#1E293B';
  ctx.fillRect(w/2 - 160, btnY, 140, 50);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('TERRORIST', w/2 - 90, btnY + 32);
  
  // CT button
  ctx.fillStyle = state.playerTeam === 'ct' ? '#3B82F6' : '#1E293B';
  ctx.fillRect(w/2 + 20, btnY, 140, 50);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText('COUNTER-T', w/2 + 90, btnY + 32);

  // Sliders
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '14px monospace';
  ctx.fillText(`ENEMIES: ${state.enemyCount}`, w/2, h/2 + 120);

  const sliderW = 300;
  const sliderX = w/2 - sliderW/2;
  
  // Enemy slider
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(sliderX, h/2 + 130, sliderW, 8);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(sliderX, h/2 + 130, ((state.enemyCount - 1) / 9) * sliderW, 8);

  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(`ALLIES: ${state.allyCount}`, w/2, h/2 + 160);
  
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(sliderX, h/2 + 170, sliderW, 8);
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(sliderX, h/2 + 170, (state.allyCount / 9) * sliderW, 8);

  // Play button
  const btnW = 220, btnH = 60;
  const btnX = w/2 - btnW/2, btnY2 = h/2 + 210;
  
  ctx.fillStyle = hoveredButton === 'start' ? '#2563EB' : '#3B82F6';
  ctx.fillRect(btnX, btnY2, btnW, btnH);
  
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PLAY', w/2, btnY2 + 38);

  // Controls
  ctx.fillStyle = '#64748B';
  ctx.font = '12px monospace';
  ctx.fillText('WASD: Move | Mouse: Aim | R: Reload | B: Buy | F: Inspect', w/2, h/2 + 300);
  ctx.fillText('1/2/3: Weapons | Ctrl: Crouch | Space: Jump | RMB: Scope', w/2, h/2 + 320);
}
