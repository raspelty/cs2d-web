import { Player, Enemy, Bullet, Particle, KillFeedEntry, Wall } from './types';
import { GameMap } from './types';

// Colors from design system (hardcoded HSL for canvas)
const COLORS = {
  background: 'hsl(220, 10%, 15%)',
  foreground: 'hsl(210, 10%, 85%)',
  wall: 'hsl(220, 10%, 20%)',
  wallTop: 'hsl(210, 10%, 50%)',
  accent: 'hsl(180, 50%, 60%)',
  enemy: 'hsl(0, 70%, 60%)',
  muzzleFlash: 'hsl(45, 100%, 70%)',
  tracer: 'hsla(45, 100%, 80%, 0.6)',
  blood: 'hsla(0, 70%, 60%, 0.7)',
  bombSite: 'hsla(180, 50%, 60%, 0.08)',
  bombSiteStroke: 'hsla(180, 50%, 60%, 0.3)',
  bombSiteText: 'hsla(180, 50%, 60%, 0.15)',
  healthBar: 'hsl(180, 50%, 60%)',
  healthBarBg: 'hsla(220, 10%, 10%, 0.6)',
  ammoBar: 'hsl(45, 80%, 60%)',
  crosshair: 'hsla(210, 10%, 85%, 0.8)',
};

