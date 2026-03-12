import { Vec2, Wall } from './types';

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lineIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number
): Vec2 | null {
  const edges = [
    { ax: rx, ay: ry, bx: rx + rw, by: ry },
    { ax: rx + rw, ay: ry, bx: rx + rw, by: ry + rh },
    { ax: rx + rw, ay: ry + rh, bx: rx, by: ry + rh },
    { ax: rx, ay: ry + rh, bx: rx, by: ry },
  ];

  let closest: Vec2 | null = null;
  let closestDist = Infinity;

  for (const edge of edges) {
    const hit = lineLineIntersection(x1, y1, x2, y2, edge.ax, edge.ay, edge.bx, edge.by);
    if (hit) {
      const d = distance({ x: x1, y: y1 }, hit);
      if (d < closestDist) {
        closestDist = d;
        closest = hit;
      }
    }
  }

  return closest;
}

function lineLineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): Vec2 | null {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
}

export function circleRectCollision(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number
): Vec2 | null {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < cr) {
    if (dist === 0) return { x: cx, y: cy };
    const overlap = cr - dist;
    return { x: (dx / dist) * overlap, y: (dy / dist) * overlap };
  }
  return null;
}

export function raycast(
  origin: Vec2, angle: number, maxDist: number, walls: Wall[]
): { hit: Vec2; dist: number } {
  const endX = origin.x + Math.cos(angle) * maxDist;
  const endY = origin.y + Math.sin(angle) * maxDist;

  let closestHit: Vec2 = { x: endX, y: endY };
  let closestDist = maxDist;

  for (const wall of walls) {
    const hit = lineIntersectsRect(
      origin.x, origin.y, endX, endY,
      wall.x, wall.y, wall.w, wall.h
    );
    if (hit) {
      const d = distance(origin, hit);
      if (d < closestDist) {
        closestDist = d;
        closestHit = hit;
      }
    }
  }

  return { hit: closestHit, dist: closestDist };
}

export function hasLineOfSight(a: Vec2, b: Vec2, walls: Wall[]): boolean {
  for (const wall of walls) {
    const hit = lineIntersectsRect(a.x, a.y, b.x, b.y, wall.x, wall.y, wall.w, wall.h);
    if (hit) return false;
  }
  return true;
}

export function randomPointInMap(width: number, height: number, walls: Wall[], radius: number): Vec2 {
  for (let i = 0; i < 100; i++) {
    const p = { x: 100 + Math.random() * (width - 200), y: 100 + Math.random() * (height - 200) };
    let valid = true;
    for (const w of walls) {
      if (circleRectCollision(p.x, p.y, radius, w.x, w.y, w.w, w.h)) {
        valid = false;
        break;
      }
    }
    if (valid) return p;
  }
  return { x: width / 2, y: height / 2 };
}
