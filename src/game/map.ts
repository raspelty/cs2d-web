import { GameMap } from './types';

export const MAP_WIDTH = 2400;
export const MAP_HEIGHT = 1600;

export const gameMap: GameMap = {
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  spawnPoints: [{ x: 200, y: 800 }],
  enemySpawns: [
    { x: 2200, y: 200 },
    { x: 2200, y: 800 },
    { x: 2200, y: 1400 },
    { x: 1800, y: 400 },
    { x: 1800, y: 1200 },
  ],
  bombSites: [
    { pos: { x: 1800, y: 300 }, label: 'A', radius: 120 },
    { pos: { x: 1800, y: 1300 }, label: 'B', radius: 120 },
  ],
  walls: [
    // Outer boundary
    { x: 0, y: 0, w: MAP_WIDTH, h: 20 },
    { x: 0, y: MAP_HEIGHT - 20, w: MAP_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: MAP_HEIGHT },
    { x: MAP_WIDTH - 20, y: 0, w: 20, h: MAP_HEIGHT },

    // T-spawn area walls
    { x: 400, y: 0, w: 20, h: 300 },
    { x: 400, y: 500, w: 20, h: 300 },
    { x: 400, y: 1000, w: 20, h: 300 },
    { x: 400, y: 1500, w: 20, h: 100 },

    // Mid structures
    { x: 700, y: 300, w: 200, h: 20 },
    { x: 700, y: 300, w: 20, h: 200 },
    { x: 700, y: 700, w: 20, h: 200 },
    { x: 700, y: 900, w: 200, h: 20 },

    // Center box
    { x: 1050, y: 650, w: 200, h: 20 },
    { x: 1050, y: 650, w: 20, h: 300 },
    { x: 1050, y: 930, w: 200, h: 20 },
    { x: 1230, y: 650, w: 20, h: 300 },

    // A site walls
    { x: 1500, y: 0, w: 20, h: 200 },
    { x: 1500, y: 200, w: 300, h: 20 },
    { x: 1500, y: 400, w: 300, h: 20 },
    { x: 1500, y: 400, w: 20, h: 100 },

    // B site walls
    { x: 1500, y: 1100, w: 20, h: 100 },
    { x: 1500, y: 1200, w: 300, h: 20 },
    { x: 1500, y: 1400, w: 300, h: 20 },
    { x: 1500, y: 1400, w: 20, h: 200 },

    // Connector walls
    { x: 1100, y: 200, w: 20, h: 150 },
    { x: 1100, y: 1250, w: 20, h: 150 },

    // Small cover boxes
    { x: 850, y: 550, w: 60, h: 60 },
    { x: 850, y: 1000, w: 60, h: 60 },
    { x: 1350, y: 750, w: 60, h: 60 },
    { x: 600, y: 1200, w: 80, h: 40 },
    { x: 600, y: 400, w: 80, h: 40 },
  ],
};
