import { GameMap, Wall, Vec2 } from './types';

// Dust 2 inspired layout - scaled to ~3200x2400 for good gameplay
export const MAP_WIDTH = 3200;
export const MAP_HEIGHT = 2400;

// Helper to create walls
function w(x: number, y: number, width: number, height: number): Wall {
  return { x, y, w: width, h: height };
}

// Map zones for texture rendering
export interface MapZone {
  x: number; y: number; w: number; h: number;
  type: 'sand' | 'stone' | 'wood' | 'bombsite' | 'spawn_t' | 'spawn_ct' | 'concrete';
  label?: string;
}

export const mapZones: MapZone[] = [
  // T Spawn area
  { x: 0, y: 800, w: 400, h: 800, type: 'spawn_t', label: 'T SPAWN' },
  // CT Spawn area
  { x: 2700, y: 400, w: 500, h: 600, type: 'spawn_ct', label: 'CT SPAWN' },
  // Long A (the long straight corridor)
  { x: 400, y: 200, w: 1200, h: 300, type: 'sand' },
  // Long doors
  { x: 400, y: 200, w: 200, h: 300, type: 'stone', label: 'LONG DOORS' },
  // A site
  { x: 2100, y: 100, w: 600, h: 500, type: 'bombsite', label: 'A' },
  // A short / catwalk
  { x: 1400, y: 500, w: 400, h: 400, type: 'stone', label: 'SHORT' },
  // Mid
  { x: 800, y: 700, w: 600, h: 600, type: 'sand', label: 'MID' },
  // Lower tunnels
  { x: 200, y: 1600, w: 800, h: 400, type: 'concrete', label: 'LOWER TUNNELS' },
  // Upper tunnels / B tunnels
  { x: 1000, y: 1500, w: 600, h: 500, type: 'concrete', label: 'UPPER TUNNELS' },
  // B site
  { x: 1800, y: 1400, w: 700, h: 600, type: 'bombsite', label: 'B' },
  // B doors
  { x: 1600, y: 1600, w: 200, h: 300, type: 'wood', label: 'B DOORS' },
  // CT mid / connector
  { x: 1800, y: 700, w: 500, h: 500, type: 'stone', label: 'CT MID' },
  // Pit (A site)
  { x: 1600, y: 100, w: 300, h: 200, type: 'sand', label: 'PIT' },
  // Goose / A platform
  { x: 2400, y: 100, w: 200, h: 200, type: 'stone', label: 'GOOSE' },
];

