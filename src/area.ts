import { OJT_AREAS } from "./data/jurisdiction";
import type { Point } from "./geo";

// The map has no municipality borders: she is in the VJT area of the nearest OJT seat.
export function vjtAreaAt(point: Point, seats: ReadonlyMap<string, Point>): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const [id, seat] of seats) {
    const d = Math.hypot(point.x - seat.x, point.y - seat.y);
    if (d < bestDistance) {
      best = id;
      bestDistance = d;
    }
  }
  return best === null ? null : (OJT_AREAS[best]?.vjt ?? null);
}

// An area named less than this many seconds ago is not named again, so walking
// along a border does not repeat the line at every crossing.
export const AREA_REPEAT_SECONDS = 30;

// current: the area she is in; named: when each area was last named.
export type AreaWatch = { current: string | null; named: Record<string, number> };

export function createAreaWatch(): AreaWatch {
  return { current: null, named: {} };
}

// The new area to name when she enters it, else null.
export function watchArea(state: AreaWatch, vjt: string | null, now: number): string | null {
  if (vjt === state.current) {
    return null;
  }
  state.current = vjt;
  if (vjt === null) {
    return null;
  }
  const last = state.named[vjt];
  if (last !== undefined && now - last < AREA_REPEAT_SECONDS) {
    return null;
  }
  state.named[vjt] = now;
  return vjt;
}
