import { GameMap, Wall, Vec2 } from './types';

export const MAP_WIDTH = 3200;
export const MAP_HEIGHT = 2400;

// Original style textures
export function createConcreteTexture(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const c = canvas.getContext('2d')!;
  
  c.fillStyle = '#5A5E6B';
  c.fillRect(0, 0, 64, 64);
  
  for (let i = 0; i < 200; i++) {
    c.fillStyle = `hsl(220, 10%, ${55 + Math.random() * 20}%)`;
    c.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

export function createDustTexture(ctx: CanvasRenderingContext2D): CanvasPattern {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const c = canvas.getContext('2d')!;
  
  c.fillStyle = '#C6A97A';
  c.fillRect(0, 0, 64, 64);
  
  for (let i = 0; i < 200; i++) {
    c.fillStyle = `hsl(38, 35%, ${50 + Math.random() * 30}%)`;
    c.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 1, 1);
  }
  
  return ctx.createPattern(canvas, 'repeat')!;
}

export function w(x: number, y: number, width: number, height: number, jumpable = false): Wall {
  return { x, y, w: width, h: height, jumpable };
}

// === DUST II - ORIGINAL STYLE, FIXED SPAWNS ===
export const dust2Map: GameMap = {
  name: 'DUST II',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'dust',
  spawnPoints: [{ x: 300, y: 900 }], // FIXED: Open area T Spawn
  enemySpawns: [
    { x: 2800, y: 500 },
    { x: 2800, y: 700 },
    { x: 2800, y: 900 },
  ],
  bombSites: [
    { pos: { x: 2700, y: 450 }, label: 'A', radius: 160 },
    { pos: { x: 2000, y: 1900 }, label: 'B', radius: 160 },
  ],
  walls: [
    // Boundaries
    w(0, 0, MAP_WIDTH, 20),
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20),
    w(0, 0, 20, MAP_HEIGHT),
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT),

    // T Spawn - FIXED: Open area, not boxing player in
   

    // Long A
    w(420, 200, 1400, 20),
    w(420, 500, 1400, 20),
    w(420, 200, 20, 300),
    w(1820, 200, 20, 300),
    
    // Long doors - jumpable boxes
    w(900, 250, 80, 60, true),
    w(1300, 350, 60, 40, true),

    // A Site
    w(1840, 200, 1000, 20),
    w(2740, 200, 20, 400),
    w(1840, 200, 20, 400),
    w(1840, 600, 920, 20),
    
    // A boxes - jumpable
    w(2200, 300, 80, 40, true),
    w(2500, 400, 60, 40, true),
    w(2000, 450, 70, 40, true),

    // Catwalk
    w(1400, 600, 20, 300),
    w(1400, 900, 400, 20),
    w(1800, 600, 20, 300),

    // Mid
    w(420, 800, 20, 400),
    w(420, 1200, 500, 20),
    w(920, 800, 20, 400),
    
    // Mid boxes - jumpable
    w(600, 900, 80, 40, true),
    w(1100, 1000, 80, 40, true),

    // B tunnels
    w(420, 1500, 20, 400),
    w(420, 1900, 500, 20),
    w(920, 1500, 20, 400),
    
    // Tunnel boxes - jumpable
    w(600, 1700, 60, 40, true),

    // B Site
    w(920, 1500, 20, 600),
    w(920, 2100, 1200, 20),
    w(2120, 1500, 20, 600),
    w(920, 1500, 1200, 20),
    
    // B boxes - jumpable
    w(1200, 1700, 80, 40, true),
    w(1600, 1800, 60, 40, true),
    w(1900, 1900, 70, 40, true),

    // CT Spawn
    w(2740, 500, 440, 20),
    w(2740, 1000, 440, 20),
    w(3180, 500, 20, 500),
    
    // CT boxes - jumpable
    w(2900, 600, 60, 40, true),
    w(3000, 800, 60, 40, true),
  ],
};

// === MIRAGE - ORIGINAL STYLE, FIXED SPAWNS ===
export const mirageMap: GameMap = {
  name: 'MIRAGE',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'concrete',
  spawnPoints: [{ x: 400, y: 1000 }],
  enemySpawns: [
    { x: 2800, y: 500 },
    { x: 2800, y: 700 },
    { x: 2800, y: 900 },
  ],
  bombSites: [
    { pos: { x: 2700, y: 450 }, label: 'A', radius: 160 },
    { pos: { x: 1800, y: 1800 }, label: 'B', radius: 160 },
  ],
  walls: [
    w(0, 0, MAP_WIDTH, 20),
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20),
    w(0, 0, 20, MAP_HEIGHT),
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT),

    // T Spawn - FIXED: Open
    w(20, 600, 380, 20),
    w(20, 1400, 380, 20),
    w(400, 600, 20, 400),
    w(400, 1100, 20, 300),

    // Palace/A ramp
    w(420, 200, 20, 300),
    w(420, 200, 900, 20),
    w(1320, 200, 20, 300),

    // A site
    w(1340, 200, 20, 400),
    w(2740, 200, 20, 400),
    w(1340, 200, 1400, 20),
    w(1340, 600, 1400, 20),
    
    // A boxes - jumpable
    w(1800, 300, 80, 40, true),
    w(2200, 350, 60, 40, true),
    w(2500, 400, 70, 40, true),

    // Mid
    w(420, 800, 20, 400),
    w(420, 1200, 600, 20),
    w(1020, 800, 20, 400),

    // Connector
    w(1340, 800, 20, 300),
    w(1340, 800, 400, 20),

    // B apps
    w(420, 1500, 20, 400),
    w(420, 1900, 500, 20),
    w(920, 1500, 20, 400),

    // B site
    w(940, 1500, 20, 500),
    w(940, 2000, 1000, 20),
    w(1940, 1500, 20, 500),
    w(940, 1500, 1000, 20),
    
    // B boxes - jumpable
    w(1200, 1600, 80, 40, true),

    // CT spawn
    w(2740, 500, 440, 20),
    w(2740, 1000, 440, 20),
    w(3180, 500, 20, 500),
    
    // CT boxes - jumpable
    w(2900, 600, 60, 40, true),
  ],
};

export const MAPS = [dust2Map, mirageMap];
