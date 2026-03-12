import { Player, Enemy, Ally, Wall, Vec2 } from './types';
import { GameMap } from './types';
import { MAPS } from './map';
import { WEAPONS, BUY_CATEGORIES } from './weapons';
import { GameState } from './engine';
import { hasLineOfSight, distance } from './utils';

const COLORS = {
  background: '#1A1F2E',
  foreground: '#E0E5F0',
  sand: '#C6A97A',
  concrete: '#6B7280',
  metal: '#8B95A9',
  wood: '#8B5A2B',
  wall: '#4A4F5E',
  wallTop: '#6B7280',
  ctColor: '#4B9EFF',
  tColor: '#FFB84B',
  enemy: '#FF6B6B',
  allyColor: '#4BFF4B',
  healthBar: '#4BFF4B',
  healthBarBg: 'rgba(0,0,0,0.5)',
  crosshair: 'rgba(255,255,255,0.8)',
  money: '#FFD700',
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

  // Clear with solid color (fastest)
  ctx.fillStyle = '#0A0F1A';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  
  // Scope zoom
  if (player.isScoped && player.alive) {
    const cx = w / 2, cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(2, 2);
    ctx.translate(-cx, -cy);
  }

  ctx.translate(-camera.x, -camera.y);

  // Ground - solid color (fast)
  ctx.fillStyle = map.groundTexture === 'dust' ? COLORS.sand : COLORS.concrete;
  ctx.fillRect(0, 0, map.width, map.height);

  // Bomb sites (simple circles)
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

  // Walls (simple fill, no textures for speed)
  for (const wall of map.walls) {
    ctx.fillStyle = wall.jumpable ? '#8B7355' : COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    
    // Simple edge highlight
    ctx.strokeStyle = wall.jumpable ? '#FFD700' : COLORS.wallTop;
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }

  // Props (simple)
  if (map.props) {
    for (const prop of map.props) {
      ctx.fillStyle = prop.type === 'box' ? COLORS.wood : '#CC5500';
      ctx.fillRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
      
      if (prop.type === 'barrel') {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
      }
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

  // Hit markers
  for (const hit of hitMarkers) {
    const age = (Date.now() - hit.time) / 500;
    if (age > 1) continue;
    const alpha = 1 - age;
    ctx.strokeStyle = hit.headshot ? `rgba(255, 100, 100, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = hit.headshot ? 2 : 1;
    ctx.beginPath();
    ctx.arc(hit.pos.x, hit.pos.y, 8 * (1 - age), 0, Math.PI * 2);
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
    ctx.beginPath();
    ctx.arc(ally.pos.x, ally.pos.y, ally.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    const bw = 20, bh = 2, bx = ally.pos.x - bw/2, by = ally.pos.y + ally.radius + 4;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.healthBar;
    ctx.fillRect(bx, by, bw * (ally.health / ally.maxHealth), bh);
  }

  // Enemies (only in FOV)
  const viewEntity = player.alive ? player : null;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (viewEntity && !isInFOV(viewEntity, e.pos, map.walls)) continue;

    ctx.fillStyle = COLORS.enemy;
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    
    const bw = 20, bh = 2, bx = e.pos.x - bw/2, by = e.pos.y + e.radius + 4;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(bx, by, bw * (e.health / e.maxHealth), bh);
  }

  // Player
  if (player.alive) {
    const radius = player.isCrouching ? 10 : 12;
    ctx.fillStyle = player.team === 't' ? COLORS.tColor : COLORS.ctColor;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Aim line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(player.pos.x + Math.cos(player.angle) * 20, player.pos.y + Math.sin(player.angle) * 20);
    ctx.stroke();
    
    // Health bar
    const bw = 24, bh = 3, bx = player.pos.x - bw/2, by = player.pos.y + radius + 5;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.healthBar;
    ctx.fillRect(bx, by, bw * (player.health / player.maxHealth), bh);
  }

  ctx.restore();

  // === HUD (keep this, it's light) ===
  drawHUD(ctx, w, h, state, map);

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

function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, map: GameMap) {
  const { player, mousePos, roundTime, roundStatus, score, killFeed } = state;

  // Simple crosshair (not when scoped)
  if (!player.isScoped) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 10, mousePos.y);
    ctx.lineTo(mousePos.x - 4, mousePos.y);
    ctx.moveTo(mousePos.x + 4, mousePos.y);
    ctx.lineTo(mousePos.x + 10, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 10);
    ctx.lineTo(mousePos.x, mousePos.y - 4);
    ctx.moveTo(mousePos.x, mousePos.y + 4);
    ctx.lineTo(mousePos.x, mousePos.y + 10);
    ctx.stroke();
  }

  // Top info
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(w/2 - 60, 5, 120, 25);
  ctx.fillStyle = 'white';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.playerTeam === 't' ? 'T' : 'CT'} ${state.roundsWon}-${state.roundsLost}`, w/2, 22);

  // Timer
  const minutes = Math.floor(Math.max(0, roundTime) / 60);
  const seconds = Math.floor(Math.max(0, roundTime) % 60);
  ctx.fillStyle = roundTime < 10 ? '#FF6B6B' : 'white';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, w/2, 50);

  // Kill feed
  const now = Date.now();
  const visible = killFeed.filter(k => now - k.time < 5000).slice(-4);
  visible.forEach((k, i) => {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(w - 220, 30 + i * 16, 200, 14);
    ctx.fillStyle = k.killer === 'YOU' ? COLORS.tColor : 'white';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${k.killer} → ${k.victim}`, w - 30, 42 + i * 16);
  });

  // Bottom HUD
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, h - 50, w, 50);

  // Health
  ctx.fillStyle = 'white';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`❤ ${player.health}`, 20, h - 20);
  
  // Money
  ctx.fillStyle = COLORS.money;
  ctx.fillText(`$${player.money}`, 20, h - 35);

  // Ammo
  ctx.textAlign = 'right';
  ctx.fillStyle = player.ammo <= 5 ? '#FF6B6B' : 'white';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`${player.ammo}`, w - 30, h - 20);
  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';
  ctx.fillText(`/ ${player.reserveAmmo}`, w - 30, h - 35);
  ctx.fillStyle = 'white';
  ctx.font = '10px monospace';
  ctx.fillText(player.weapon.name, w - 30, h - 45);

  // Weapon slots
  const slots = [
    { key: '1', name: player.primaryWeapon?.name || '—', active: player.activeSlot === 'primary' },
    { key: '2', name: player.secondaryWeapon?.name || '—', active: player.activeSlot === 'secondary' },
    { key: '3', name: 'Knife', active: player.activeSlot === 'knife' },
  ];
  
  slots.forEach((slot, i) => {
    const x = w/2 - 80 + i * 60;
    ctx.fillStyle = slot.active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, h - 45, 50, 20);
    ctx.fillStyle = slot.active ? '#FFD700' : '#888';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[${slot.key}]`, x + 25, h - 30);
    ctx.font = '7px monospace';
    ctx.fillText(slot.name.substring(0, 6), x + 25, h - 20);
  });

  if (state.buyMenuOpen) renderBuyMenu(ctx, w, h, state);
  if (map) drawMinimap(ctx, w, h, state, map);
}