export function render(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  player: Player,
  enemies: Enemy[],
  bullets: Bullet[],
  particles: Particle[],
  bloodDecals: { pos: { x: number; y: number }; alpha: number }[],
  killFeed: KillFeedEntry[],
  map: GameMap,
  mousePos: { x: number; y: number },
  roundTime: number,
  roundStatus: string,
  score: { kills: number; deaths: number },
  camera: { x: number; y: number }
) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Floor
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, map.width, map.height);

  // Bomb sites
  for (const site of map.bombSites) {
    ctx.fillStyle = COLORS.bombSite;
    ctx.beginPath();
    ctx.arc(site.pos.x, site.pos.y, site.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.bombSiteStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = COLORS.bombSiteText;
    ctx.font = 'bold 80px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(site.label, site.pos.x, site.pos.y);
  }

  // Blood decals
  for (const decal of bloodDecals) {
    ctx.fillStyle = `hsla(0, 70%, 40%, ${decal.alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(decal.pos.x, decal.pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Walls with shadow
  for (const wall of map.walls) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(wall.x + 3, wall.y + 3, wall.w, wall.h);

    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

    // Top edge highlight
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

  // Bullets/tracers
  for (const bullet of bullets) {
    const alpha = Math.max(0, 1 - bullet.time * 5);
    ctx.strokeStyle = `hsla(45, 100%, 80%, ${alpha * 0.6})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bullet.start.x, bullet.start.y);
    ctx.lineTo(bullet.end.x, bullet.end.y);
    ctx.stroke();
  }

  // Particles
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = p.color.replace(')', `, ${1 - alpha})`).replace('hsl(', 'hsla(');
    ctx.fillRect(p.pos.x - p.size / 2, p.pos.y - p.size / 2, p.size, p.size);
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    // Body
    ctx.fillStyle = COLORS.enemy;
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.strokeStyle = 'hsl(0, 70%, 45%)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.pos.x, e.pos.y);
    ctx.lineTo(e.pos.x + Math.cos(e.angle) * (e.radius + 8), e.pos.y + Math.sin(e.angle) * (e.radius + 8));
    ctx.stroke();

    // Health bar under enemy
    const barW = 24;
    const barH = 3;
    const barX = e.pos.x - barW / 2;
    const barY = e.pos.y + e.radius + 6;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(barX, barY, barW * (e.health / e.maxHealth), barH);

    // Name
    ctx.fillStyle = COLORS.enemy;
    ctx.font = '9px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENEMY', e.pos.x, e.pos.y - e.radius - 6);
  }

  // Player
  if (player.alive) {
    // Body
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Direction
    ctx.strokeStyle = 'hsl(180, 50%, 40%)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(
      player.pos.x + Math.cos(player.angle) * (player.radius + 10),
      player.pos.y + Math.sin(player.angle) * (player.radius + 10)
    );
    ctx.stroke();

    // Health bar
    const barW = 30;
    const barH = 3;
    const hBarX = player.pos.x - barW / 2;
    const hBarY = player.pos.y + player.radius + 6;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(hBarX, hBarY, barW, barH);
    ctx.fillStyle = COLORS.healthBar;
    ctx.fillRect(hBarX, hBarY, barW * (player.health / player.maxHealth), barH);

    // Ammo bar
    const aBarY = hBarY + 5;
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(hBarX, aBarY, barW, barH);
    ctx.fillStyle = COLORS.ammoBar;
    ctx.fillRect(hBarX, aBarY, barW * (player.ammo / player.maxAmmo), barH);
  }

  ctx.restore();

  // --- HUD (screen space) ---

  // Crosshair
  const cx = mousePos.x;
  const cy = mousePos.y;
  ctx.strokeStyle = COLORS.crosshair;
  ctx.lineWidth = 1.5;
  const gap = 6;
  const len = 12;
  ctx.beginPath();
  ctx.moveTo(cx - gap - len, cy); ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + len, cy);
  ctx.moveTo(cx, cy - gap - len); ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + gap + len);
  ctx.stroke();

  // Round timer
  ctx.fillStyle = COLORS.foreground;
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  const minutes = Math.floor(roundTime / 60);
  const seconds = Math.floor(roundTime % 60);
  ctx.fillText(
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    w / 2, 30
  );

  if (roundStatus !== 'playing') {
    ctx.font = 'bold 16px "Roboto Mono", monospace';
    ctx.fillStyle = roundStatus === 'won' ? COLORS.accent : COLORS.enemy;
    ctx.fillText(
      roundStatus === 'won' ? '// ROUND WON //' : '// YOU DIED //',
      w / 2, 55
    );
  }

  // Kill feed (top right)
  ctx.textAlign = 'right';
  ctx.font = '11px "Roboto Mono", monospace';
  const now = Date.now();
  const visibleKills = killFeed.filter(k => now - k.time < 5000).slice(-5);
  visibleKills.forEach((k, i) => {
    const alpha = Math.max(0, 1 - (now - k.time) / 5000);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.foreground;
    ctx.fillText(`${k.killer}  [${k.weapon}]  ${k.victim}`, w - 16, 30 + i * 18);
  });
  ctx.globalAlpha = 1;

  // Score
  ctx.textAlign = 'left';
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText(`K: ${score.kills}  D: ${score.deaths}`, 16, 30);

  // Ammo display
  ctx.textAlign = 'left';
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.fillStyle = COLORS.foreground;
  ctx.fillText(`${player.weapon.name}`, 16, h - 40);
  ctx.fillText(`${player.ammo} / ${player.maxAmmo}`, 16, h - 20);
}

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  hoveredButton: string | null
) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 36px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TACTICAL OPS', w / 2, h / 2 - 100);

  ctx.fillStyle = COLORS.foreground;
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.fillText('TOP-DOWN TACTICAL SIMULATOR', w / 2, h / 2 - 70);

  // Start button
  const btnW = 240;
  const btnH = 48;
  const btnX = w / 2 - btnW / 2;
  const btnY = h / 2 - 10;

  ctx.fillStyle = hoveredButton === 'start' ? 'hsl(220, 10%, 35%)' : 'hsl(220, 10%, 25%)';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = COLORS.foreground;
  ctx.font = '14px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('START MATCH', w / 2, btnY + 30);

  // Controls info
  ctx.fillStyle = 'hsl(210, 10%, 45%)';
  ctx.font = '11px "Roboto Mono", monospace';
  ctx.fillText('WASD - MOVE  |  MOUSE - AIM  |  CLICK - SHOOT  |  R - RELOAD', w / 2, h / 2 + 80);
}
