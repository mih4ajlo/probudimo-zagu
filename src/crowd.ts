import { MAX_FOLLOWERS } from "./data/hunt";
import type { Point } from "./geo";

// Followers walk where the leader walked, this many game units apart.
export const FOLLOWER_SPACING = 9;
// The leader's path is kept as points at least this far apart.
export const TRAIL_STEP = 2;
// Path kept behind the newest point: enough for the last follower.
const KEEP_LENGTH = (MAX_FOLLOWERS + 1) * FOLLOWER_SPACING;

// The leader's recent path, newest point first.
export type Trail = { points: Point[] };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function createTrail(start: Point): Trail {
  return { points: [{ ...start }] };
}

export function pushTrail(trail: Trail, leader: Point): void {
  if (distance(leader, trail.points[0]) < TRAIL_STEP) {
    return;
  }
  trail.points.unshift({ ...leader });
  let length = 0;
  for (let i = 1; i < trail.points.length; i++) {
    length += distance(trail.points[i - 1], trail.points[i]);
    if (length > KEEP_LENGTH) {
      trail.points.length = i + 1;
      return;
    }
  }
}

// Follower i stands i * spacing along the path behind the leader, or at the
// oldest point while the path is still shorter than that.
export function followerPositions(
  trail: Trail,
  leader: Point,
  count: number,
  spacing = FOLLOWER_SPACING,
): Point[] {
  const path = [leader, ...trail.points];
  const spots: Point[] = [];
  let segment = 0;
  // Path length from the leader to path[segment].
  let walked = 0;
  for (let i = 1; i <= count; i++) {
    const wanted = i * spacing;
    while (segment < path.length - 1 && walked + distance(path[segment], path[segment + 1]) < wanted) {
      walked += distance(path[segment], path[segment + 1]);
      segment += 1;
    }
    if (segment >= path.length - 1) {
      spots.push({ ...path[path.length - 1] });
      continue;
    }
    const a = path[segment];
    const b = path[segment + 1];
    const t = (wanted - walked) / distance(a, b);
    spots.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return spots;
}