export const gameMap: GameMap = {
  width: MAP_WIDTH,
  height: MAP_HEIGHT,

  // T spawns on the left
  spawnPoints: [{ x: 200, y: 1200 }],

  // CT spawns on the right (enemies for now)
  enemySpawns: [
    { x: 2900, y: 500 },
    { x: 2900, y: 700 },
    { x: 2900, y: 900 },
    { x: 2400, y: 300 },  // A site
    { x: 2100, y: 1600 }, // B site
  ],

  bombSites: [
    { pos: { x: 2400, y: 300 }, label: 'A', radius: 140 },
    { pos: { x: 2100, y: 1700 }, label: 'B', radius: 140 },
  ],

  walls: [
    // === OUTER BOUNDARIES ===
    w(0, 0, MAP_WIDTH, 20),           // top
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20), // bottom
    w(0, 0, 20, MAP_HEIGHT),          // left
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT), // right

    // === T SPAWN AREA ===
    // Top wall of T spawn
    w(20, 600, 400, 20),
    // Bottom wall of T spawn
    w(20, 1700, 400, 20),

    // === LONG A ===
    // Long A top wall
    w(400, 100, 1400, 20),
    // Long A bottom wall (with gap for doors)
    w(400, 500, 300, 20),
    w(900, 500, 900, 20),
    // Long doors - two parallel walls creating a corridor
    w(400, 120, 20, 200),
    w(400, 380, 20, 120),
    w(600, 120, 20, 180),
    w(600, 360, 20, 140),
    // The "doors" gap is at y:300-380
    // Pit wall (drop down before A site)
    w(1600, 120, 20, 180),
    // Long corner box
    w(1000, 200, 80, 80),

    // === A SITE ===
    // A site back wall
    w(2700, 100, 20, 500),
    // A site top
    w(1800, 100, 900, 20),
    // Goose corner
    w(2500, 120, 100, 100),
    // A default plant box
    w(2300, 250, 80, 80),
    // A ramp wall
    w(1800, 120, 20, 200),
    // Short stairs wall connecting to A site
    w(1800, 380, 20, 140),
    // A site bottom wall
    w(1800, 500, 500, 20),
    w(2500, 500, 200, 20),

    // === SHORT A / CATWALK ===
    // Catwalk left wall
    w(1400, 320, 20, 400),
    // Catwalk right wall
    w(1600, 300, 20, 220),
    // Short stairs bottom
    w(1400, 700, 420, 20),

    // === MID ===
    // Mid left wall (from T spawn side)
    w(400, 620, 20, 400),
    // Mid right wall towards CT
    w(400, 1100, 20, 300),
    // Mid top connector wall
    w(700, 620, 20, 100),
    w(700, 820, 20, 200),
    // Mid boxes
    w(900, 850, 70, 70),
    w(650, 1050, 60, 60),
    // Xbox (famous mid smoke spot)
    w(1100, 700, 80, 80),
    // Mid doors gap at CT side
    w(1400, 720, 20, 200),
    w(1400, 1000, 20, 200),
    // CT mid connector
    w(1800, 520, 20, 300),
    w(1800, 900, 20, 300),

    // === B TUNNELS ===
    // Lower tunnel entrance from T
    w(200, 1400, 20, 200),
    w(200, 1700, 800, 20),
    w(200, 1400, 300, 20),
    // Upper tunnel walls
    w(500, 1400, 20, 300),
    w(700, 1400, 20, 200),
    w(1000, 1400, 20, 200),
    w(700, 1600, 300, 20),
    // B tunnel to site connector
    w(1000, 1500, 600, 20),
    w(1000, 2000, 800, 20),
    // Tunnel boxes
    w(800, 1800, 60, 60),
    w(1200, 1700, 60, 60),

    // === B SITE ===
    // B site walls
    w(1800, 1200, 20, 300),
    w(1800, 1600, 20, 420),
    w(2700, 1200, 20, 820),
    w(1800, 1200, 920, 20),
    w(1800, 2000, 920, 20),
    // B boxes (cover)
    w(2000, 1500, 100, 80),
    w(2400, 1400, 80, 100),
    // B car
    w(2200, 1800, 120, 60),
    // B doors entrance
    w(1600, 1520, 200, 20),
    w(1600, 1900, 200, 20),

    // === CT SPAWN ===
    w(2700, 520, 300, 20),
    w(2700, 1000, 300, 20),
    // CT spawn box
    w(2850, 700, 80, 80),

    // === ADDITIONAL COVER ===
    // Barrels at long
    w(1300, 200, 50, 50),
    // Mid to B connector wall
    w(1400, 1200, 400, 20),
    // Window room walls
    w(1200, 1000, 200, 20),
    w(1200, 1000, 20, 220),
    w(1200, 1200, 200, 20),
  ],
};

// Crate/box positions for decoration (rendered differently from walls)
export interface Crate {
  pos: Vec2;
  size: number;
  type: 'wooden' | 'metal' | 'barrel';
}

export const mapCrates: Crate[] = [
  { pos: { x: 1040, y: 240 }, size: 40, type: 'wooden' },
  { pos: { x: 1340, y: 240 }, size: 30, type: 'barrel' },
  { pos: { x: 940, y: 890 }, size: 35, type: 'wooden' },
  { pos: { x: 690, y: 1090 }, size: 30, type: 'barrel' },
  { pos: { x: 840, y: 1840 }, size: 30, type: 'wooden' },
  { pos: { x: 1240, y: 1740 }, size: 30, type: 'metal' },
  { pos: { x: 2340, y: 290 }, size: 40, type: 'wooden' },
  { pos: { x: 2540, y: 160 }, size: 35, type: 'metal' },
  { pos: { x: 2040, y: 1540 }, size: 50, type: 'wooden' },
  { pos: { x: 2440, y: 1440 }, size: 40, type: 'metal' },
  { pos: { x: 2240, y: 1840 }, size: 60, type: 'wooden' },
  { pos: { x: 2890, y: 740 }, size: 40, type: 'wooden' },
];
