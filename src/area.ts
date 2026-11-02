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

export type AreaWatch = { current: string | null };

// The new area when it differs from the last one seen, else null.
export function watchArea(state: AreaWatch, vjt: string | null): string | null {
  if (vjt === state.current) {
    return null;
  }
  state.current = vjt;
  return vjt;
}
