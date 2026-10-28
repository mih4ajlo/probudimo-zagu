import { describe, expect, it } from "vitest";
import { FLEE_LINE, MAX_FOLLOWERS, MIN_HIDE_DISTANCE, MUMBLES, START_FOLLOWERS } from "./data/hunt";
import type { Point } from "./geo";
import { hintFor } from "./hint";
import {
  createHunt,
  crowdSize,
  huntResult,
  huntVisit,
  isAwake,
  mumbleFor,
  pickHideout,
  wakeGain,
} from "./hunt";
import { officePositions, spawnPoint } from "./officeLayout";

// Offices o0..o(n-1) on a line, 100 units apart, starting at the origin.
function line(n: number): Map<string, Point> {
  return new Map(Array.from({ length: n }, (_, i) => [`o${i}`, { x: i * 100, y: 0 }] as const));
}
const start: Point = { x: 0, y: 0 };
const first = () => 0;
const last = () => 0.999;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

describe("wakeGain", () => {
  it("is 12 plus 2 per follower", () => {
    expect(wakeGain(3)).toBe(18);
    expect(wakeGain(12)).toBe(36);
  });
});

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
  it("starts asleep with the starting crowd", () => {
    const hunt = createHunt(line(10), start, first);
    expect(hunt.hidden).toBe("o3");
    expect(hunt.wake).toBe(0);
    expect(hunt.followers).toBe(START_FOLLOWERS);
    expect(crowdSize(hunt)).toBe(START_FOLLOWERS + 1);
    expect(hunt.visits).toBe(0);
    expect(hunt.searched).toEqual([]);
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
  it("gives a hint at an empty office and marks it searched", () => {
    const positions = line(10);
    const hunt = createHunt(positions, start, first);
    const visit = huntVisit(hunt, "o0");
    expect(visit).toEqual({ found: false, lines: [hintFor({ x: 0, y: 0 }, { x: 300, y: 0 })] });
    expect(hunt.visits).toBe(1);
    expect(hunt.searched).toEqual(["o0"]);
  });

  it("grows the crowd on first visits only", () => {
    const hunt = createHunt(line(10), start, first);
    huntVisit(hunt, "o0");
    huntVisit(hunt, "o0");
    expect(hunt.followers).toBe(START_FOLLOWERS + 1);
    expect(hunt.visits).toBe(2);
    expect(hunt.searched).toEqual(["o0"]);
  });

  it("stops growing the crowd at the cap", () => {
    const hunt = createHunt(line(15), start, first);
    for (let i = 0; i < 15; i++) {
      if (`o${i}` !== hunt.hidden) {
        huntVisit(hunt, `o${i}`);
      }
    }
    expect(hunt.followers).toBe(MAX_FOLLOWERS);
  });

  it("wakes her a little at her office, then she flees far away", () => {
    const positions = line(10);
    const hunt = createHunt(positions, start, first);
    huntVisit(hunt, "o1");
    const visit = huntVisit(hunt, "o3");
    // o1 and o3 are both first visits: 3 + 2 followers.
    expect(hunt.wake).toBe(wakeGain(5));
    expect(visit).toEqual({ found: true, lines: [mumbleFor(wakeGain(5)), FLEE_LINE] });
    expect(hunt.hidden).not.toBe("o3");
    expect(distance(positions.get(hunt.hidden) as Point, positions.get("o3") as Point)).toBeGreaterThanOrEqual(
      MIN_HIDE_DISTANCE,
    );
    expect(hunt.searched).toEqual([]);
  });

  it("caps the meter at 100 and stops fleeing once awake", () => {
    const hunt = createHunt(line(10), start, first);
    hunt.wake = 95;
    const visit = huntVisit(hunt, "o3");
    expect(hunt.wake).toBe(100);
    expect(isAwake(hunt)).toBe(true);
    expect(visit).toEqual({ found: true, lines: [mumbleFor(100)] });
    expect(hunt.hidden).toBe("o3");
  });

  it("ignores visits once awake", () => {
    const hunt = createHunt(line(10), start, first);
    hunt.wake = 100;
    expect(huntVisit(hunt, "o0")).toBeNull();
    expect(hunt.visits).toBe(0);
  });

  it("ignores unknown offices", () => {
    const hunt = createHunt(line(10), start, first);
    expect(huntVisit(hunt, "nowhere")).toBeNull();
    expect(hunt.visits).toBe(0);
  });
});

describe("mumbleFor", () => {
  it("picks the first line whose threshold covers the meter", () => {
    expect(mumbleFor(18)).toBe(MUMBLES[0].line);
    expect(mumbleFor(30)).toBe(MUMBLES[0].line);
    expect(mumbleFor(31)).toBe(MUMBLES[1].line);
    expect(mumbleFor(99)).toBe(MUMBLES[2].line);
    expect(mumbleFor(100)).toBe(MUMBLES[3].line);
  });
});

describe("huntResult", () => {
  it("plays a whole hunt to the ending result", () => {
    const positions = line(10);
    const hunt = createHunt(positions, start, first);
    let finds = 0;
    while (!isAwake(hunt)) {
      expect(huntVisit(hunt, hunt.hidden)?.found).toBe(true);
      finds += 1;
    }
    expect(finds).toBeGreaterThanOrEqual(3);
    expect(huntVisit(hunt, hunt.hidden)).toBeNull();
    expect(huntResult(hunt)).toEqual({ visits: finds, crowd: crowdSize(hunt) });
  });
});
