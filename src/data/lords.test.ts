import { describe, expect, it } from "vitest";
import { LORDS, RANK_POINTS, getLord, lordByMarker, maxScore } from "./lords";

describe("LORDS", () => {
  it("has three unique ranks with matching points", () => {
    expect(LORDS).toHaveLength(3);
    const ids = LORDS.map((lord) => lord.id);
    const ranks = LORDS.map((lord) => lord.rank);
    expect(new Set(ids).size).toBe(3);
    expect(new Set(ranks)).toEqual(new Set([1, 2, 3]));
    for (const lord of LORDS) {
      expect(lord.name.length).toBeGreaterThan(0);
      expect(lord.marker).toHaveLength(1);
      expect(lord.lines.length).toBeGreaterThan(0);
      expect(lord.points).toBe(RANK_POINTS[lord.rank]);
    }
    expect(maxScore()).toBe(60);
  });

  it("looks up by id and by marker", () => {
    const north = getLord("north");
    expect(north.id).toBe("north");
    expect(north.rank).toBe(1);
    expect(lordByMarker(north.marker)?.id).toBe("north");
    expect(lordByMarker("?")).toBeUndefined();
  });
});
