import { GameMap, Wall, Vec2 } from './types';

export const MAP_WIDTH = 3600;
export const MAP_HEIGHT = 2800;

// Texture generation helper functions
export function createConcreteTexture(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const c = canvas.getContext('2d')!;
  
  // Base concrete color
  c.fillStyle = '#5A5E6B';
  c.fillRect(0, 0, 128, 128);
  
  // Add noise for concrete texture
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const size = 1 + Math.random() * 2;
    const brightness = 60 + Math.random() * 40;
    c.fillStyle = `hsl(220, 10%, ${brightness}%)`;
    c.fillRect(x, y, size, size);
  }
  
  // Add subtle cracks
  c.strokeStyle = 'rgba(0,0,0,0.15)';
  c.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    c.beginPath();
    c.moveTo(Math.random() * 128, Math.random() * 128);
    c.lineTo(Math.random() * 128, Math.random() * 128);
    c.stroke();
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

export function createDustTexture(ctx: CanvasRenderingContext2D): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const c = canvas.getContext('2d')!;
  
  // Base sand color
  c.fillStyle = '#C6A97A';
  c.fillRect(0, 0, 256, 256);
  
  // Add sand grain noise
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = 1 + Math.random() * 3;
    const brightness = 60 + Math.random() * 30;
    c.fillStyle = `hsl(38, 35%, ${brightness}%)`;
    c.fillRect(x, y, size, size);
  }
  
  // Add darker patches
  c.globalAlpha = 0.1;
  for (let i = 0; i < 20; i++) {
    c.fillStyle = '#8B7355';
    c.beginPath();
    c.arc(Math.random() * 256, Math.random() * 256, 20 + Math.random() * 30, 0, Math.PI * 2);
    c.fill();
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

export function createMetalTexture(ctx: CanvasRenderingContext2D): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const c = canvas.getContext('2d')!;
  
  // Base metal
  c.fillStyle = '#7A7D8C';
  c.fillRect(0, 0, 64, 64);
  
  // Add brushed metal effect
  c.strokeStyle = '#8F94A3';
  c.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    c.beginPath();
    c.moveTo(0, i * 3 + Math.random() * 5);
    c.lineTo(64, i * 3 + Math.random() * 5);
    c.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`;
    c.stroke();
  }
  
  // Add rivets
  c.fillStyle = '#5A5E6B';
  for (let i = 0; i < 8; i++) {
    c.beginPath();
    c.arc(10 + (i % 4) * 15, 10 + Math.floor(i / 4) * 15, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#8F94A3';
    c.beginPath();
    c.arc(10 + (i % 4) * 15, 10 + Math.floor(i / 4) * 15, 1.5, 0, Math.PI * 2);
    c.fill();
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

export function createBrickTexture(ctx: CanvasRenderingContext2D): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const c = canvas.getContext('2d')!;
  
  c.fillStyle = '#8B5A2B';
  c.fillRect(0, 0, 128, 64);
  
  // Draw bricks
  c.strokeStyle = '#5A3E1E';
  c.lineWidth = 2;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const offset = row % 2 === 0 ? 0 : 16;
      const x = col * 32 + offset;
      const y = row * 32;
      
      // Brick color variation
      c.fillStyle = `hsl(25, 50%, ${30 + Math.random() * 15}%)`;
      c.fillRect(x + 2, y + 2, 28, 28);
      
      // Mortar
      c.strokeRect(x, y, 32, 32);
    }
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

export function createTileTexture(ctx: CanvasRenderingContext2D): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const c = canvas.getContext('2d')!;
  
  c.fillStyle = '#3A3F4A';
  c.fillRect(0, 0, 64, 64);
  
  // Tile grid
  c.strokeStyle = '#5A5E6B';
  c.lineWidth = 2;
  for (let i = 0; i <= 64; i += 16) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i, 64);
    c.stroke();
    c.beginPath();
    c.moveTo(0, i);
    c.lineTo(64, i);
    c.stroke();
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

// Wall helper with texture support
export function w(x: number, y: number, width: number, height: number, 
                 texture: 'concrete' | 'metal' | 'brick' | 'tile' = 'concrete', 
                 jumpable = false): Wall {
  return { x, y, w: width, h: height, texture, jumpable };
}

// Props and cover objects
export interface Prop {
  pos: Vec2;
  type: 'barrel' | 'box_wood' | 'box_metal' | 'car' | 'dumpster' | 'pallet' | 'tire';
  width: number;
  height: number;
  angle?: number;
}

// === DUST II - COMPLETE REDESIGN ===
export const dust2Map: GameMap = {
  name: 'DUST II',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'dust',
  spawnPoints: [{ x: 400, y: 1400 }], // T Spawn
  enemySpawns: [ // CT Spawn positions
    { x: 3000, y: 600 },
    { x: 3100, y: 700 },
    { x: 3200, y: 800 },
    { x: 2900, y: 500 },
    { x: 2800, y: 400 },
  ],
  bombSites: [
    { pos: { x: 2800, y: 400 }, label: 'A', radius: 180 },
    { pos: { x: 2200, y: 2200 }, label: 'B', radius: 180 },
  ],
  props: [
    // A Site props
    { pos: { x: 2800, y: 300 }, type: 'box_metal', width: 60, height: 60 },
    { pos: { x: 2900, y: 350 }, type: 'box_wood', width: 50, height: 50 },
    { pos: { x: 2650, y: 380 }, type: 'box_wood', width: 40, height: 40 },
    { pos: { x: 2750, y: 450 }, type: 'barrel', width: 30, height: 50 },
    { pos: { x: 2950, y: 250 }, type: 'pallet', width: 70, height: 20 },
    
    // B Site props
    { pos: { x: 2100, y: 2150 }, type: 'box_metal', width: 70, height: 70 },
    { pos: { x: 2300, y: 2250 }, type: 'box_wood', width: 50, height: 50 },
    { pos: { x: 2250, y: 2100 }, type: 'car', width: 120, height: 60 },
    { pos: { x: 2150, y: 2300 }, type: 'dumpster', width: 80, height: 40 },
    { pos: { x: 2350, y: 2180 }, type: 'barrel', width: 30, height: 50 },
    
    // Mid props
    { pos: { x: 1600, y: 1000 }, type: 'box_wood', width: 60, height: 60 },
    { pos: { x: 1700, y: 950 }, type: 'barrel', width: 30, height: 50 },
    { pos: { x: 1500, y: 1050 }, type: 'tire', width: 25, height: 25 },
    { pos: { x: 1800, y: 900 }, type: 'pallet', width: 80, height: 20 },
    
    // Long A props
    { pos: { x: 800, y: 300 }, type: 'car', width: 120, height: 60 },
    { pos: { x: 1000, y: 250 }, type: 'box_wood', width: 50, height: 50 },
    { pos: { x: 1200, y: 350 }, type: 'barrel', width: 30, height: 50 },
    
    // Tunnels props
    { pos: { x: 1200, y: 1800 }, type: 'box_metal', width: 50, height: 50 },
    { pos: { x: 800, y: 1900 }, type: 'barrel', width: 30, height: 50 },
    { pos: { x: 1000, y: 2000 }, type: 'pallet', width: 70, height: 20 },
  ],
  walls: [
    // === OUTER BOUNDARIES ===
    w(0, 0, MAP_WIDTH, 30, 'concrete'), // Top
    w(0, MAP_HEIGHT - 30, MAP_WIDTH, 30, 'concrete'), // Bottom
    w(0, 0, 30, MAP_HEIGHT, 'concrete'), // Left
    w(MAP_WIDTH - 30, 0, 30, MAP_HEIGHT, 'concrete'), // Right

    // === T SPAWN ===
    w(30, 800, 500, 30, 'concrete'),
    w(30, 1800, 500, 30, 'concrete'),
    w(500, 800, 30, 1030, 'concrete'),
    
    // === LONG A ===
    w(500, 100, 1400, 30, 'concrete'),
    w(500, 600, 1400, 30, 'concrete'),
    w(500, 100, 30, 500, 'concrete'),
    w(1900, 100, 30, 500, 'concrete'),
    
    // Long doors
    w(800, 200, 20, 300, 'metal'), // Left door frame
    w(1400, 200, 20, 300, 'metal'), // Right door frame
    w(800, 200, 620, 20, 'metal', true), // Top crossbar (jumpable)
    
    // Long boxes (cover)
    w(900, 250, 80, 60, 'brick', true), // Jumpable box
    w(1100, 350, 60, 40, 'metal', true),
    
    // Pit area
    w(700, 400, 300, 30, 'concrete'),
    w(700, 400, 30, 150, 'concrete'),
    w(970, 400, 30, 150, 'concrete'),
    w(700, 520, 300, 30, 'concrete'),

    // === A SITE ===
    w(1900, 100, 1000, 30, 'concrete'),
    w(2800, 100, 30, 500, 'concrete'),
    w(2800, 500, 200, 30, 'concrete'),
    w(2900, 100, 30, 400, 'concrete'),
    
    // Goose (jumpable box)
    w(2600, 200, 80, 60, 'metal', true),
    
    // A platform
    w(2400, 200, 150, 30, 'concrete'),
    w(2400, 200, 30, 150, 'concrete'),
    w(2520, 200, 30, 150, 'concrete'),
    
    // Default box
    w(2200, 300, 100, 60, 'brick', true),
    
    // Tetris boxes
    w(2000, 380, 80, 40, 'metal', true),
    w(2100, 430, 60, 40, 'metal', true),

    // === CATWALK / SHORT A ===
    w(1400, 700, 30, 300, 'concrete'),
    w(1400, 1000, 400, 30, 'concrete'),
    w(1800, 700, 30, 300, 'concrete'),
    w(1400, 700, 400, 30, 'concrete'), // Top of catwalk
    
    // Catwalk railings
    w(1430, 730, 20, 240, 'metal', true),
    w(1750, 730, 20, 240, 'metal', true),

    // === MID ===
    w(500, 800, 30, 700, 'concrete'),
    w(500, 1500, 400, 30, 'concrete'),
    w(900, 800, 30, 300, 'concrete'),
    w(900, 1200, 30, 300, 'concrete'),
    
    // Mid doors (metal, penetrable but tough)
    w(1200, 800, 20, 350, 'metal'),
    w(1400, 800, 20, 350, 'metal'),
    
    // Xbox (jumpable)
    w(1300, 900, 120, 60, 'brick', true),
    
    // Sandbags
    w(1000, 1000, 150, 40, 'concrete', true),
    
    // Mid boxes
    w(1100, 1100, 80, 40, 'metal', true),
    
    // Connector to A
    w(1700, 800, 30, 400, 'concrete'),
    w(1700, 800, 300, 30, 'concrete'),
    w(2000, 800, 30, 200, 'concrete'),

    // === B TUNNELS ===
    w(500, 1600, 30, 500, 'concrete'),
    w(500, 2100, 400, 30, 'concrete'),
    w(900, 1600, 30, 500, 'concrete'),
    
    // Upper tunnels
    w(900, 1800, 500, 30, 'concrete'),
    w(1400, 1600, 30, 220, 'concrete'),
    w(900, 2000, 500, 30, 'concrete'),
    
    // Tunnel boxes (jumpable)
    w(1000, 1700, 80, 40, 'metal', true),
    w(1200, 1900, 60, 40, 'metal', true),
    
    // Lower tunnels
    w(600, 1800, 200, 30, 'concrete'),
    w(600, 1800, 30, 200, 'concrete'),
    w(770, 1800, 30, 200, 'concrete'),

    // === B SITE ===
    w(1400, 1600, 30, 800, 'concrete'),
    w(1400, 2400, 800, 30, 'concrete'),
    w(2200, 1600, 30, 800, 'concrete'),
    w(1400, 1600, 800, 30, 'concrete'),
    
    // B doors
    w(1700, 1900, 20, 200, 'metal'),
    w(1900, 1900, 20, 200, 'metal'),
    
    // B platform
    w(1800, 2000, 150, 30, 'concrete'),
    
    // B default box
    w(1600, 2150, 100, 60, 'brick', true),
    
    // Double stack
    w(1900, 2100, 70, 50, 'metal', true),
    w(1900, 2160, 70, 30, 'metal', true),
    
    // B back site
    w(2000, 2250, 100, 40, 'concrete'),
    
    // B window
    w(1500, 1700, 80, 30, 'tile'),
    w(1500, 1700, 30, 100, 'tile'),
    w(1550, 1760, 30, 30, 'tile', true), // Window ledge

    // === CT SPAWN ===
    w(2800, 600, 700, 30, 'concrete'),
    w(2800, 1200, 700, 30, 'concrete'),
    w(3400, 600, 30, 600, 'concrete'),
    
    // CT boxes
    w(3000, 700, 80, 40, 'metal', true),
    w(3200, 900, 60, 40, 'brick', true),
    
    // CT to B connector
    w(2200, 1600, 30, 200, 'concrete'),
    w(2200, 1700, 300, 30, 'concrete'),
    w(2500, 1700, 30, 300, 'concrete'),
    w(2500, 1900, 200, 30, 'concrete'),
  ],
};

// === MIRAGE - COMPLETE REDESIGN ===
export const mirageMap: GameMap = {
  name: 'MIRAGE',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'tile',
  spawnPoints: [{ x: 400, y: 1400 }], // T Spawn
  enemySpawns: [ // CT Spawn
    { x: 3000, y: 600 },
    { x: 3100, y: 700 },
    { x: 3200, y: 800 },
    { x: 2900, y: 500 },
  ],
  bombSites: [
    { pos: { x: 2800, y: 400 }, label: 'A', radius: 180 },
    { pos: { x: 2000, y: 2000 }, label: 'B', radius: 180 },
  ],
  props: [
    // A Site props
    { pos: { x: 2800, y: 300 }, type: 'box_metal', width: 60, height: 60 },
    { pos: { x: 2900, y: 350 }, type: 'box_wood', width: 50, height: 50 },
    { pos: { x: 2700, y: 450 }, type: 'barrel', width: 30, height: 50 },
    { pos: { x: 2950, y: 250 }, type: 'pallet', width: 70, height: 20 },
    
    // B Site props
    { pos: { x: 1900, y: 1950 }, type: 'box_metal', width: 70, height: 70 },
    { pos: { x: 2100, y: 2050 }, type: 'box_wood', width: 50, height: 50 },
    { pos: { x: 2000, y: 2100 }, type: 'van', width: 150, height: 60 },
    { pos: { x: 1850, y: 2000 }, type: 'dumpster', width: 80, height: 40 },
    
    // Mid props
    { pos: { x: 1500, y: 900 }, type: 'box_wood', width: 60, height: 60 },
    { pos: { x: 1600, y: 850 }, type: 'barrel', width: 30, height: 50 },
    { pos: { x: 1400, y: 950 }, type: 'tire', width: 25, height: 25 },
    
    // Palace props
    { pos: { x: 800, y: 300 }, type: 'box_metal', width: 50, height: 50 },
    { pos: { x: 900, y: 250 }, type: 'barrel', width: 30, height: 50 },
    
    // Apartments props
    { pos: { x: 800, y: 1900 }, type: 'box_wood', width: 50, height: 50 },
    { pos: { x: 1000, y: 1950 }, type: 'pallet', width: 70, height: 20 },
    { pos: { x: 700, y: 2000 }, type: 'tire', width: 25, height: 25 },
  ],
  walls: [
    // Boundaries
    w(0, 0, MAP_WIDTH, 30, 'concrete'),
    w(0, MAP_HEIGHT - 30, MAP_WIDTH, 30, 'concrete'),
    w(0, 0, 30, MAP_HEIGHT, 'concrete'),
    w(MAP_WIDTH - 30, 0, 30, MAP_HEIGHT, 'concrete'),

    // === T SPAWN ===
    w(30, 800, 400, 30, 'concrete'),
    w(30, 1700, 400, 30, 'concrete'),
    w(400, 800, 30, 900, 'concrete'),

    // === PALACE (A Ramp) ===
    w(400, 200, 30, 500, 'concrete'),
    w(400, 200, 800, 30, 'concrete'),
    w(1200, 200, 30, 300, 'concrete'),
    w(400, 500, 800, 30, 'concrete'),

    // === A SITE ===
    w(1200, 200, 30, 400, 'concrete'),
    w(2800, 200, 30, 500, 'concrete'),
    w(1200, 200, 1600, 30, 'concrete'),
    w(1200, 600, 1600, 30, 'concrete'),
    
    // Jungle
    w(2800, 600, 400, 30, 'concrete'),
    w(2800, 600, 30, 400, 'concrete'),
    w(2800, 1000, 400, 30, 'concrete'),
    
    // Stairs
    w(2000, 300, 30, 200, 'concrete'),
    w(2000, 300, 400, 30, 'concrete'),
    
    // A boxes (jumpable)
    w(1500, 350, 80, 40, 'brick', true),
    w(1800, 450, 60, 40, 'metal', true),
    w(2200, 400, 100, 40, 'brick', true),
    w(2500, 300, 60, 40, 'metal', true),

    // === MID ===
    w(400, 700, 30, 500, 'concrete'),
    w(400, 1200, 600, 30, 'concrete'),
    w(1000, 700, 30, 500, 'concrete'),
    
    // Window
    w(1200, 700, 30, 300, 'tile'),
    w(1200, 700, 400, 30, 'tile'),
    w(1600, 700, 30, 300, 'tile'),
    
    // Connector
    w(1600, 700, 30, 400, 'concrete'),
    w(1600, 1100, 600, 30, 'concrete'),
    w(2200, 700, 30, 400, 'concrete'),
    
    // Underpass
    w(500, 1300, 30, 300, 'concrete'),
    w(500, 1300, 400, 30, 'concrete'),
    w(900, 1300, 30, 300, 'concrete'),
    
    // Mid boxes
    w(800, 800, 80, 40, 'brick', true),
    w(700, 900, 60, 40, 'metal', true),
    w(900, 1000, 70, 40, 'brick', true),

    // === APARTMENTS (B Short) ===
    w(400, 1500, 30, 400, 'concrete'),
    w(400, 1900, 400, 30, 'concrete'),
    w(800, 1500, 30, 400, 'concrete'),
    w(400, 1500, 400, 30, 'concrete'),
    
    // Kitchen
    w(800, 1700, 30, 200, 'tile'),
    w(800, 1700, 200, 30, 'tile'),
    w(1000, 1700, 30, 200, 'tile'),
    
    // Apartments boxes
    w(500, 1650, 60, 40, 'metal', true),
    w(600, 1800, 80, 40, 'brick', true),

    // === B SITE ===
    w(1000, 1500, 30, 600, 'concrete'),
    w(1000, 2100, 1200, 30, 'concrete'),
    w(2200, 1500, 30, 600, 'concrete'),
    w(1000, 1500, 1200, 30, 'concrete'),
    
    // B Short / Catwalk
    w(1600, 1400, 30, 100, 'concrete'),
    w(1600, 1400, 300, 30, 'concrete'),
    w(1900, 1400, 30, 100, 'concrete'),
    
    // Van
    w(1500, 1800, 150, 40, 'metal'),
    
    // Bench
    w(1400, 1900, 100, 20, 'wood', true),
    
    // B boxes
    w(1200, 1700, 80, 40, 'brick', true),
    w(1800, 2000, 100, 40, 'metal', true),
    w(2000, 1850, 60, 40, 'brick', true),
    
    // Market
    w(1300, 2100, 30, 200, 'concrete'),
    w(1300, 2100, 300, 30, 'concrete'),
    w(1600, 2100, 30, 200, 'concrete'),

    // === CT SPAWN ===
    w(2800, 600, 700, 30, 'concrete'),
    w(2800, 1200, 700, 30, 'concrete'),
    w(3400, 600, 30, 600, 'concrete'),
    
    // CT boxes
    w(3000, 700, 80, 40, 'metal', true),
    w(3200, 900, 60, 40, 'brick', true),
  ],
};

export const MAPS = [dust2Map, mirageMap];
