import { Vec2, Wall } from './types';

interface Node {
  pos: Vec2;
  connections: number[];
}

export class NavigationMesh {
  nodes: Node[] = [];
  gridSize = 60;
  
  constructor(mapWidth: number, mapHeight: number, walls: Wall[]) {
    this.generateNodes(mapWidth, mapHeight, walls);
  }
  
  private generateNodes(width: number, height: number, walls: Wall[]) {
    // Create a grid of potential nodes
    for (let x = 40; x < width - 40; x += this.gridSize) {
      for (let y = 40; y < height - 40; y += this.gridSize) {
        if (this.isPointValid({ x, y }, walls)) {
          this.nodes.push({ pos: { x, y }, connections: [] });
        }
      }
    }
    
    // Connect nearby nodes that have line of sight
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dist = this.distance(this.nodes[i].pos, this.nodes[j].pos);
        if (dist < this.gridSize * 1.8) {
          if (this.hasLineOfSight(this.nodes[i].pos, this.nodes[j].pos, walls)) {
            this.nodes[i].connections.push(j);
            this.nodes[j].connections.push(i);
          }
        }
      }
    }
  }
  
  private isPointValid(pos: Vec2, walls: Wall[]): boolean {
    for (const wall of walls) {
      if (pos.x > wall.x - 25 && pos.x < wall.x + wall.w + 25 &&
          pos.y > wall.y - 25 && pos.y < wall.y + wall.h + 25) {
        return false;
      }
    }
    return true;
  }
  
  private hasLineOfSight(a: Vec2, b: Vec2, walls: Wall[]): boolean {
    for (const wall of walls) {
      if (this.lineIntersectsRect(a, b, wall)) return false;
    }
    return true;
  }
  
  private lineIntersectsRect(a: Vec2, b: Vec2, wall: Wall): boolean {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    
    if (maxX < wall.x || minX > wall.x + wall.w || 
        maxY < wall.y || minY > wall.y + wall.h) {
      return false;
    }
    return true;
  }
  
  private distance(a: Vec2, b: Vec2): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  
  findPath(start: Vec2, goal: Vec2, walls: Wall[]): Vec2[] {
    let startNode = this.findNearestNode(start);
    let goalNode = this.findNearestNode(goal);
    
    if (startNode === -1 || goalNode === -1) return [goal];
    
    const openSet = new Set<number>([startNode]);
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>();
    const fScore = new Map<number, number>();
    
    gScore.set(startNode, 0);
    fScore.set(startNode, this.distance(this.nodes[startNode].pos, this.nodes[goalNode].pos));
    
    while (openSet.size > 0) {
      let current = this.getLowestFScore(openSet, fScore);
      
      if (current === goalNode) {
        return this.reconstructPath(cameFrom, current, this.nodes, start, goal);
      }
      
      openSet.delete(current);
      
      for (const neighbor of this.nodes[current].connections) {
        const tentativeG = (gScore.get(current) || Infinity) + 
          this.distance(this.nodes[current].pos, this.nodes[neighbor].pos);
        
        if (tentativeG < (gScore.get(neighbor) || Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + 
            this.distance(this.nodes[neighbor].pos, this.nodes[goalNode].pos));
          openSet.add(neighbor);
        }
      }
    }
    
    return [goal];
  }
  
  private findNearestNode(pos: Vec2): number {
    let bestDist = Infinity;
    let bestIdx = -1;
    
    for (let i = 0; i < this.nodes.length; i++) {
      const dist = this.distance(pos, this.nodes[i].pos);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    
    return bestIdx;
  }
  
  private getLowestFScore(set: Set<number>, fScore: Map<number, number>): number {
    let best = -1;
    let bestScore = Infinity;
    
    for (const idx of set) {
      const score = fScore.get(idx) || Infinity;
      if (score < bestScore) {
        bestScore = score;
        best = idx;
      }
    }
    
    return best;
  }
  
  private reconstructPath(
    cameFrom: Map<number, number>, 
    current: number,
    nodes: Node[],
    start: Vec2,
    goal: Vec2
  ): Vec2[] {
    const path: Vec2[] = [];
    let nodeIdx = current;
    
    while (cameFrom.has(nodeIdx)) {
      path.unshift(nodes[nodeIdx].pos);
      nodeIdx = cameFrom.get(nodeIdx)!;
    }
    
    if (path.length > 0) {
      path.unshift(start);
      path.push(goal);
    }
    
    return path;
  }
  
  getRandomValidPosition(walls: Wall[]): Vec2 {
    const validNodes = this.nodes.filter(node => this.isPointValid(node.pos, walls));
    if (validNodes.length === 0) return { x: 500, y: 500 };
    return validNodes[Math.floor(Math.random() * validNodes.length)].pos;
  }
}
