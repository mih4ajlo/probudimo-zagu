import { describe, expect, it } from "vitest";
import { phasesToEnter, wakePhase } from "./deskWake";

describe("wakePhase", () => {
  it("runs asleep, burst, awake, text at 1.6 s, 2.0 s, 3.0 s", () => {
    expect(wakePhase(0)).toBe("asleep");
    expect(wakePhase(1.59)).toBe("asleep");
    expect(wakePhase(1.6)).toBe("burst");
    expect(wakePhase(1.99)).toBe("burst");
    expect(wakePhase(2)).toBe("awake");
    expect(wakePhase(2.99)).toBe("awake");
    expect(wakePhase(3)).toBe("text");
    expect(wakePhase(60)).toBe("text");
  });
});

describe("phasesToEnter", () => {
  it("enters each new phase once", () => {
    expect(phasesToEnter(0, 1)).toEqual([]);
    expect(phasesToEnter(0, 1.7)).toEqual(["burst"]);
    expect(phasesToEnter(1, 1.7)).toEqual([]);
  });

  it("enters skipped phases in order", () => {
    expect(phasesToEnter(0, 10)).toEqual(["burst", "awake", "text"]);
    expect(phasesToEnter(2, 10)).toEqual(["text"]);
  });
});
