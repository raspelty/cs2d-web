import { Player, Enemy, Ally, Wall, Vec2, SkinData } from './types';
import { GameMap } from './types';
import { MAPS } from './map';
import { WEAPONS, BUY_CATEGORIES } from './weapons';
import { GameState } from './engine';
import { hasLineOfSight, distance } from './utils';
import { 
  createConcreteTexture, 
  createDustTexture, 
  createMetalTexture, 
  createBrickTexture, 
  createTileTexture 
} from './map';

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

// Texture variables
let concreteTexture: CanvasPattern | null = null;
let dustTexture: CanvasPattern | null = null;
let metalTexture: CanvasPattern | null = null;
let brickTexture: CanvasPattern | null = null;
let tileTexture: CanvasPattern | null = null;

function initTextures(ctx: CanvasRenderingContext2D) {
  if (!concreteTexture) concreteTexture = createConcreteTexture(ctx, 128, 128);
  if (!dustTexture) dustTexture = createDustTexture(ctx);
  if (!metalTexture) metalTexture = createMetalTexture(ctx);
  if (!brickTexture) brickTexture = createBrickTexture(ctx);
  if (!tileTexture) tileTexture = createTileTexture(ctx);
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
  
  // Initialize textures
  initTextures(ctx);

  // Scope zoom
  const isScoped = player.isScoped && player.alive;

  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#1A2639');
  gradient.addColorStop(0.5, '#2A3A4A');
  gradient.addColorStop(1, '#3A4A5A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();

  if (isScoped) {
    const cx = w / 2, cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(2.5, 2.5);
    ctx.translate(-cx, -cy);
  }

  ctx.translate(-camera.x, -camera.y);

  // Ground texture based on map
  if (map.groundTexture === 'dust' && dustTexture) {
    ctx.fillStyle = dustTexture;
  } else if (tileTexture) {
    ctx.fillStyle = tileTexture;
  } else {
    ctx.fillStyle = '#5A5E6B';
  }
  ctx.fillRect(0, 0, map.width, map.height);

  // Add ground noise/decals
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(Math.random() * map.width, Math.random() * map.height, 50 + Math.random() * 100, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Bomb sites with better visuals
  for (const site of map.bombSites) {
    // Outer glow
    ctx.shadowColor = 'rgba(200, 50, 50, 0.5)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(200, 50, 50, 0.15)';
    ctx.beginPath();
    ctx.arc(site.pos.x, site.pos.y, site.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner ring
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(200, 50, 50, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.stroke();
    
    // Letter
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(200, 50, 50, 0.25)';
    ctx.font = 'bold 100px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(site.label, site.pos.x, site.pos.y);
    
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  }

  // Walls with textures
  for (const wall of map.walls) {
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    
    // Main wall with texture
    if (wall.texture === 'concrete' && concreteTexture) {
      ctx.fillStyle = concreteTexture;
    } else if (wall.texture === 'metal' && metalTexture) {
      ctx.fillStyle = metalTexture;
    } else if (wall.texture === 'brick' && brickTexture) {
      ctx.fillStyle = brickTexture;
    } else if (wall.texture === 'tile' && tileTexture) {
      ctx.fillStyle = tileTexture;
    } else {
      ctx.fillStyle = '#5A5E6B';
    }
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    
    // Reset shadow for details
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    if (wall.jumpable) {
      // Jumpable walls have a highlight
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      
      // Jump arrow
      ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
      ctx.font = 'bold 14px "Roboto Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲', wall.x + wall.w / 2, wall.y - 15);
      
      ctx.setLineDash([]);
    } else {
      // Edge highlights for non-jumpable walls
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wall.x, wall.y);
      ctx.lineTo(wall.x + wall.w, wall.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wall.x, wall.y);
      ctx.lineTo(wall.x, wall.y + wall.h);
      ctx.stroke();
      
      // Bottom shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wall.x, wall.y + wall.h);
      ctx.lineTo(wall.x + wall.w, wall.y + wall.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wall.x + wall.w, wall.y);
      ctx.lineTo(wall.x + wall.w, wall.y + wall.h);
      ctx.stroke();
    }
  }

  // Props
  if (map.props) {
    for (const prop of map.props) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      switch (prop.type) {
        case 'box_wood':
          ctx.fillStyle = '#8B5A2B';
          ctx.fillRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
          // Wood grain
          ctx.strokeStyle = '#5A3E1E';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(prop.pos.x - prop.width/2 + 10, prop.pos.y - prop.height/2 + i * 15);
            ctx.lineTo(prop.pos.x + prop.width/2 - 10, prop.pos.y - prop.height/2 + i * 15);
            ctx.stroke();
          }
          break;
          
        case 'box_metal':
          if (metalTexture) ctx.fillStyle = metalTexture;
          else ctx.fillStyle = '#7A7D8C';
          ctx.fillRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
          // Rivets
          ctx.fillStyle = '#5A5E6B';
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(prop.pos.x - prop.width/3 + (i % 2) * 20, 
                    prop.pos.y - prop.height/3 + Math.floor(i/2) * 20, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
          
        case 'barrel':
          ctx.fillStyle = '#CC5500';
          ctx.beginPath();
          ctx.ellipse(prop.pos.x, prop.pos.y, prop.width/2, prop.height/2, 0, 0, Math.PI * 2);
          ctx.fill();
          // Barrel rings
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(prop.pos.x, prop.pos.y - prop.height/3, prop.width/2, prop.height/6, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(prop.pos.x, prop.pos.y + prop.height/3, prop.width/2, prop.height/6, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case 'car':
          ctx.fillStyle = '#2A4A6A';
          ctx.fillRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
          // Windows
          ctx.fillStyle = '#1A2A3A';
          ctx.fillRect(prop.pos.x - prop.width/3, prop.pos.y - prop.height/3, prop.width/3, prop.height/4);
          ctx.fillRect(prop.pos.x + prop.width/6, prop.pos.y - prop.height/3, prop.width/3, prop.height/4);
          // Wheels
          ctx.fillStyle = '#2A2A2A';
          ctx.beginPath();
          ctx.arc(prop.pos.x - prop.width/3, prop.pos.y + prop.height/3, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(prop.pos.x + prop.width/3, prop.pos.y + prop.height/3, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'dumpster':
          ctx.fillStyle = '#4A6A8A';
          ctx.fillRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
          // Details
          ctx.strokeStyle = '#2A4A6A';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.strokeRect(prop.pos.x - prop.width/2 + 5, prop.pos.y - prop.height/2 + i * 12, prop.width - 10, 8);
          }
          break;
          
        case 'pallet':
          ctx.fillStyle = '#8B6A4A';
          ctx.fillRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
          // Slats
          ctx.strokeStyle = '#5A4A3A';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2 + i * 8);
            ctx.lineTo(prop.pos.x + prop.width/2, prop.pos.y - prop.height/2 + i * 8);
            ctx.stroke();
          }
          break;
          
        case 'tire':
          ctx.fillStyle = '#2A2A2A';
          ctx.beginPath();
          ctx.arc(prop.pos.x, prop.pos.y, prop.width/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3A3A3A';
          ctx.beginPath();
          ctx.arc(prop.pos.x, prop.pos.y, prop.width/3, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'van':
          ctx.fillStyle = '#4A6A8A';
          ctx.fillRect(prop.pos.x - prop.width/2, prop.pos.y - prop.height/2, prop.width, prop.height);
          // Van details
          ctx.fillStyle = '#2A4A6A';
          ctx.fillRect(prop.pos.x - prop.width/3, prop.pos.y - prop.height/3, prop.width/3, prop.height/4);
          ctx.fillRect(prop.pos.x + prop.width/6, prop.pos.y - prop.height/3, prop.width/3, prop.height/4);
          // Wheels
          ctx.fillStyle = '#2A2A2A';
          ctx.beginPath();
          ctx.arc(prop.pos.x - prop.width/3, prop.pos.y + prop.height/3, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(prop.pos.x + prop.width/3, prop.pos.y + prop.height/3, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  // Blood decals
  for (const d of bloodDecals) {
    ctx.fillStyle = `hsla(0, 70%, 30%, ${d.alpha * 0.5})`;
    ctx.shadowColor = 'rgba(100, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(d.pos.x, d.pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Splatter effect
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `hsla(0, 70%, 30%, ${d.alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(d.pos.x + (Math.random() - 0.5) * 20, 
              d.pos.y + (Math.random() - 0.5) * 20, 
              3 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.shadowBlur = 0;
  }

  // Tracers
  for (const bullet of bullets) {
    const alpha = Math.max(0, 1 - bullet.time * 5);
    ctx.strokeStyle = bullet.isHeadshot 
      ? `hsla(0, 100%, 60%, ${alpha})` 
      : bullet.isEnemy 
        ? `hsla(0, 80%, 50%, ${alpha * 0.6})`
        : `hsla(45, 100%, 80%, ${alpha * 0.6})`;
    ctx.lineWidth = bullet.isHeadshot ? 3 : 1.5;
    ctx.shadowColor = bullet.isHeadshot ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,0,0.3)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(bullet.start.x, bullet.start.y);
    ctx.lineTo(bullet.end.x, bullet.end.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Hit markers
  for (const hit of hitMarkers) {
    const age = (Date.now() - hit.time) / 500;
    const alpha = 1 - age;
    ctx.strokeStyle = hit.headshot ? `rgba(255, 100, 100, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = hit.headshot ? 3 : 2;
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(hit.pos.x, hit.pos.y, 10 * (1 - age), 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Particles
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl(', 'hsla(');
    ctx.shadowColor = p.color.includes('0') ? 'rgba(255,0,0,0.3)' : 'rgba(255,255,0,0.3)';
    ctx.shadowBlur = 3;
    ctx.fillRect(p.pos.x - p.size / 2, p.pos.y - p.size / 2, p.size, p.size);
    ctx.shadowBlur = 0;
  }

  // Allies
  for (const ally of allies) {
    if (!ally.alive) continue;
    
    // Draw ally
    ctx.fillStyle = COLORS.allyColor;
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ally.pos.x, ally.pos.y, ally.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Aim line
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
    ctx.font = '7px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ally.name, ally.pos.x, ally.pos.y - ally.radius - 4);
  }

  // Enemies (only in FOV)
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
    
    const bw = 22, bh = 2, bx = e.pos.x - bw / 2, by = e.pos.y + e.radius + 5;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(bx, by, bw * (e.health / e.maxHealth), bh);
    
    ctx.fillStyle = COLORS.enemy;
    ctx.font = '7px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
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

    const radius = player.isCrouching ? player.radius * 0.85 : player.radius;
    const teamColor = player.team === 't' ? COLORS.tColor : COLORS.ctColor;

    // Jump shadow
    if (player.isJumping) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(player.pos.x, player.pos.y + 4, radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player body
    ctx.fillStyle = teamColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
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

    // Knife visual
    if (player.activeSlot === 'knife') {
      ctx.fillStyle = 'hsl(200, 10%, 60%)';
      const kx = player.pos.x + Math.cos(player.angle) * (radius + 4);
      const ky = drawY + Math.sin(player.angle) * (radius + 4);
      ctx.save();
      ctx.translate(kx, ky);
      ctx.rotate(player.angle);
      ctx.fillRect(0, -2, 14, 4);
      ctx.restore();
    }

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
  drawHUD(ctx, w, h, state, map);

  // Scope overlay
  if (isScoped) {
    drawScopeOverlay(ctx, w, h);
  }
}

function drawScopeOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.4;

  // Black outside scope circle
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fill();

  // Scope crosshair
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();

  // Scope ring
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  // Scope center dot
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, map: GameMap) {
  const { player, mousePos, roundTime, roundStatus, score, killFeed, hitMarkers } = state;

  // Crosshair (not when scoped)
  if (!player.isScoped) {
    const cx = mousePos.x, cy = mousePos.y;
    ctx.strokeStyle = COLORS.crosshair;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx - 4, cy);
    ctx.moveTo(cx + 4, cy);
    ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx, cy - 4);
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx, cy + 12);
    ctx.stroke();
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
      ctx.font = '12px "Roboto Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SPECTATING: ${aliveAllies[idx].name} (Click to cycle)`, w / 2, 60);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(w / 2 - 100, 40, 200, 30);
      ctx.fillStyle = 'hsl(0, 70%, 55%)';
      ctx.font = '12px "Roboto Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ALL ALLIES ELIMINATED', w / 2, 60);
    }
  }

  // Top center - Round info
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(w / 2 - 120, 0, 240, 35);
  ctx.fillStyle = COLORS.tColor;
  ctx.font = 'bold 14px "Roboto Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${state.playerTeam === 't' ? state.roundsWon : state.roundsLost}`, w / 2 - 15, 24);
  ctx.fillStyle = COLORS.foreground;
  ctx.textAlign = 'center';
  ctx.font = '10px "Roboto Mono", monospace';
  ctx.fillText(`R${state.currentRound}/${state.maxRounds}`, w / 2, 14);
  ctx.fillStyle = COLORS.ctColor;
  ctx.font = 'bold 14px "Roboto Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${state.playerTeam === 'ct' ? state.roundsWon : state.roundsLost}`, w / 2 + 15, 24);

  // Round status
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
    ctx.fillStyle = COLORS.foreground;
    ctx.font = '14px "Roboto Mono", monospace';
    ctx.fillText(`Final Score: ${state.roundsWon} - ${state.roundsLost}`, w / 2, h / 2 + 15);
    ctx.fillText(`K/D: ${score.kills}/${score.deaths}`, w / 2, h / 2 + 40);
    ctx.fillStyle = 'hsl(210, 10%, 55%)';
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.fillText('PRESS R TO PLAY AGAIN', w / 2, h / 2 + 70);
  }

  // Freeze time
  if (roundStatus === 'freezetime') {
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

  // Kill feed
  ctx.textAlign = 'right';
  ctx.font = '9px "Roboto Mono", monospace';
  const now = Date.now();
  const visible = killFeed.filter(k => now - k.time < 5000).slice(-5);
  visible.forEach((k, i) => {
    ctx.globalAlpha = Math.max(0, 1 - (now - k.time) / 5000);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(w - 260, 8 + i * 18, 250, 15);
    ctx.fillStyle = k.killer === 'YOU' ? COLORS.tColor : k.killer.startsWith('ALLY') ? COLORS.allyColor : COLORS.enemy;
    const hs = k.headshot ? ' ⊕' : '';
    ctx.fillText(`${k.killer} [${k.weapon}${hs}] ${k.victim}`, w - 14, 19 + i * 18);
  });
  ctx.globalAlpha = 1;

  // K/D
  ctx.textAlign = 'left';
  ctx.font = '10px "Roboto Mono", monospace';
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText(`K:${score.kills} D:${score.deaths}`, 16, 22);

  // Bottom HUD
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, h - 65, w, 65);

  ctx.fillStyle = COLORS.healthBar;
  ctx.font = 'bold 18px "Roboto Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`♥ ${Math.max(0, player.health)}`, 16, h - 28);
  ctx.fillStyle = COLORS.money;
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.fillText(`$${player.money}`, 16, h - 10);

  // Timer at bottom center
  const minutes = Math.floor(Math.max(0, roundTime) / 60);
  const seconds = Math.floor(Math.max(0, roundTime) % 60);
  ctx.fillStyle = roundTime < 10 ? 'hsl(0, 70%, 55%)' : COLORS.foreground;
  ctx.font = 'bold 16px "Roboto Mono", monospace';
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
    ctx.font = '8px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[${s.label}] ${s.name}`, sx + 30, slotY + 12);
  });

  // Ammo
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.foreground;
  ctx.font = '11px "Roboto Mono", monospace';
  ctx.fillText(player.weapon.name, w - 16, h - 45);
  if (player.weapon.id !== 'knife') {
    ctx.font = 'bold 20px "Roboto Mono", monospace';
    ctx.fillStyle = player.ammo <= 5 ? 'hsl(0, 70%, 55%)' : COLORS.foreground;
    ctx.fillText(`${player.ammo}`, w - 55, h - 16);
    ctx.fillStyle = 'hsl(210, 10%, 50%)';
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.fillText(`/ ${player.reserveAmmo}`, w - 16, h - 16);
  }

  if (player.reloadTimer > 0) {
    ctx.fillStyle = 'hsl(45, 80%, 60%)';
    ctx.font = '11px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RELOADING...', w / 2, h - 78);
  }

  if (player.isCrouching) {
    ctx.fillStyle = 'hsl(210, 10%, 60%)';
    ctx.font = '9px "Roboto Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CROUCHING', 120, h - 28);
  }

  if (state.buyMenuOpen) renderBuyMenu(ctx, w, h, state);

  // Minimap
  drawMinimap(ctx, w, h, state, map);

  // Teammate direction arrows
  drawTeammateArrows(ctx, w, h, state);
}

function drawMinimap(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, map: GameMap) {
  const mmSize = 150;
  const mmX = w - mmSize - 10;
  const mmY = 40;
  const scaleX = mmSize / map.width;
  const scaleY = mmSize / map.height;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);
  ctx.fillStyle = 'hsl(35, 20%, 25%)';
  ctx.fillRect(mmX, mmY, mmSize, mmSize);

  // Walls on minimap (simplified)
  ctx.fillStyle = 'hsl(30, 15%, 45%)';
  for (const wall of map.walls) {
    const wx = mmX + wall.x * scaleX;
    const wy = mmY + wall.y * scaleY;
    const ww = Math.max(1, wall.w * scaleX);
    const wh = Math.max(1, wall.h * scaleY);
    ctx.fillRect(wx, wy, ww, wh);
  }

  // Bomb sites on minimap
  for (const site of map.bombSites) {
    ctx.fillStyle = 'hsla(0, 80%, 50%, 0.3)';
    ctx.beginPath();
    ctx.arc(mmX + site.pos.x * scaleX, mmY + site.pos.y * scaleY, site.radius * scaleX, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'hsla(0, 80%, 50%, 0.6)';
    ctx.font = 'bold 8px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(site.label, mmX + site.pos.x * scaleX, mmY + site.pos.y * scaleY + 3);
  }

  // Allies on minimap
  for (const ally of state.allies) {
    if (!ally.alive) continue;
    const ax = mmX + ally.pos.x * scaleX;
    const ay = mmY + ally.pos.y * scaleY;
    ctx.fillStyle = 'hsl(120, 60%, 50%)';
    ctx.beginPath();
    ctx.arc(ax, ay, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'hsl(120, 60%, 60%)';
    ctx.font = '5px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ally.name.charAt(0), ax, ay - 5);
  }

  // Camera target on minimap
  const camTarget = getCameraTarget(state);
  const px = mmX + camTarget.x * scaleX;
  const py = mmY + camTarget.y * scaleY;
  ctx.fillStyle = state.player.alive ? 'hsl(45, 100%, 60%)' : 'hsl(210, 10%, 60%)';
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fill();

  // Player direction indicator
  if (state.player.alive) {
    const angle = state.player.angle;
    ctx.strokeStyle = 'hsl(45, 100%, 60%)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(angle) * 8, py + Math.sin(angle) * 8);
    ctx.stroke();
  }

  // Map name
  ctx.fillStyle = 'hsl(210, 10%, 60%)';
  ctx.font = '6px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(map.name, mmX + mmSize / 2, mmY + mmSize + 10);
}

function drawTeammateArrows(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState) {
  const camTarget = getCameraTarget(state);
  const margin = 40;

  for (const ally of state.allies) {
    if (!ally.alive) continue;

    const sx = ally.pos.x - state.camera.x;
    const sy = ally.pos.y - state.camera.y;

    if (sx > margin && sx < w - margin && sy > margin && sy < h - margin) continue;

    const angle = Math.atan2(sy - h / 2, sx - w / 2);

    const edgeX = Math.max(margin, Math.min(w - margin, w / 2 + Math.cos(angle) * (w / 2 - margin)));
    const edgeY = Math.max(margin, Math.min(h - margin, h / 2 + Math.sin(angle) * (h / 2 - margin)));

    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(angle);
    ctx.fillStyle = 'hsla(120, 60%, 50%, 0.7)';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'hsl(120, 60%, 55%)';
    ctx.font = '7px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ally.name, edgeX, edgeY - 10);
  }
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
  ctx.font = 'bold 16px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUY MENU', w / 2, my + 28);
  ctx.fillStyle = COLORS.money;
  ctx.font = '13px "Roboto Mono", monospace';
  ctx.fillText(`$${state.player.money}`, w / 2, my + 46);

  const catX = mx + 10, catW = 110, catStartY = my + 60;
  for (let i = 0; i < BUY_CATEGORIES.length; i++) {
    const cy = catStartY + i * 32;
    ctx.fillStyle = state.buyMenuCategory === i ? 'hsl(210, 20%, 25%)' : 'transparent';
    ctx.fillRect(catX, cy, catW, 28);
    ctx.fillStyle = state.buyMenuCategory === i ? 'hsl(45, 80%, 60%)' : COLORS.foreground;
    ctx.font = '11px "Roboto Mono", monospace';
    ctx.textAlign = 'left';
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
      if (sel) {
        ctx.strokeStyle = 'hsl(45, 80%, 50%)';
        ctx.lineWidth = 1;
        ctx.strokeRect(wpX, wy, 435, 40);
      }

      ctx.fillStyle = wrong ? 'hsl(0, 50%, 50%)' : afford ? COLORS.foreground : 'hsl(0, 0%, 40%)';
      ctx.font = 'bold 11px "Roboto Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.name, wpX + 8, wy + 16);
      ctx.fillStyle = afford ? COLORS.money : 'hsl(0, 50%, 50%)';
      ctx.font = '10px "Roboto Mono", monospace';
      ctx.fillText(`$${def.price}`, wpX + 8, wy + 32);
      ctx.fillStyle = 'hsl(210, 10%, 50%)';
      ctx.font = '9px "Roboto Mono", monospace';
      ctx.fillText(`DMG:${def.damage} | ${def.ammo}/${def.reserveAmmo} | ROF:${Math.round(1 / def.fireRate)}/s`, wpX + 110, wy + 16);
      if (wrong) ctx.fillText(`${def.side.toUpperCase()} only`, wpX + 110, wy + 32);
    }
  }

  ctx.fillStyle = 'hsl(210, 10%, 45%)';
  ctx.font = '9px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
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
  gradient.addColorStop(0, '#0A0F1A');
  gradient.addColorStop(0.5, '#1A2533');
  gradient.addColorStop(1, '#0A0F1A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Animated background particles
  for (let i = 0; i < 50; i++) {
    const x = (Math.sin(Date.now() * 0.001 + i) * 50 + i * 100) % w;
    const y = (Math.cos(Date.now() * 0.001 + i) * 50 + i * 80) % h;
    ctx.fillStyle = `rgba(100, 150, 200, ${0.05 + Math.sin(Date.now() * 0.002 + i) * 0.02})`;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title with glow
  ctx.shadowColor = 'rgba(100, 150, 255, 0.5)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'hsl(210, 80%, 70%)';
  ctx.font = 'bold 72px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CS2D', w / 2, h / 2 - 200);
  
  ctx.shadowBlur = 15;
  ctx.fillStyle = 'hsl(210, 80%, 50%)';
  ctx.font = 'bold 72px "Roboto Mono", monospace';
  ctx.fillText('CS2D', w / 2 + 4, h / 2 - 196);
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'hsl(210, 10%, 70%)';
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.fillText('TACTICAL SHOOTER', w / 2, h / 2 - 150);

  // Map selection panel
  ctx.fillStyle = 'rgba(20, 30, 45, 0.8)';
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 350, h / 2 - 140, 700, 350, 10);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'hsl(210, 50%, 40%)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'hsl(210, 10%, 80%)';
  ctx.font = '16px "Roboto Mono", monospace';
  ctx.fillText('SELECT MAP', w / 2, h / 2 - 110);

  const mapBtnW = 140, mapBtnH = 40;
  for (let i = 0; i < MAPS.length; i++) {
    const mbx = w / 2 - 170 + i * 160;
    const mby = h / 2 - 80;
    
    // Map preview background
    ctx.fillStyle = state.selectedMapIndex === i ? 'hsl(210, 60%, 30%)' : 'hsl(210, 30%, 20%)';
    ctx.shadowBlur = state.selectedMapIndex === i ? 15 : 5;
    ctx.shadowColor = state.selectedMapIndex === i ? 'hsl(210, 80%, 50%)' : 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(mbx, mby, mapBtnW, mapBtnH, 5);
    ctx.fill();
    
    // Map name
    ctx.shadowBlur = 0;
    ctx.fillStyle = state.selectedMapIndex === i ? 'white' : 'hsl(210, 10%, 60%)';
    ctx.font = 'bold 14px "Roboto Mono", monospace';
    ctx.fillText(MAPS[i].name, mbx + mapBtnW / 2, mby + 25);
  }

  // Team selection
  ctx.fillStyle = 'hsl(210, 10%, 80%)';
  ctx.font = '16px "Roboto Mono", monospace';
  ctx.fillText('SELECT TEAM', w / 2, h / 2);

  const btnW = 160, btnH = 50;
  const tBtnX = w / 2 - btnW - 20, tBtnY = h / 2 + 20;
  
  // T button
  ctx.fillStyle = state.playerTeam === 't' ? 'hsl(40, 80%, 40%)' : 'hsl(40, 30%, 20%)';
  ctx.shadowBlur = state.playerTeam === 't' ? 15 : 5;
  ctx.shadowColor = state.playerTeam === 't' ? 'hsl(40, 80%, 60%)' : 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(tBtnX, tBtnY, btnW, btnH, 8);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = state.playerTeam === 't' ? 'white' : 'hsl(40, 50%, 60%)';
  ctx.font = 'bold 18px "Roboto Mono", monospace';
  ctx.fillText('TERRORIST', tBtnX + btnW / 2, tBtnY + 32);

  // CT button
  const ctBtnX = w / 2 + 20;
  ctx.fillStyle = state.playerTeam === 'ct' ? 'hsl(210, 70%, 40%)' : 'hsl(210, 30%, 20%)';
  ctx.shadowBlur = state.playerTeam === 'ct' ? 15 : 5;
  ctx.shadowColor = state.playerTeam === 'ct' ? 'hsl(210, 80%, 60%)' : 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(ctBtnX, tBtnY, btnW, btnH, 8);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = state.playerTeam === 'ct' ? 'white' : 'hsl(210, 50%, 60%)';
  ctx.fillText('COUNTER-T', ctBtnX + btnW / 2, tBtnY + 32);

  // Enemy slider
  ctx.fillStyle = 'hsl(210, 10%, 70%)';
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.fillText(`ENEMIES: ${state.enemyCount}`, w / 2, h / 2 + 100);
  
  const sliderW = 300, sliderX = w / 2 - sliderW / 2, sliderY = h / 2 + 110;
  
  // Slider track
  ctx.fillStyle = 'hsl(210, 20%, 20%)';
  ctx.shadowBlur = 5;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(sliderX, sliderY, sliderW, 12, 6);
  ctx.fill();
  
  // Slider fill
  ctx.fillStyle = 'hsl(210, 80%, 50%)';
  const fillWidth = ((state.enemyCount - 1) / 9) * sliderW;
  ctx.beginPath();
  ctx.roundRect(sliderX, sliderY, fillWidth, 12, 6);
  ctx.fill();
  
  // Slider knob
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'white';
  const knobX = sliderX + ((state.enemyCount - 1) / 9) * sliderW;
  ctx.beginPath();
  ctx.arc(knobX, sliderY + 6, 10, 0, Math.PI * 2);
  ctx.fill();

  // Ally slider
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'hsl(210, 10%, 70%)';
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.fillText(`ALLIES: ${state.allyCount}`, w / 2, h / 2 + 140);
  
  const aSliderY = h / 2 + 150;
  ctx.fillStyle = 'hsl(210, 20%, 20%)';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.roundRect(sliderX, aSliderY, sliderW, 12, 6);
  ctx.fill();
  
  ctx.fillStyle = 'hsl(40, 80%, 50%)';
  const aFillWidth = (state.allyCount / 9) * sliderW;
  ctx.beginPath();
  ctx.roundRect(sliderX, aSliderY, aFillWidth, 12, 6);
  ctx.fill();
  
  ctx.fillStyle = 'white';
  const aKnobX = sliderX + (state.allyCount / 9) * sliderW;
  ctx.beginPath();
  ctx.arc(aKnobX, aSliderY + 6, 10, 0, Math.PI * 2);
  ctx.fill();

  // Start button
  const startW = 240, startH = 60;
  const startX = w / 2 - startW / 2, startY = h / 2 + 190;
  
  ctx.shadowBlur = hoveredButton === 'start' ? 20 : 10;
  ctx.shadowColor = hoveredButton === 'start' ? 'hsl(120, 80%, 50%)' : 'rgba(0,0,0,0.5)';
  ctx.fillStyle = hoveredButton === 'start' ? 'hsl(120, 70%, 40%)' : 'hsl(120, 50%, 30%)';
  ctx.beginPath();
  ctx.roundRect(startX, startY, startW, startH, 10);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px "Roboto Mono", monospace';
  ctx.fillText('PLAY', w / 2, startY + 38);

  // Controls
  ctx.fillStyle = 'hsl(210, 10%, 50%)';
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.fillText('WASD: Move | Mouse: Aim/Shoot | R: Reload | B: Buy | F: Inspect', w / 2, h / 2 + 280);
  ctx.fillText('1/2/3: Switch Weapons | Ctrl: Crouch | Space: Jump | RMB: Scope (Snipers)', w / 2, h / 2 + 300);

  ctx.shadowBlur = 0;
}

// Helper for rounded rectangles
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.moveTo(x + r, y);
  this.lineTo(x + w - r, y);
  this.quadraticCurveTo(x + w, y, x + w, y + r);
  this.lineTo(x + w, y + h - r);
  this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  this.lineTo(x + r, y + h);
  this.quadraticCurveTo(x, y + h, x, y + h - r);
  this.lineTo(x, y + r);
  this.quadraticCurveTo(x, y, x + r, y);
  return this;
};
