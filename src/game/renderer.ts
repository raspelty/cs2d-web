import { Player, Enemy, Ally, Wall, Vec2 } from './types';
import { GameMap } from './types';
import { MAPS } from './map';
import { WEAPONS, BUY_CATEGORIES } from './weapons';
import { GameState } from './engine';
import { hasLineOfSight, distance } from './utils';

const COLORS = {
  background: '#0F172A',
  foreground: '#F8FAFC',
  ctBlue: '#3B82F6',
  tOrange: '#F97316',
  enemy: '#EF4444',
  ally: '#22C55E',
  health: '#22C55E',
  healthBg: '#334155',
  money: '#FBBF24',
  bombRed: '#EF4444',
  bombLight: 'rgba(239, 68, 68, 0.2)',
  wall: '#475569',
  wallLight: '#64748B',
};

const FOV_HALF_ANGLE = Math.PI / 4;

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

  // Sky
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  
  if (player.isScoped && player.alive) {
    const cx = w / 2, cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(2, 2);
    ctx.translate(-cx, -cy);
  }

  ctx.translate(-camera.x, -camera.y);

  // Ground
  ctx.fillStyle = map.groundTexture === 'dust' ? '#C9A87C' : '#394456';
  ctx.fillRect(0, 0, map.width, map.height);

  // Grid pattern (light)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < map.width; i += 100) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, map.height);
    ctx.stroke();
  }
  for (let i = 0; i < map.height; i += 100) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(map.width, i);
    ctx.stroke();
  }

  // Bomb sites
  for (const site of map.bombSites) {
    ctx.fillStyle = COLORS.bombLight;
    ctx.beginPath();
    ctx.arc(site.pos.x, site.pos.y, site.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = COLORS.bombRed;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    
    ctx.fillStyle = COLORS.bombRed;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.3;
    ctx.fillText(site.label, site.pos.x, site.pos.y);
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  // Walls
  for (const wall of map.walls) {
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = wall.jumpable ? '#9CA3AF' : COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Edge highlight
    ctx.strokeStyle = wall.jumpable ? '#FBBF24' : COLORS.wallLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }

  // Blood
  for (const d of bloodDecals) {
    ctx.fillStyle = `rgba(185, 28, 28, ${d.alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(d.pos.x, d.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bullets
  for (const bullet of bullets) {
    const alpha = Math.max(0, 1 - bullet.time * 5);
    ctx.strokeStyle = bullet.isHeadshot ? `rgba(239, 68, 68, ${alpha})` : `rgba(250, 204, 21, ${alpha})`;
    ctx.lineWidth = bullet.isHeadshot ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(bullet.start.x, bullet.start.y);
    ctx.lineTo(bullet.end.x, bullet.end.y);
    ctx.stroke();
  }

  // Particles
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(p.pos.x - p.size/2, p.pos.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Allies
  for (const ally of allies) {
    if (!ally.alive) continue;
    
    ctx.fillStyle = COLORS.ally;
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ally.pos.x, ally.pos.y, ally.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Enemies
  const viewEntity = player.alive ? player : null;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (viewEntity && !isInFOV(viewEntity, e.pos, map.walls)) continue;

    ctx.fillStyle = COLORS.enemy;
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Player
  if (player.alive) {
    ctx.fillStyle = player.team === 't' ? COLORS.tOrange : COLORS.ctBlue;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(player.pos.x + Math.cos(player.angle) * 20, player.pos.y + Math.sin(player.angle) * 20);
    ctx.stroke();
  }

  ctx.restore();

  // === CS2 HUD ===
  drawHUD(ctx, w, h, state);

  // Scope
  if (player.isScoped && player.alive) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w/2 - 30, h/2);
    ctx.lineTo(w/2 - 10, h/2);
    ctx.moveTo(w/2 + 10, h/2);
    ctx.lineTo(w/2 + 30, h/2);
    ctx.moveTo(w/2, h/2 - 30);
    ctx.lineTo(w/2, h/2 - 10);
    ctx.moveTo(w/2, h/2 + 10);
    ctx.lineTo(w/2, h/2 + 30);
    ctx.stroke();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  const { player, roundTime, roundStatus, score, killFeed } = state;

  // === TOP BAR ===
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, 36);

  // Timer
  const minutes = Math.floor(Math.max(0, roundTime) / 60);
  const seconds = Math.floor(Math.max(0, roundTime) % 60);
  ctx.fillStyle = roundTime < 10 ? '#EF4444' : '#F8FAFC';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, w/2, 26);

  // Score
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = state.playerTeam === 't' ? COLORS.tOrange : COLORS.ctBlue;
  ctx.fillText(`${state.roundsWon}`, 20, 26);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText('-', 45, 26);
  ctx.fillStyle = state.playerTeam === 't' ? COLORS.ctBlue : COLORS.tOrange;
  ctx.fillText(`${state.roundsLost}`, 60, 26);

  // K/D
  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'right';
  ctx.fillText(`${score.kills} / ${score.deaths}`, w - 20, 26);

  // === KILL FEED ===
  const now = Date.now();
  const visible = killFeed.filter(k => now - k.time < 5000).slice(-5);
  visible.forEach((k, i) => {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(w - 280, 50 + i * 24, 260, 20);
    ctx.fillStyle = k.killer === 'YOU' ? COLORS.tOrange : '#F8FAFC';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const hs = k.headshot ? ' 💀' : '';
    ctx.fillText(`${k.killer} → ${k.victim}${hs}`, w - 30, 68 + i * 24);
  });

  // === BOTTOM BAR ===
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, h - 80, w, 80);

  // Health
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HEALTH', 20, h - 55);
  
  ctx.fillStyle = '#334155';
  ctx.fillRect(20, h - 45, 200, 12);
  ctx.fillStyle = player.health > 50 ? '#22C55E' : player.health > 20 ? '#F97316' : '#EF4444';
  ctx.fillRect(20, h - 45, 200 * (player.health / 100), 12);
  
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`${player.health}`, 230, h - 40);

  // Money
  ctx.fillStyle = COLORS.money;
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`$${player.money}`, 300, h - 40);

  // === WEAPONS (RIGHT SIDE) ===
  const weapons = [
    { name: player.primaryWeapon?.name || 'NO RIFLE', ammo: player.primaryWeapon?.ammo || 0, 
      reserve: player.primaryWeapon?.reserveAmmo || 0, active: player.activeSlot === 'primary' },
    { name: player.secondaryWeapon?.name || 'NO PISTOL', ammo: player.secondaryWeapon?.ammo || 0, 
      reserve: player.secondaryWeapon?.reserveAmmo || 0, active: player.activeSlot === 'secondary' },
    { name: 'KNIFE', ammo: null, reserve: null, active: player.activeSlot === 'knife' },
  ];

  weapons.forEach((weapon, i) => {
    const y = h - 70 + i * 24;
    
    ctx.fillStyle = weapon.active ? '#2D3A4F' : '#1E293B';
    ctx.fillRect(w - 280, y, 260, 22);
    
    ctx.fillStyle = weapon.active ? '#FBBF24' : '#94A3B8';
    ctx.font = weapon.active ? 'bold 12px monospace' : '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, w - 270, y + 16);
    
    if (weapon.ammo !== null) {
      ctx.fillStyle = weapon.active ? '#F8FAFC' : '#64748B';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${weapon.ammo}`, w - 50, y + 16);
      ctx.fillStyle = '#64748B';
      ctx.font = '12px monospace';
      ctx.fillText(`/ ${weapon.reserve}`, w - 30, y + 16);
    }
  });

  if (player.reloadTimer > 0) {
    ctx.fillStyle = '#FBBF24';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RELOADING', w - 140, h - 10);
  }

  if (state.buyMenuOpen) renderBuyMenu(ctx, w, h, state);
  drawMinimap(ctx, w, h, state);
}

