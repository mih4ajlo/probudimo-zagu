import { CITIES } from "./data/cities";
import { OFFICES } from "./data/offices";
import { project, type Point } from "./geo";

// Office marker size and spacing, in game units.
export const MARKER_SIZE = 10;
export const MARKER_GAP = 2;
// Feet within this distance of a marker count as touching it.
export const TOUCH_RADIUS = 9;
// Space between neighbouring offices' touch zones, so she can walk between them.
export const WALK_GAP = 6;
export const MAX_RING_RADIUS = 40;
export const START_CITY = "Beograd";
// She wakes a little south of Beograd's offices, on land.
const SPAWN_OFFSET: Point = { x: 0, y: 45 };

// Big enough that neighbours on the ring (one chord apart) keep a walkable gap,
// but never wider than MAX_RING_RADIUS so offices stay by their city.
export function ringRadius(count: number): number {
  if (count <= 1) {
    return 0;
  }
  const spacing = Math.max(MARKER_SIZE + MARKER_GAP, 2 * TOUCH_RADIUS + WALK_GAP);
  return Math.min(MAX_RING_RADIUS, Math.max(14, spacing / (2 * Math.sin(Math.PI / count))));
}

// Offices of one city sit evenly on a ring around the city point, first at the top.
export function layoutOffices(
  offices: readonly { id: string; city: string }[],
  cityPoint: (city: string) => Point,
): Map<string, Point> {
  const byCity = new Map<string, string[]>();
  for (const office of offices) {
    byCity.set(office.city, [...(byCity.get(office.city) ?? []), office.id]);
  }
  const positions = new Map<string, Point>();
  for (const [city, ids] of byCity) {
    const center = cityPoint(city);
    const radius = ringRadius(ids.length);
    ids.forEach((id, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / ids.length;
      positions.set(id, { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
    });
  }
  return positions;
}

// Where every office sits on the map.
export function officePositions(): Map<string, Point> {
  return layoutOffices(OFFICES, (city) => project(CITIES[city]));
}

export function touchedOffice(feet: Point, positions: ReadonlyMap<string, Point>): string | null {
  let best: string | null = null;
  let bestDistance = TOUCH_RADIUS;
  for (const [id, p] of positions) {
    const d = Math.hypot(feet.x - p.x, feet.y - p.y);
    if (d < bestDistance) {
      best = id;
      bestDistance = d;
    }
  }
  return best;
}

// A visit starts when the feet reach an office they were not already on.
export function visitToStart(touched: string | null, lastTouched: string | null, blocked: boolean): string | null {
  if (blocked || touched === null || touched === lastTouched) {
    return null;
  }
  return touched;
}

export function spawnPoint(): Point {
  const city = project(CITIES[START_CITY]);
  return { x: city.x + SPAWN_OFFSET.x, y: city.y + SPAWN_OFFSET.y };
}
