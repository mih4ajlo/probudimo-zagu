import { describe, expect, it } from "vitest";
import { CAUGHT_LINE, FOUND_LINE, MIN_HIDE_DISTANCE } from "./data/hunt";
import type { Point } from "./geo";
import { hintFor } from "./hint";
import { createHunt, huntFlee, huntResult, huntVisit, pickHideout } from "./hunt";
import { officePositions, spawnPoint } from "./officeLayout";

// Offices o0..o(n-1) on a line, 100 units apart, starting at the origin.
function line(n: number): Map<string, Point> {
  return new Map(Array.from({ length: n }, (_, i) => [`o${i}`, { x: i * 100, y: 0 }] as const));
}
const start: Point = { x: 0, y: 0 };
const first = () => 0;
const last = () => 0.999;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

describe("pickHideout", () => {
  it("picks only offices far enough away", () => {
    expect(pickHideout(line(10), start, null, first)).toBe("o3");
    expect(pickHideout(line(10), start, null, last)).toBe("o9");
  });

  it("never picks the excluded office", () => {
    const positions = new Map([["a", start], ["b", { x: 500, y: 0 }]]);
    expect(pickHideout(positions, { x: 500, y: 0 }, "a", first)).toBe("b");
  });

  it("falls back to any other office when none is far enough", () => {
    const positions = new Map([["a", start], ["b", { x: 10, y: 0 }]]);
    expect(pickHideout(positions, start, "a", first)).toBe("b");
  });
});

describe("createHunt", () => {
  it("starts with no visits and no finds", () => {
    const hunt = createHunt(line(10), start, first);
    expect(hunt).toMatchObject({ hidden: "o3", visits: 0, searched: [], finds: 0 });
  });

  it("hides her far from Beograd on the real map", () => {
    const positions = officePositions();
    for (let i = 0; i < 50; i++) {
      const hunt = createHunt(positions, spawnPoint(), Math.random);
      expect(distance(positions.get(hunt.hidden) as Point, spawnPoint())).toBeGreaterThanOrEqual(MIN_HIDE_DISTANCE);
    }
  });
});

describe("huntVisit", () => {
  it("gives a hint at an empty office and marks it searched once", () => {
    const hunt = createHunt(line(10), start, first);
    expect(huntVisit(hunt, "o0")).toEqual({ found: false, lines: [hintFor({ x: 0, y: 0 }, { x: 300, y: 0 })] });
    huntVisit(hunt, "o0");
    expect(hunt.visits).toBe(2);
    expect(hunt.searched).toEqual(["o0"]);
  });

  it("finds her at her office and clears the ? marks", () => {
    const hunt = createHunt(line(10), start, first);
    huntVisit(hunt, "o0");
    expect(huntVisit(hunt, "o3")).toEqual({ found: true, lines: [FOUND_LINE] });
    expect(hunt.finds).toBe(1);
    expect(hunt.searched).toEqual([]);
  });

  it("says she is caught again on later finds", () => {
    const hunt = createHunt(line(10), start, first);
    huntVisit(hunt, "o3");
    const { to } = huntFlee(hunt);
    expect(to).toEqual({ x: 0, y: 0 });
    expect(huntVisit(hunt, hunt.hidden)).toEqual({ found: true, lines: [CAUGHT_LINE] });
    expect(hunt.finds).toBe(2);
  });

  it("ignores unknown offices", () => {
    const hunt = createHunt(line(10), start, first);
    expect(huntVisit(hunt, "nowhere")).toBeNull();
    expect(hunt.visits).toBe(0);
  });
});

describe("huntFlee", () => {
  it("sends her far away to another office", () => {
    const positions = line(10);
    const hunt = createHunt(positions, start, last);
    const from = hunt.hidden;
    const walk = huntFlee(hunt);
    expect(hunt.hidden).not.toBe(from);
    expect(walk.from).toEqual(positions.get(from));
    expect(walk.to).toEqual(positions.get(hunt.hidden));
    expect(distance(walk.from, walk.to)).toBeGreaterThanOrEqual(MIN_HIDE_DISTANCE);
  });
});

describe("huntResult", () => {
  it("reports the visits it took", () => {
    const hunt = createHunt(line(10), start, first);
    huntVisit(hunt, "o0");
    huntVisit(hunt, "o1");
    huntVisit(hunt, "o3");
    expect(huntResult(hunt)).toEqual({ visits: 3 });
  });
});
