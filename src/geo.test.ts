import { describe, expect, it } from "vitest";
import { CITIES, type LonLat } from "./data/cities";
import { SERBIA_RINGS } from "./data/serbia-geo";
import { isInside, isInsideAny, mapBounds, project, projectRing, tryMove, type Point } from "./geo";

const square: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];
const serbia = SERBIA_RINGS.map(projectRing);
const onLand = (lonLat: LonLat) => isInsideAny(project(lonLat), serbia);

describe("isInside", () => {
  it("is true inside a ring and false outside it", () => {
    expect(isInside({ x: 5, y: 5 }, square)).toBe(true);
    expect(isInside({ x: 15, y: 5 }, square)).toBe(false);
    expect(isInside({ x: 5, y: -1 }, square)).toBe(false);
  });
});

describe("project", () => {
  it("puts north up and east to the right", () => {
    expect(project([20, 46]).y).toBeLessThan(project([20, 44]).y);
    expect(project([22, 44]).x).toBeGreaterThan(project([20, 44]).x);
  });

  it("makes Serbia about 1600 units tall inside positive map bounds", () => {
    expect(project([20, 41.85]).y - project([20, 46.19]).y).toBeCloseTo(1606, -1);
    const bounds = mapBounds();
    expect(bounds.w).toBeGreaterThan(0);
    expect(bounds.h).toBeGreaterThan(0);
  });
});

describe("Serbia outline", () => {
  it("contains Beograd, Niš, Subotica and Priština (Kosovo included)", () => {
    expect(onLand([20.4573, 44.8176])).toBe(true);
    expect(onLand([21.8958, 43.3209])).toBe(true);
    expect(onLand([19.6658, 46.1003])).toBe(true);
    expect(onLand([21.1655, 42.6629])).toBe(true);
  });

  it("does not contain Budapest, Sarajevo or Timișoara", () => {
    expect(onLand([19.0402, 47.4979])).toBe(false);
    expect(onLand([18.4131, 43.8563])).toBe(false);
    expect(onLand([21.2087, 45.7489])).toBe(false);
  });

  it("contains every city that has an office", () => {
    for (const [name, lonLat] of Object.entries(CITIES)) {
      expect(onLand(lonLat), name).toBe(true);
    }
  });
});

describe("tryMove", () => {
  const inSquare = (p: Point) => isInside(p, square);

  it("takes the full move when the target is allowed", () => {
    expect(tryMove({ x: 5, y: 5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 6, y: 6 });
  });

  it("slides along the border when a diagonal is blocked", () => {
    expect(tryMove({ x: 9.5, y: 5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 9.5, y: 6 });
    expect(tryMove({ x: 5, y: 9.5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 6, y: 9.5 });
  });

  it("stays put when every option leaves the land", () => {
    expect(tryMove({ x: 9.5, y: 9.5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 9.5, y: 9.5 });
  });
});
