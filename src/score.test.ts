import { describe, expect, it } from "vitest";
import { createCases, visitForCases } from "./cases";
import { CASES } from "./data/cases";
import { maxScore } from "./data/offices";
import { createScore, grantCase, visitOffice, wakeMaxScore } from "./score";

describe("visitOffice", () => {
  it("grants the office's level points only on the first visit", () => {
    const state = createScore();
    expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(10);
    expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(0);
    expect(state.total).toBe(10);
    expect(state.visited).toEqual(["ojt-u-novom-sadu"]);
  });

  it("grants more for higher levels", () => {
    const state = createScore();
    expect(visitOffice(state, "vjt-u-novom-sadu").granted).toBe(20);
    expect(visitOffice(state, "ajt-u-novom-sadu").granted).toBe(30);
    expect(visitOffice(state, "vrhovno-javno-tuzilastvo").granted).toBe(50);
    expect(state.total).toBe(100);
  });

  it("grants nothing for an unknown id and does not throw", () => {
    const state = createScore();
    expect(visitOffice(state, "dragon").granted).toBe(0);
    expect(state.total).toBe(0);
    expect(state.visited).toEqual([]);
  });
});

describe("case points", () => {
  it("grants case points only once per case", () => {
    const state = createScore();
    expect(grantCase(state, "x").granted).toBe(50);
    expect(grantCase(state, "x").granted).toBe(0);
    expect(state.total).toBe(50);
    expect(state.cases).toEqual(["x"]);
  });

  it("adds case points to the wake max score", () => {
    expect(wakeMaxScore()).toBe(maxScore() + 50 * CASES.length);
  });

  // Same order as the overworld visit: office points first, then the case file.
  it("grants office points once even on a case office", () => {
    const state = createScore();
    const cases = createCases();
    expect(visitOffice(state, "vjt-u-novom-sadu").granted).toBe(20);
    expect(visitForCases(cases, "vjt-u-novom-sadu").kind).toBe("pickup");
    expect(visitOffice(state, "vjt-u-novom-sadu").granted).toBe(0);
    expect(visitForCases(cases, "vjt-u-novom-sadu").kind).toBe("none");
    expect(state.total).toBe(20);
  });
});