function drawMinimap(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, map: GameMap) {
  const size = 120;
  const x = w - size - 10;
  const y = 10;
  const scale = size / map.width;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, size, size);

  // Walls
  ctx.fillStyle = '#4A4F5E';
  for (const wall of map.walls) {
    ctx.fillRect(x + wall.x * scale, y + wall.y * scale, 
                 Math.max(2, wall.w * scale), Math.max(2, wall.h * scale));
  }

  // Player
  const camTarget = getCameraTarget(state);
  ctx.fillStyle = state.player.alive ? '#FFD700' : '#888';
  ctx.beginPath();
  ctx.arc(x + camTarget.x * scale, y + camTarget.y * scale, 3, 0, Math.PI * 2);
  ctx.fill();
}

function renderBuyMenu(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, w, h);

  const menuW = 500, menuH = 350;
  const mx = w/2 - menuW/2, my = h/2 - menuH/2;

  ctx.fillStyle = '#1A1F2E';
  ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = '#4B9EFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, menuW, menuH);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUY MENU', w/2, my + 30);
  ctx.fillStyle = COLORS.money;
  ctx.fillText(`$${state.player.money}`, w/2, my + 50);

  const catY = my + 70;
  BUY_CATEGORIES.forEach((cat, i) => {
    ctx.fillStyle = state.buyMenuCategory === i ? '#4B9EFF' : '#888';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${i+1}. ${cat.name}`, mx + 20, catY + i * 25);
  });

  const category = BUY_CATEGORIES[state.buyMenuCategory];
  if (category) {
    category.weapons.forEach((weaponId, i) => {
      const def = WEAPONS[weaponId];
      if (!def) return;
      
      const y = my + 70 + i * 30;
      const selected = state.buyMenuSelection === i;
      
      ctx.fillStyle = selected ? '#2A2F3E' : 'transparent';
      ctx.fillRect(mx + 150, y - 12, 300, 24);
      
      ctx.fillStyle = def.side !== 'both' && def.side !== state.playerTeam ? '#FF6B6B' : 'white';
      ctx.font = '12px monospace';
      ctx.fillText(def.name, mx + 160, y);
      ctx.fillStyle = state.player.money >= def.price ? COLORS.money : '#FF6B6B';
      ctx.fillText(`$${def.price}`, mx + 320, y);
    });
  }

  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.fillText('1-5: Category | ↑↓: Select | ENTER: Buy | ESC: Close', w/2, my + menuH - 20);
}

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  hoveredButton: string | null,
  state: GameState
) {
  const w = canvas.width, h = canvas.height;

  // Simple gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#0A0F1A');
  gradient.addColorStop(1, '#1A2533');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#4B9EFF';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CS2D', w/2, h/2 - 150);

  // Map buttons - FIXED: proper positioning
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.fillText('SELECT MAP', w/2, h/2 - 90);

  for (let i = 0; i < MAPS.length; i++) {
    const x = w/2 - 150 + i * 200; // Fixed: proper spacing
    const y = h/2 - 60;
    
    ctx.fillStyle = state.selectedMapIndex === i ? '#4B9EFF' : '#2A2F3E';
    ctx.fillRect(x, y, 120, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.fillText(MAPS[i].name, x + 60, y + 25);
  }

  // Team buttons - FIXED: proper positioning
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.fillText('SELECT TEAM', w/2, h/2);

  const btnY = h/2 + 20;
  
  // T button
  ctx.fillStyle = state.playerTeam === 't' ? '#FFB84B' : '#2A2F3E';
  ctx.fillRect(w/2 - 140, btnY, 120, 40);
  ctx.fillStyle = 'white';
  ctx.fillText('T', w/2 - 80, btnY + 25);
  
  // CT button
  ctx.fillStyle = state.playerTeam === 'ct' ? '#4B9EFF' : '#2A2F3E';
  ctx.fillRect(w/2 + 20, btnY, 120, 40);
  ctx.fillStyle = 'white';
  ctx.fillText('CT', w/2 + 80, btnY + 25);

  // Enemy slider - FIXED: proper mouse tracking
  ctx.fillStyle = 'white';
  ctx.font = '14px monospace';
  ctx.fillText(`ENEMIES: ${state.enemyCount}`, w/2, h/2 + 80);

  const sliderW = 300;
  const sliderX = w/2 - sliderW/2;
  const sliderY = h/2 + 90;
  
  ctx.fillStyle = '#2A2F3E';
  ctx.fillRect(sliderX, sliderY, sliderW, 10);
  
  ctx.fillStyle = '#4B9EFF';
  const knobX = sliderX + ((state.enemyCount - 1) / 9) * sliderW;
  ctx.fillRect(sliderX, sliderY, knobX - sliderX, 10);

  // Ally slider
  ctx.fillStyle = 'white';
  ctx.fillText(`ALLIES: ${state.allyCount}`, w/2, h/2 + 120);

  const aSliderY = h/2 + 130;
  ctx.fillStyle = '#2A2F3E';
  ctx.fillRect(sliderX, aSliderY, sliderW, 10);
  
  ctx.fillStyle = '#FFB84B';
  const aKnobX = sliderX + (state.allyCount / 9) * sliderW;
  ctx.fillRect(sliderX, aSliderY, aKnobX - sliderX, 10);

  // Start button
  const btnW = 200, btnH = 50;
  const btnX = w/2 - btnW/2, btnY2 = h/2 + 160;
  
  ctx.fillStyle = hoveredButton === 'start' ? '#4B9EFF' : '#2A2F3E';
  ctx.fillRect(btnX, btnY2, btnW, btnH);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('PLAY', w/2, btnY2 + 32);

  // Controls
  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';
  ctx.fillText('WASD: Move | Mouse: Aim | R: Reload | B: Buy', w/2, h/2 + 230);
  ctx.fillText('1/2/3: Weapons | Ctrl: Crouch | Space: Jump', w/2, h/2 + 250);
}