function drawMinimap(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  const size = 140;
  const x = w - size - 20;
  const y = 50;
  const map = state.currentMap;
  const scale = size / map.width;

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(x, y, size, size);

  // Walls
  ctx.fillStyle = '#475569';
  for (const wall of map.walls) {
    ctx.fillRect(x + wall.x * scale, y + wall.y * scale, 
                 Math.max(2, wall.w * scale), Math.max(2, wall.h * scale));
  }

  // Allies
  for (const ally of state.allies) {
    if (!ally.alive) continue;
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(x + ally.pos.x * scale, y + ally.pos.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  const camTarget = getCameraTarget(state);
  ctx.fillStyle = state.player.alive ? '#FBBF24' : '#94A3B8';
  ctx.beginPath();
  ctx.arc(x + camTarget.x * scale, y + camTarget.y * scale, 4, 0, Math.PI * 2);
  ctx.fill();
}

function renderBuyMenu(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(0, 0, w, h);

  const menuW = 600, menuH = 400;
  const mx = w/2 - menuW/2, my = h/2 - menuH/2;

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, menuW, menuH);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUY MENU', w/2, my + 40);
  ctx.fillStyle = COLORS.money;
  ctx.fillText(`$${state.player.money}`, w/2, my + 70);

  BUY_CATEGORIES.forEach((cat, i) => {
    ctx.fillStyle = state.buyMenuCategory === i ? '#3B82F6' : '#94A3B8';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${i+1}. ${cat.name}`, mx + 30, my + 110 + i * 30);
  });

  const category = BUY_CATEGORIES[state.buyMenuCategory];
  if (category) {
    category.weapons.forEach((weaponId, i) => {
      const def = WEAPONS[weaponId];
      if (!def) return;
      
      const y = my + 110 + i * 35;
      const selected = state.buyMenuSelection === i;
      
      ctx.fillStyle = selected ? '#2D3A4F' : 'transparent';
      ctx.fillRect(mx + 200, y - 15, 350, 28);
      
      ctx.fillStyle = def.side !== 'both' && def.side !== state.playerTeam ? '#EF4444' : '#F8FAFC';
      ctx.font = '14px monospace';
      ctx.fillText(def.name, mx + 210, y);
      ctx.fillStyle = state.player.money >= def.price ? '#FBBF24' : '#EF4444';
      ctx.fillText(`$${def.price}`, mx + 480, y);
    });
  }

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px monospace';
  ctx.fillText('1-5: Category | ↑↓: Select | ENTER: Buy | ESC: Close', w/2, my + menuH - 20);
}

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  hoveredButton: string | null,
  state: GameState
) {
  const w = canvas.width, h = canvas.height;

  // Background - clean dark blue
  ctx.fillStyle = '#0B1120';
  ctx.fillRect(0, 0, w, h);

  // === TOP BAR ===
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, w, 60);

  // Menu items - clean, no glow
  const menuItems = [
    { name: 'INVENTORY', color: '#94A3B8' },
    { name: 'LOADOUT', color: '#94A3B8' },
    { name: 'PLAY', color: '#3B82F6' },
    { name: 'NEWS', color: '#94A3B8' },
  ];
  
  menuItems.forEach((item, i) => {
    ctx.fillStyle = item.color;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.name, 150 + i * 100, 35);
  });

  // Cafe
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('CAFE', w - 30, 35);

  // Title - clean white
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CS2D', w/2, h/2 - 140);

  // Map selection
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '20px monospace';
  ctx.fillText('SELECT MAP', w/2, h/2 - 70);

  for (let i = 0; i < MAPS.length; i++) {
    const x = w/2 - 150 + i * 200;
    const y = h/2 - 40;
    
    ctx.fillStyle = state.selectedMapIndex === i ? '#3B82F6' : '#1E293B';
    ctx.fillRect(x, y, 140, 45);
    
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '16px monospace';
    ctx.fillText(MAPS[i].name, x + 70, y + 28);
  }

  // Team selection
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '20px monospace';
  ctx.fillText('SELECT TEAM', w/2, h/2 + 30);

  const btnY = h/2 + 50;
  
  // T button
  ctx.fillStyle = state.playerTeam === 't' ? '#F97316' : '#1E293B';
  ctx.fillRect(w/2 - 160, btnY, 140, 50);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('TERRORIST', w/2 - 90, btnY + 32);
  
  // CT button
  ctx.fillStyle = state.playerTeam === 'ct' ? '#3B82F6' : '#1E293B';
  ctx.fillRect(w/2 + 20, btnY, 140, 50);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText('COUNTER-T', w/2 + 90, btnY + 32);

  // Sliders
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '16px monospace';
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
  const btnX = w/2 - btnW/2, btnY2 = h/2 + 200;
  
  ctx.fillStyle = hoveredButton === 'start' ? '#2563EB' : '#3B82F6';
  ctx.fillRect(btnX, btnY2, btnW, btnH);
  
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PLAY', w/2, btnY2 + 38);

  // Controls
  ctx.fillStyle = '#64748B';
  ctx.font = '12px monospace';
  ctx.fillText('WASD: Move | Mouse: Aim | R: Reload | B: Buy | F: Inspect', w/2, h/2 + 280);
  ctx.fillText('1/2/3: Weapons | Ctrl: Crouch | Space: Jump | RMB: Scope', w/2, h/2 + 300);
}
