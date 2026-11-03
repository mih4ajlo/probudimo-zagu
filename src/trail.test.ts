import { describe, expect, it } from "vitest";
import type { TrailStep } from "./data/trail";
import { checkAnswer, checkDone, checkRecap, checkScore, createFileTrail, trailPage } from "./trail";

const steps: TrailStep[] = [
  { id: "a", order: "o-a", trace: "t-a", recap: "r-a", lawful: false, cite: "c-a", rule: "u-a" },
  { id: "b", order: "o-b", trace: "t-b", recap: "r-b", lawful: true, cite: "c-b", rule: "u-b" },
];

describe("file trail", () => {
  it("gives the next page on each find, then nothing", () => {
    const trail = createFileTrail(steps);
    expect(trailPage(trail)).toEqual(["List spisa 1/2.", "o-a", "t-a"]);
    expect(trailPage(trail)).toEqual(["List spisa 2/2.", "o-b", "t-b"]);
    expect(trailPage(trail)).toBeNull();
  });

  it("checks the steps in order and answers with the rule", () => {
    const trail = createFileTrail(steps);
    expect(checkRecap(trail)).toBe("r-a");
    expect(checkAnswer(trail, false)).toEqual(["Tačno. c-a", "u-a"]);
    expect(checkRecap(trail)).toBe("r-b");
    expect(checkAnswer(trail, false)).toEqual(["Netačno. c-b", "u-b"]);
  });

  it("counts right calls and is done after the last step", () => {
    const trail = createFileTrail(steps);
    checkAnswer(trail, false);
    expect(checkDone(trail)).toBe(false);
    checkAnswer(trail, true);
    expect(checkDone(trail)).toBe(true);
    expect(checkScore(trail)).toBe(2);
    expect(checkRecap(trail)).toBeNull();
    expect(checkAnswer(trail, true)).toBeNull();
    expect(checkScore(trail)).toBe(2);
  });
});
