import { describe, expect, it } from "vitest";
import { HINT_NEAR, hintFar, hintMid } from "./data/hunt";
import type { Point } from "./geo";
import { compassDirection, distanceBand, hintFor } from "./hint";

const origin: Point = { x: 0, y: 0 };
const degrees = (deg: number, length = 10): Point => ({
  x: length * Math.cos((deg * Math.PI) / 180),
  // Game y grows south.
  y: -length * Math.sin((deg * Math.PI) / 180),
});

describe("compassDirection", () => {
  it.each([
    [{ x: 0, y: -10 }, "north"],
    [{ x: 10, y: -10 }, "north-east"],
    [{ x: 10, y: 0 }, "east"],
    [{ x: 10, y: 10 }, "south-east"],
    [{ x: 0, y: 10 }, "south"],
    [{ x: -10, y: 10 }, "south-west"],
    [{ x: -10, y: 0 }, "west"],
    [{ x: -10, y: -10 }, "north-west"],
  ] as const)("points to %o as %s", (to, direction) => {
    expect(compassDirection(origin, to)).toBe(direction);
  });

  it("splits sectors halfway between directions", () => {
    expect(compassDirection(origin, degrees(20))).toBe("east");
    expect(compassDirection(origin, degrees(25))).toBe("north-east");
    expect(compassDirection(origin, degrees(-160))).toBe("west");
  });

  it("measures from the first point", () => {
    expect(compassDirection({ x: 100, y: 100 }, { x: 100, y: 50 })).toBe("north");
  });
});

describe("distanceBand", () => {
  it("splits at 150 and 450", () => {
    expect(distanceBand(0)).toBe("near");
    expect(distanceBand(149)).toBe("near");
    expect(distanceBand(150)).toBe("mid");
    expect(distanceBand(449)).toBe("mid");
    expect(distanceBand(450)).toBe("far");
  });
});

describe("hintFor", () => {
  it("gives no direction when near", () => {
    expect(hintFor(origin, { x: 100, y: 0 })).toBe(HINT_NEAR);
  });

  it("names the direction when not far", () => {
    expect(hintFor(origin, { x: 300, y: 0 })).toBe(hintMid("east"));
  });

  it("names the direction when far", () => {
    expect(hintFor(origin, { x: 0, y: 800 })).toBe(hintFar("south"));
  });
});
