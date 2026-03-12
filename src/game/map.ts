import { GameMap, Wall, Vec2 } from './types';

export const MAP_WIDTH = 3200;
export const MAP_HEIGHT = 2400;

function w(x: number, y: number, width: number, height: number, jumpable = false): Wall {
  return { x, y, w: width, h: height, jumpable };
}

export interface MapZone {
  x: number; y: number; w: number; h: number;
  type: 'sand' | 'stone' | 'wood' | 'bombsite' | 'spawn_t' | 'spawn_ct' | 'concrete';
  label?: string;
}

export const mapZones: MapZone[] = [
  { x: 0, y: 800, w: 400, h: 800, type: 'spawn_t', label: 'T SPAWN' },
  { x: 2700, y: 400, w: 500, h: 600, type: 'spawn_ct', label: 'CT SPAWN' },
  { x: 400, y: 200, w: 1200, h: 300, type: 'sand' },
  { x: 400, y: 200, w: 200, h: 300, type: 'stone', label: 'LONG DOORS' },
  { x: 2100, y: 100, w: 600, h: 500, type: 'bombsite', label: 'A' },
  { x: 1400, y: 500, w: 400, h: 400, type: 'stone', label: 'SHORT' },
  { x: 800, y: 700, w: 600, h: 600, type: 'sand', label: 'MID' },
  { x: 200, y: 1600, w: 800, h: 400, type: 'concrete', label: 'LOWER TUNNELS' },
  { x: 1000, y: 1500, w: 600, h: 500, type: 'concrete', label: 'UPPER TUNNELS' },
  { x: 1800, y: 1400, w: 700, h: 600, type: 'bombsite', label: 'B' },
  { x: 1600, y: 1600, w: 200, h: 300, type: 'wood', label: 'B DOORS' },
  { x: 1800, y: 700, w: 500, h: 500, type: 'stone', label: 'CT MID' },
  { x: 1600, y: 100, w: 300, h: 200, type: 'sand', label: 'PIT' },
  { x: 2400, y: 100, w: 200, h: 200, type: 'stone', label: 'GOOSE' },
];

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

export const dust2Map: GameMap = {
  name: 'Dust II',
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnPoints: [{ x: 200, y: 1200 }],
  enemySpawns: [
    { x: 2900, y: 500 },
    { x: 2900, y: 700 },
    { x: 2900, y: 900 },
    { x: 2400, y: 300 },
    { x: 2100, y: 1600 },
  ],
  bombSites: [
    { pos: { x: 2400, y: 300 }, label: 'A', radius: 140 },
    { pos: { x: 2100, y: 1700 }, label: 'B', radius: 140 },
  ],
  walls: [
    // === OUTER BOUNDARIES ===
    w(0, 0, MAP_WIDTH, 20),
    w(0, MAP_HEIGHT - 20, MAP_WIDTH, 20),
    w(0, 0, 20, MAP_HEIGHT),
    w(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT),

    // === T SPAWN AREA (open connections to mid and tunnels) ===
    w(20, 600, 400, 20),
    w(20, 1700, 400, 20),

    // === LONG A ===
    w(400, 100, 1400, 20),
    w(400, 500, 300, 20),
    w(900, 500, 900, 20),
    w(400, 120, 20, 200),
    w(400, 380, 20, 120),
    w(600, 120, 20, 180),
    w(600, 360, 20, 140),
    w(1600, 120, 20, 180),
    // Jumpable cover at long
    w(1000, 200, 80, 80, true),

    // === A SITE ===
    w(2700, 100, 20, 500),
    w(1800, 100, 900, 20),
    w(2500, 120, 100, 100, true), // Goose - jumpable
    w(2300, 250, 80, 80, true),   // Default box - jumpable
    w(1800, 120, 20, 200),
    w(1800, 380, 20, 140),
    w(1800, 500, 500, 20),
    w(2500, 500, 200, 20),

    // === SHORT / CATWALK ===
    w(1400, 320, 20, 400),
    w(1600, 300, 20, 220),
    w(1400, 700, 420, 20),

    // === MID (connected both sides) ===
    w(400, 620, 20, 400),
    w(400, 1100, 20, 300),
    w(700, 620, 20, 100),
    w(700, 820, 20, 200),
    // Jumpable mid boxes
    w(900, 850, 70, 70, true),
    w(650, 1050, 60, 60, true),
    w(1100, 700, 80, 80, true),  // Xbox
    // Mid doors (gap between for passage)
    w(1400, 720, 20, 200),
    w(1400, 1000, 20, 200),
    // CT mid connector (gaps for passage)
    w(1800, 520, 20, 250),
    w(1800, 850, 20, 350),

    // === B TUNNELS (connected from T spawn through lower) ===
    w(200, 1400, 20, 300),
    w(200, 1700, 300, 20),
    w(200, 1400, 300, 20),
    w(500, 1400, 20, 200),
    // Upper tunnels - open passage to B
    w(1000, 1400, 20, 100),
    w(700, 1600, 300, 20),
    w(1000, 1500, 600, 20),
    w(1000, 2000, 800, 20),
    // Jumpable tunnel boxes
    w(800, 1800, 60, 60, true),
    w(1200, 1700, 60, 60, true),

    // === B SITE ===
    w(1800, 1200, 20, 300),
    w(1800, 1600, 20, 420),
    w(2700, 1200, 20, 820),
    w(1800, 1200, 920, 20),
    w(1800, 2000, 920, 20),
    // Jumpable B site boxes
    w(2000, 1500, 100, 80, true),
    w(2400, 1400, 80, 100, true),
    w(2200, 1800, 120, 60, true), // B car
    // B doors
    w(1600, 1520, 200, 20),
    w(1600, 1900, 200, 20),

    // === CT SPAWN (connected to A and B) ===
    w(2700, 520, 300, 20),
    w(2700, 1000, 300, 20),
    w(2850, 700, 80, 80, true), // CT spawn box - jumpable

    // === COVER ===
    w(1300, 200, 50, 50, true),   // Long barrels - jumpable
    w(1400, 1200, 400, 20),
    // Window room (open passage)
    w(1200, 1000, 200, 20),
    w(1200, 1000, 20, 220),
    w(1200, 1200, 200, 20),
  ],
};

