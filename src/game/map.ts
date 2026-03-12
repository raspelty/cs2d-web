import { GameMap, Wall, Vec2 } from './types';

export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 2200;

// Simple but effective textures - much lighter
function createSimpleTexture(ctx: CanvasRenderingContext2D, baseColor: string, variation: string): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 32; // Smaller texture = faster
  canvas.height = 32;
  const c = canvas.getContext('2d')!;
  
  c.fillStyle = baseColor;
  c.fillRect(0, 0, 32, 32);
  
  // Just a few noise dots, not thousands
  for (let i = 0; i < 20; i++) {
    c.fillStyle = variation;
    c.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 1, 1);
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

// Wall helper - simplified
export function w(x: number, y: number, width: number, height: number, jumpable = false): Wall {
  return { x, y, w: width, h: height, jumpable };
}

// Props - simplified, fewer
export interface Prop {
  pos: Vec2;
  type: 'box' | 'barrel';
  width: number;
  height: number;
}

// === DUST II - SIMPLIFIED, PLAYABLE ===
export const dust2Map: GameMap = {
  name: 'DUST II',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'dust',
  spawnPoints: [{ x: 400, y: 800 }], // T Spawn - FIXED: actually accessible
  enemySpawns: [ // CT Spawn
    { x: 2600, y: 400 },
    { x: 2600, y: 600 },
    { x: 2600, y: 800 },
  ],
  bombSites: [
    { pos: { x: 2400, y: 400 }, label: 'A', radius: 150 },
    { pos: { x: 1800, y: 1800 }, label: 'B', radius: 150 },
  ],
  props: [
    { pos: { x: 2400, y: 350 }, type: 'box', width: 40, height: 40 },
    { pos: { x: 2500, y: 450 }, type: 'box', width: 40, height: 40 },
    { pos: { x: 1900, y: 1750 }, type: 'box', width: 50, height: 50 },
    { pos: { x: 1700, y: 1850 }, type: 'barrel', width: 25, height: 40 },
    { pos: { x: 1200, y: 1000 }, type: 'box', width: 40, height: 40 },
  ],
  walls: [
    // === OUTER BOUNDARIES ===
    w(0, 0, MAP_WIDTH, 20), // Top
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20), // Bottom
    w(0, 0, 20, MAP_HEIGHT), // Left
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT), // Right

    // === T SPAWN - FIXED: proper exits ===
    w(20, 400, 400, 20), // Top barrier
    w(20, 1200, 400, 20), // Bottom barrier
    w(400, 400, 20, 400), // Right barrier - leaves gap at bottom
    w(400, 900, 20, 300), // Continue barrier
    
    // === PATH TO MID ===
    w(400, 600, 100, 20),
    w(400, 800, 100, 20),
    
    // === LONG A ===
    w(500, 100, 1200, 20),
    w(500, 500, 1200, 20),
    w(500, 100, 20, 400),
    w(1700, 100, 20, 400),
    
    // Long doors - just simple boxes
    w(900, 200, 80, 40, true), // Jumpable box
    w(1300, 300, 60, 40, true),

    // === A SITE ===
    w(1700, 100, 1000, 20),
    w(2500, 100, 20, 400),
    w(1700, 100, 20, 400),
    w(1700, 480, 820, 20),
    
    // A site boxes
    w(2200, 200, 80, 40, true),
    w(2400, 300, 60, 40, true),

    // === MID ===
    w(500, 700, 20, 400),
    w(500, 1100, 400, 20),
    w(900, 700, 20, 400),
    
    // Mid boxes
    w(700, 800, 60, 40, true),
    w(1100, 900, 80, 40, true),

    // === B TUNNELS ===
    w(500, 1300, 20, 400),
    w(500, 1700, 400, 20),
    w(900, 1300, 20, 400),
    
    // Tunnel boxes
    w(600, 1500, 60, 40, true),

    // === B SITE ===
    w(900, 1300, 20, 600),
    w(900, 1900, 1000, 20),
    w(1900, 1300, 20, 600),
    w(900, 1300, 1000, 20),
    
    // B site boxes
    w(1200, 1600, 80, 40, true),
    w(1600, 1700, 60, 40, true),

    // === CT SPAWN ===
    w(2500, 500, 480, 20),
    w(2500, 900, 480, 20),
    w(2980, 500, 20, 400),
    
    // CT boxes
    w(2700, 600, 60, 40, true),
  ],
};

// === MIRAGE - SIMPLIFIED ===
export const mirageMap: GameMap = {
  name: 'MIRAGE',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'concrete',
  spawnPoints: [{ x: 400, y: 800 }],
  enemySpawns: [
    { x: 2600, y: 400 },
    { x: 2600, y: 600 },
    { x: 2600, y: 800 },
  ],
  bombSites: [
    { pos: { x: 2400, y: 400 }, label: 'A', radius: 150 },
    { pos: { x: 1600, y: 1700 }, label: 'B', radius: 150 },
  ],
  props: [
    { pos: { x: 2400, y: 350 }, type: 'box', width: 40, height: 40 },
    { pos: { x: 1700, y: 1650 }, type: 'box', width: 50, height: 50 },
  ],
  walls: [
    w(0, 0, MAP_WIDTH, 20),
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20),
    w(0, 0, 20, MAP_HEIGHT),
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT),

    // T Spawn
    w(20, 400, 400, 20),
    w(20, 1200, 400, 20),
    w(400, 400, 20, 400),
    w(400, 900, 20, 300),

    // Palace/A ramp
    w(400, 200, 30, 400),
    w(400, 200, 800, 20),
    w(1200, 200, 30, 300),

    // A site
    w(1200, 200, 30, 300),
    w(2500, 200, 30, 400),
    w(1200, 200, 1300, 20),
    w(1200, 500, 1300, 20),
    
    // A boxes
    w(1800, 300, 80, 40, true),
    w(2200, 350, 60, 40, true),

    // Mid
    w(400, 700, 30, 400),
    w(400, 1100, 600, 20),
    w(1000, 700, 30, 400),

    // Connector
    w(1300, 700, 30, 300),
    w(1300, 700, 400, 20),

    // B apps
    w(400, 1300, 30, 400),
    w(400, 1700, 400, 20),
    w(800, 1300, 30, 400),

    // B site
    w(800, 1300, 30, 500),
    w(800, 1800, 900, 20),
    w(1700, 1300, 30, 500),
    w(800, 1300, 900, 20),
    
    // B boxes
    w(1100, 1500, 70, 40, true),

    // CT spawn
    w(2500, 400, 480, 20),
    w(2500, 900, 480, 20),
    w(2980, 400, 20, 500),
  ],
};

export const MAPS = [dust2Map, mirageMap];
