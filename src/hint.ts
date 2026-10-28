import { HINT_NEAR, hintFar, hintMid, MID_DISTANCE, NEAR_DISTANCE } from "./data/hunt";
import type { Point } from "./geo";

export type Compass =
  | "east"
  | "north-east"
  | "north"
  | "north-west"
  | "west"
  | "south-west"
  | "south"
  | "south-east";

// Counter-clockwise from east, 45 degrees apart.
const COMPASS: readonly Compass[] = [
  "east",
  "north-east",
  "north",
  "north-west",
  "west",
  "south-west",
  "south",
  "south-east",
];

export function compassDirection(from: Point, to: Point): Compass {
  // Game y grows south, so north is -y.
  const angle = Math.atan2(from.y - to.y, to.x - from.x);
  const sector = Math.round(angle / (Math.PI / 4));
  return COMPASS[(sector + 8) % 8];
}

export type DistanceBand = "near" | "mid" | "far";

export function distanceBand(distance: number): DistanceBand {
  if (distance < NEAR_DISTANCE) {
    return "near";
  }
  return distance < MID_DISTANCE ? "mid" : "far";
}

// What an empty office says about where she sleeps.
export function hintFor(from: Point, to: Point): string {
  const band = distanceBand(Math.hypot(to.x - from.x, to.y - from.y));
  if (band === "near") {
    return HINT_NEAR;
  }
  const direction = compassDirection(from, to);
  return band === "mid" ? hintMid(direction) : hintFar(direction);
}