// Second map - Mirage inspired
const MIRAGE_W = 3000;
const MIRAGE_H = 2200;

export const mirageZones: MapZone[] = [
  { x: 0, y: 900, w: 350, h: 400, type: 'spawn_t', label: 'T SPAWN' },
  { x: 2600, y: 200, w: 400, h: 500, type: 'spawn_ct', label: 'CT SPAWN' },
  { x: 800, y: 100, w: 800, h: 400, type: 'sand', label: 'A RAMP' },
  { x: 1800, y: 100, w: 700, h: 500, type: 'bombsite', label: 'A' },
  { x: 600, y: 700, w: 600, h: 500, type: 'stone', label: 'MID' },
  { x: 400, y: 1400, w: 800, h: 400, type: 'concrete', label: 'B APPS' },
  { x: 1600, y: 1300, w: 700, h: 600, type: 'bombsite', label: 'B' },
  { x: 1400, y: 600, w: 400, h: 400, type: 'stone', label: 'CONNECTOR' },
  { x: 2200, y: 700, w: 400, h: 400, type: 'stone', label: 'JUNGLE' },
];

export const mirageCrates: Crate[] = [
  { pos: { x: 1900, y: 250 }, size: 45, type: 'wooden' },
  { pos: { x: 2200, y: 350 }, size: 35, type: 'metal' },
  { pos: { x: 1750, y: 1500 }, size: 50, type: 'wooden' },
  { pos: { x: 2100, y: 1600 }, size: 40, type: 'metal' },
  { pos: { x: 900, y: 900 }, size: 35, type: 'barrel' },
  { pos: { x: 700, y: 1600 }, size: 30, type: 'wooden' },
];

export const mirageMap: GameMap = {
  name: 'Mirage',
  width: MIRAGE_W,
  height: MIRAGE_H,
  spawnPoints: [{ x: 180, y: 1100 }],
  enemySpawns: [
    { x: 2750, y: 350 },
    { x: 2750, y: 500 },
    { x: 2200, y: 250 },
    { x: 1900, y: 1500 },
    { x: 2100, y: 1700 },
  ],
  bombSites: [
    { pos: { x: 2100, y: 300 }, label: 'A', radius: 130 },
    { pos: { x: 1900, y: 1600 }, label: 'B', radius: 130 },
  ],
  walls: [
    // Boundaries
    w(0, 0, MIRAGE_W, 20),
    w(0, MIRAGE_H - 20, MIRAGE_W, 20),
    w(0, 0, 20, MIRAGE_H),
    w(MIRAGE_W - 20, 0, 20, MIRAGE_H),

    // T Spawn walls
    w(20, 700, 350, 20),
    w(20, 1500, 350, 20),

    // A Ramp
    w(400, 100, 20, 400),
    w(400, 100, 1200, 20),
    w(400, 500, 800, 20),
    w(1200, 500, 20, 100),

    // A Site
    w(1600, 100, 20, 400),
    w(2500, 100, 20, 500),
    w(1600, 100, 920, 20),
    w(1800, 500, 720, 20),
    w(1900, 200, 80, 80, true),  // A default box
    w(2200, 300, 70, 70, true),  // Triple box

    // Mid
    w(350, 720, 20, 480),
    w(350, 1300, 20, 200),
    w(1200, 600, 20, 300),
    w(1200, 1000, 20, 300),
    w(800, 850, 70, 70, true),   // Mid box
    w(600, 1050, 60, 60, true),

    // Connector (mid to A)
    w(1220, 600, 400, 20),
    w(1220, 1000, 400, 20),
    w(1600, 600, 20, 200),

    // Jungle/CT
    w(2100, 520, 20, 300),
    w(2100, 900, 20, 200),
    w(2500, 600, 20, 500),
    w(2500, 600, 300, 20),
    w(2500, 1100, 300, 20),
    w(2650, 700, 80, 80, true),

    // B Apps (T side to B)
    w(350, 1500, 20, 300),
    w(350, 1800, 850, 20),
    w(350, 1500, 300, 20),
    w(650, 1500, 20, 200),
    w(900, 1400, 20, 200),
    w(700, 1700, 60, 60, true),

    // B Site
    w(1400, 1300, 20, 300),
    w(1400, 1700, 20, 300),
    w(2300, 1300, 20, 700),
    w(1400, 1300, 920, 20),
    w(1400, 2000, 920, 20),
    w(1700, 1450, 100, 80, true), // B default
    w(2050, 1550, 80, 100, true), // B box
    w(1850, 1800, 120, 60, true), // Van

    // CT Spawn
    w(2520, 100, 300, 20),
    w(2520, 600, 300, 20),
    w(2700, 250, 80, 80, true),

    // Connections
    w(1200, 1300, 200, 20),
    w(1000, 1400, 400, 20),
  ],
};

// All available maps
export const MAPS = [dust2Map, mirageMap];

// Zones/crates per map
export function getMapZones(mapName: string): MapZone[] {
  return mapName === 'Mirage' ? mirageZones : mapZones;
}
export function getMapCrates(mapName: string): Crate[] {
  return mapName === 'Mirage' ? mirageCrates : mapCrates;
}

// Keep backward compat
export const gameMap = dust2Map;
