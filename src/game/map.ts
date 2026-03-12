import { GameMap, Wall, Vec2 } from './types';

export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 2200;

export function w(x: number, y: number, width: number, height: number, jumpable = false): Wall {
  return { x, y, w: width, h: height, jumpable };
}

// === DUST II - ACTUALLY PLAYABLE ===
export const dust2Map: GameMap = {
  name: 'DUST II',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'dust',
  // FIXED: Spawn in open area, not in walls
  spawnPoints: [{ x: 300, y: 900 }],
  enemySpawns: [
    { x: 2600, y: 500 },
    { x: 2600, y: 700 },
    { x: 2600, y: 900 },
  ],
  bombSites: [
    { pos: { x: 2500, y: 500 }, label: 'A', radius: 150 },
    { pos: { x: 1800, y: 1700 }, label: 'B', radius: 150 },
  ],
  walls: [
    // Boundaries
    w(0, 0, MAP_WIDTH, 20),
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20),
    w(0, 0, 20, MAP_HEIGHT),
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT),

    // T Spawn - FIXED: Open area, not boxing player in
    w(20, 500, 200, 20),
    w(20, 1300, 200, 20),
    w(200, 500, 20, 400),
    w(200, 1000, 20, 300),

    // Long A - FIXED: Proper corridors
    w(220, 200, 1200, 20),
    w(220, 500, 1200, 20),
    w(220, 200, 20, 300),
    w(1420, 200, 20, 300),
    
    // A Site - FIXED: Open bombsite
    w(1420, 200, 1200, 20),
    w(2620, 200, 20, 400),
    w(1420, 200, 20, 400),
    w(1420, 600, 1200, 20),
    
    // A boxes (cover only, not blocking)
    w(1800, 300, 60, 40, true),
    w(2200, 400, 60, 40, true),

    // Mid - FIXED: Proper connections
    w(220, 700, 20, 400),
    w(220, 1100, 500, 20),
    w(720, 700, 20, 400),
    
    // Mid boxes
    w(400, 800, 60, 40, true),
    w(500, 900, 60, 40, true),

    // B tunnels - FIXED: Open path
    w(220, 1400, 20, 400),
    w(220, 1800, 500, 20),
    w(720, 1400, 20, 400),
    
    // B Site - FIXED: Open bombsite
    w(720, 1400, 20, 500),
    w(720, 1900, 1200, 20),
    w(1920, 1400, 20, 500),
    w(720, 1400, 1200, 20),
    
    // B boxes
    w(1000, 1600, 60, 40, true),
    w(1400, 1700, 60, 40, true),

    // CT Spawn - FIXED: Open area
    w(2620, 400, 360, 20),
    w(2620, 900, 360, 20),
    w(2980, 400, 20, 500),
    
    // CT boxes
    w(2800, 500, 60, 40, true),
  ],
};

// === MIRAGE - ACTUALLY PLAYABLE ===
export const mirageMap: GameMap = {
  name: 'MIRAGE',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  groundTexture: 'concrete',
  spawnPoints: [{ x: 300, y: 900 }],
  enemySpawns: [
    { x: 2600, y: 500 },
    { x: 2600, y: 700 },
    { x: 2600, y: 900 },
  ],
  bombSites: [
    { pos: { x: 2500, y: 500 }, label: 'A', radius: 150 },
    { pos: { x: 1600, y: 1600 }, label: 'B', radius: 150 },
  ],
  walls: [
    w(0, 0, MAP_WIDTH, 20),
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20),
    w(0, 0, 20, MAP_HEIGHT),
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT),

    // T Spawn - FIXED: Open
    w(20, 500, 200, 20),
    w(20, 1300, 200, 20),
    w(200, 500, 20, 400),
    w(200, 1000, 20, 300),

    // Palace/A ramp - FIXED: Open path
    w(220, 200, 20, 300),
    w(220, 200, 900, 20),
    w(1120, 200, 20, 300),

    // A site - FIXED: Open
    w(1120, 200, 20, 400),
    w(2620, 200, 20, 400),
    w(1120, 200, 1500, 20),
    w(1120, 600, 1500, 20),
    
    // A boxes
    w(1600, 300, 60, 40, true),
    w(2000, 400, 60, 40, true),

    // Mid - FIXED: Open
    w(220, 700, 20, 400),
    w(220, 1100, 600, 20),
    w(820, 700, 20, 400),

    // Connector
    w(1120, 700, 20, 300),
    w(1120, 700, 400, 20),

    // B apps - FIXED: Open
    w(220, 1400, 20, 400),
    w(220, 1800, 500, 20),
    w(720, 1400, 20, 400),

    // B site - FIXED: Open
    w(720, 1400, 20, 500),
    w(720, 1900, 1000, 20),
    w(1720, 1400, 20, 500),
    w(720, 1400, 1000, 20),
    
    // B boxes
    w(1000, 1600, 60, 40, true),

    // CT spawn - FIXED: Open
    w(2620, 400, 360, 20),
    w(2620, 900, 360, 20),
    w(2980, 400, 20, 500),
    
    // CT boxes
    w(2800, 500, 60, 40, true),
  ],
};

export const MAPS = [dust2Map, mirageMap];
