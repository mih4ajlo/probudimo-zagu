import { tryMove, type Point } from "./geo";

export type WalkStep = {
  pos: Point;
  // Sideways movement this step, for facing.
  dx: number;
  done: boolean;
};

// One frame of walking toward a tapped spot. Slides along the border like the
// keys do, and finishes on arrival or when she can get no closer.
export function walkStep(from: Point, target: Point, step: number, canStand: (p: Point) => boolean): WalkStep {
  const distance = Math.hypot(target.x - from.x, target.y - from.y);
  if (distance <= step && canStand(target)) {
    return { pos: target, dx: target.x - from.x, done: true };
  }
  const scale = Math.min(step, distance) / distance;
  const delta = { x: (target.x - from.x) * scale, y: (target.y - from.y) * scale };
  const pos = tryMove(from, delta, canStand);
  const closer = Math.hypot(target.x - pos.x, target.y - pos.y) < distance - 1e-6;
  return { pos, dx: pos.x - from.x, done: !closer };
}
