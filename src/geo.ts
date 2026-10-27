import type { LonLat } from "./data/cities";
import { VIEW_BOX } from "./data/serbia-geo";

export type Point = { x: number; y: number };
export type Bounds = { x: number; y: number; w: number; h: number };

// Game units per degree of latitude: Serbia (~4.34° tall) is ~1600 units.
export const UNITS_PER_DEGREE = 370;
// Equirectangular around Serbia's middle latitude keeps shapes undistorted.
const LON_SCALE = Math.cos((44 * Math.PI) / 180);

export function project([lon, lat]: LonLat): Point {
  return {
    x: (lon - VIEW_BOX.lonMin) * UNITS_PER_DEGREE * LON_SCALE,
    y: (VIEW_BOX.latMax - lat) * UNITS_PER_DEGREE,
  };
}

export function projectRing(ring: readonly LonLat[]): Point[] {
  return ring.map(project);
}

export function mapBounds(): Bounds {
  const topLeft = project([VIEW_BOX.lonMin, VIEW_BOX.latMax]);
  const bottomRight = project([VIEW_BOX.lonMax, VIEW_BOX.latMin]);
  return { x: topLeft.x, y: topLeft.y, w: bottomRight.x - topLeft.x, h: bottomRight.y - topLeft.y };
}

// Ray casting: count edge crossings of a ray going right from p.
export function isInside(p: Point, ring: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function isInsideAny(p: Point, rings: readonly (readonly Point[])[]): boolean {
  return rings.some((ring) => isInside(p, ring));
}

// Full move if allowed; otherwise slide along x or y; otherwise stay.
export function tryMove(from: Point, delta: Point, canStand: (p: Point) => boolean): Point {
  const options = [
    { x: from.x + delta.x, y: from.y + delta.y },
    { x: from.x + delta.x, y: from.y },
    { x: from.x, y: from.y + delta.y },
  ];
  for (const option of options) {
    const moves = option.x !== from.x || option.y !== from.y;
    if (moves && canStand(option)) {
      return option;
    }
  }
  return from;
}
