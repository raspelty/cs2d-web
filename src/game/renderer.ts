import { Player, Enemy, Ally, Wall, Vec2 } from './types';
import { GameMap } from './types';
import { MAPS } from './map';
import { WEAPONS, BUY_CATEGORIES } from './weapons';
import { GameState } from './engine';
import { hasLineOfSight, distance } from './utils';
import { createConcreteTexture, createDustTexture } from './map';

const COLORS = {
  background: '#0A0F1A',
  foreground: '#E0E5F0',
  ctColor: '#6B9EFF',
  tColor: '#FFB84B',
  enemy: '#FF6B6B',
  allyColor: '#6BFF6B',
  healthBar: '#6BFF6B',
  healthBarBg: 'rgba(0,0,0,0.5)',
  money: '#FFD700',
};

const FOV_HALF_ANGLE = Math.PI / 4;

let concreteTexture: CanvasPattern | null = null;
let dustTexture: CanvasPattern | null = null;

function initTextures(ctx: CanvasRenderingContext2D) {
  if (!concreteTexture) concreteTexture = createConcreteTexture(ctx);
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

  // Ground
  ctx.fillStyle = map.groundTexture === 'dust' && dustTexture ? dustTexture : 
                  concreteTexture ? concreteTexture : '#5A5E6B';
  ctx.fillRect(0, 0, map.width, map.height);

  // Bomb sites
  for (const site of map.bombSites) {
    ctx.fillStyle = 'rgba(200, 50, 50, 0.15)';
    ctx.beginPath();
    ctx.arc(site.pos.x, site.pos.y, site.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(200, 50, 50, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(200, 50, 50, 0.3)';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(site.label, site.pos.x, site.pos.y);
    ctx.setLineDash([]);
  }

  // Walls
  for (const wall of map.walls) {
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = wall.jumpable ? '#8B7355' : '#4A4F5E';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    if (wall.jumpable) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    } else {
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 1;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
  }

  // Blood decals
  for (const d of bloodDecals) {
    ctx.fillStyle = `rgba(150, 0, 0, ${d.alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(d.pos.x, d.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bullet tracers
  for (const bullet of bullets) {
    const alpha = Math.max(0, 1 - bullet.time * 5);
    ctx.strokeStyle = bullet.isHeadshot ? `rgba(255, 100, 100, ${alpha})` : `rgba(255, 255, 100, ${alpha})`;
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
    
    ctx.fillStyle = COLORS.allyColor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(ally.pos.x, ally.pos.y, ally.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ally.pos.x, ally.pos.y);
    ctx.lineTo(ally.pos.x + Math.cos(ally.angle) * 15, ally.pos.y + Math.sin(ally.angle) * 15);
    ctx.stroke();
  }

  // Enemies
  const viewEntity = player.alive ? player : null;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (viewEntity && !isInFOV(viewEntity, e.pos, map.walls)) continue;

    ctx.fillStyle = COLORS.enemy;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Player
  if (player.alive) {
    ctx.fillStyle = player.team === 't' ? COLORS.tColor : COLORS.ctColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
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

  // === CS2 STYLE HUD ===
  drawCS2HUD(ctx, w, h, state);

  // Scope overlay
  if (player.isScoped && player.alive) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'white';
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

function drawCS2HUD(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  const { player, roundTime, roundStatus, score, killFeed } = state;

  // === TOP BAR ===
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, 32);

  // Timer - CENTER TOP
  const minutes = Math.floor(Math.max(0, roundTime) / 60);
  const seconds = Math.floor(Math.max(0, roundTime) % 60);
  ctx.fillStyle = roundTime < 10 ? '#FF6B6B' : '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, w/2, 22);

  // Score - LEFT TOP
  ctx.fillStyle = state.playerTeam === 't' ? COLORS.tColor : COLORS.ctColor;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${state.roundsWon}`, 20, 22);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('-', 45, 22);
  ctx.fillStyle = state.playerTeam === 't' ? COLORS.ctColor : COLORS.tColor;
  ctx.fillText(`${state.roundsLost}`, 60, 22);

  // K/D - RIGHT TOP
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.fillText(`${score.kills} / ${score.deaths}`, w - 20, 22);

  // === KILL FEED - TOP RIGHT ===
  const now = Date.now();
  const visible = killFeed.filter(k => now - k.time < 5000).slice(-5);
  visible.forEach((k, i) => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(w - 250, 40 + i * 22, 230, 18);
    ctx.fillStyle = k.killer === 'YOU' ? COLORS.tColor : '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const hs = k.headshot ? ' (HS)' : '';
    ctx.fillText(`${k.killer} → ${k.victim}${hs}`, w - 30, 55 + i * 22);
  });

  // === BOTTOM BAR - CS2 STYLE ===
  const barH = 80;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, h - barH, w, barH);

  // LEFT SIDE - Health & Armor
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HEALTH', 20, h - 55);
  
  // Health bar
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(20, h - 45, 150, 10);
  ctx.fillStyle = player.health > 50 ? '#6BFF6B' : player.health > 20 ? '#FFB84B' : '#FF6B6B';
  ctx.fillRect(20, h - 45, 150 * (player.health / 100), 10);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`${player.health}`, 180, h - 40);

  // Armor (placeholder)
  ctx.fillStyle = '#4B9EFF';
  ctx.fillRect(20, h - 30, 150, 5);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px monospace';
  ctx.fillText('ARMOR', 20, h - 15);

  // MONEY - LEFT CENTER
  ctx.fillStyle = COLORS.money;
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`$${player.money}`, 250, h - 30);

  // === WEAPONS STACKED ON RIGHT - CS2 STYLE ===
  const weapons = [
    { name: player.primaryWeapon?.name || '—', ammo: player.activeSlot === 'primary' ? player.ammo : player.primaryWeapon?.ammo || 0, 
      reserve: player.activeSlot === 'primary' ? player.reserveAmmo : player.primaryWeapon?.reserveAmmo || 0, active: player.activeSlot === 'primary' },
    { name: player.secondaryWeapon?.name || '—', ammo: player.activeSlot === 'secondary' ? player.ammo : player.secondaryWeapon?.ammo || 0, 
      reserve: player.activeSlot === 'secondary' ? player.reserveAmmo : player.secondaryWeapon?.reserveAmmo || 0, active: player.activeSlot === 'secondary' },
    { name: 'KNIFE', ammo: '—', reserve: '—', active: player.activeSlot === 'knife' },
  ];

  weapons.forEach((weapon, i) => {
    const y = h - 75 + i * 25;
    
    // Background
    ctx.fillStyle = weapon.active ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)';
    ctx.fillRect(w - 250, y, 230, 22);
    
    // Weapon name
    ctx.fillStyle = weapon.active ? '#FFD700' : '#888';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, w - 240, y + 15);
    
    // Ammo
    if (weapon.ammo !== '—') {
      ctx.fillStyle = weapon.active ? '#FFFFFF' : '#666';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${weapon.ammo}`, w - 60, y + 15);
      ctx.fillStyle = '#888';
      ctx.font = '12px monospace';
      ctx.fillText(`/ ${weapon.reserve}`, w - 30, y + 15);
    } else {
      ctx.fillStyle = '#888';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('∞', w - 30, y + 15);
    }
  });

  // Current weapon highlight
  if (player.reloadTimer > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RELOADING...', w - 130, h - 10);
  }

  if (player.isCrouching) {
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('CROUCHING', w - 130, h - 25);
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

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x, y, size, size);

  // Walls
  ctx.fillStyle = '#4A4F5E';
  for (const wall of map.walls) {
    ctx.fillRect(x + wall.x * scale, y + wall.y * scale, 
                 Math.max(2, wall.w * scale), Math.max(2, wall.h * scale));
  }

  // Allies
  for (const ally of state.allies) {
    if (!ally.alive) continue;
    ctx.fillStyle = '#6BFF6B';
    ctx.beginPath();
    ctx.arc(x + ally.pos.x * scale, y + ally.pos.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  const camTarget = getCameraTarget(state);
  ctx.fillStyle = state.player.alive ? '#FFD700' : '#888';
  ctx.beginPath();
  ctx.arc(x + camTarget.x * scale, y + camTarget.y * scale, 4, 0, Math.PI * 2);
  ctx.fill();
}

function renderBuyMenu(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, w, h);

  const menuW = 600, menuH = 400;
  const mx = w/2 - menuW/2, my = h/2 - menuH/2;

  ctx.fillStyle = '#1A1F2E';
  ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = '#4B9EFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, menuW, menuH);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUY MENU', w/2, my + 40);
  ctx.fillStyle = COLORS.money;
  ctx.fillText(`$${state.player.money}`, w/2, my + 70);

  const catY = my + 100;
  BUY_CATEGORIES.forEach((cat, i) => {
    ctx.fillStyle = state.buyMenuCategory === i ? '#4B9EFF' : '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${i+1}. ${cat.name}`, mx + 30, catY + i * 30);
  });

  const category = BUY_CATEGORIES[state.buyMenuCategory];
  if (category) {
    category.weapons.forEach((weaponId, i) => {
      const def = WEAPONS[weaponId];
      if (!def) return;
      
      const y = my + 100 + i * 35;
      const selected = state.buyMenuSelection === i;
      
      ctx.fillStyle = selected ? '#2A2F3E' : 'transparent';
      ctx.fillRect(mx + 200, y - 15, 320, 28);
      
      ctx.fillStyle = def.side !== 'both' && def.side !== state.playerTeam ? '#FF6B6B' : '#FFFFFF';
      ctx.font = '14px monospace';
      ctx.fillText(def.name, mx + 210, y);
      ctx.fillStyle = state.player.money >= def.price ? COLORS.money : '#FF6B6B';
      ctx.fillText(`$${def.price}`, mx + 450, y);
    });
  }

  ctx.fillStyle = '#888';
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

  // CS2 Menu style
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#0F1A2F');
  gradient.addColorStop(1, '#1F2A3F');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // === CS2 TOP BAR ===
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, w, 60);

  // Menu items
  const menuItems = ['INVENTORY', 'LOADOUT', 'PLAY', 'NEWS'];
  menuItems.forEach((item, i) => {
    ctx.fillStyle = item === 'PLAY' ? '#4B9EFF' : '#888';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item, 150 + i * 120, 35);
  });

  // Cafe text (from your image)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('CAFE', w - 50, 35);

  // Title
  ctx.shadowColor = '#4B9EFF';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CS2D', w/2, h/2 - 150);
  ctx.shadowBlur = 0;

  // Map selection
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px monospace';
  ctx.fillText('SELECT MAP', w/2, h/2 - 80);

  for (let i = 0; i < MAPS.length; i++) {
    const x = w/2 - 150 + i * 200;
    const y = h/2 - 50;
    
    ctx.fillStyle = state.selectedMapIndex === i ? '#4B9EFF' : '#2A2F3E';
    ctx.fillRect(x, y, 140, 40);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px monospace';
    ctx.fillText(MAPS[i].name, x + 70, y + 25);
  }

  // Team selection
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px monospace';
  ctx.fillText('SELECT TEAM', w/2, h/2 + 20);

  const btnY = h/2 + 40;
  
  // T button
  ctx.fillStyle = state.playerTeam === 't' ? '#FFB84B' : '#2A2F3E';
  ctx.fillRect(w/2 - 160, btnY, 140, 50);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('T', w/2 - 90, btnY + 32);
  
  // CT button
  ctx.fillStyle = state.playerTeam === 'ct' ? '#4B9EFF' : '#2A2F3E';
  ctx.fillRect(w/2 + 20, btnY, 140, 50);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('CT', w/2 + 90, btnY + 32);

  // Sliders
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px monospace';
  ctx.fillText(`ENEMIES: ${state.enemyCount}`, w/2, h/2 + 110);

  const sliderW = 300;
  const sliderX = w/2 - sliderW/2;
  
  // Enemy slider
  ctx.fillStyle = '#2A2F3E';
  ctx.fillRect(sliderX, h/2 + 120, sliderW, 10);
  ctx.fillStyle = '#FF6B6B';
  ctx.fillRect(sliderX, h/2 + 120, ((state.enemyCount - 1) / 9) * sliderW, 10);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`ALLIES: ${state.allyCount}`, w/2, h/2 + 150);
  
  ctx.fillStyle = '#2A2F3E';
  ctx.fillRect(sliderX, h/2 + 160, sliderW, 10);
  ctx.fillStyle = '#6BFF6B';
  ctx.fillRect(sliderX, h/2 + 160, (state.allyCount / 9) * sliderW, 10);

  // Play button
  const btnW = 200, btnH = 60;
  const btnX = w/2 - btnW/2, btnY2 = h/2 + 190;
  
  ctx.shadowBlur = hoveredButton === 'start' ? 20 : 10;
  ctx.shadowColor = hoveredButton === 'start' ? '#4B9EFF' : '#000000';
  ctx.fillStyle = hoveredButton === 'start' ? '#4B9EFF' : '#2A2F3E';
  ctx.fillRect(btnX, btnY2, btnW, btnH);
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PLAY', w/2, btnY2 + 38);

  // Controls
  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';
  ctx.fillText('WASD: Move | Mouse: Aim | R: Reload | B: Buy | F: Inspect', w/2, h/2 + 280);
  ctx.fillText('1/2/3: Weapons | Ctrl: Crouch | Space: Jump | RMB: Scope', w/2, h/2 + 300);
}
