import { describe, expect, it } from "vitest";
import type { Fact } from "./data/facts";
import { createFacts, factFor, nextFact } from "./facts";

const FIXTURE: readonly Fact[] = [
  { id: "a", text: "a", topic: "level", levels: ["OJT"] },
  { id: "b", text: "b", topic: "area", vjt: "vjt-u-sapcu" },
  { id: "c", text: "c", topic: "special" },
  { id: "d", text: "d", topic: "oversight", levels: ["AJT"] },
];
// Always picks the last candidate, so shuffles keep the order.
const fixedRng = () => 0.999;

describe("facts rotation", () => {
  it("shows every fact once before repeating", () => {
    const state = createFacts(FIXTURE, fixedRng);
    const ids = FIXTURE.map(() => nextFact(state, FIXTURE).id);
    expect(new Set(ids).size).toBe(FIXTURE.length);
  });

  it("never repeats the last fact across a reshuffle", () => {
    for (const r of [0, 0.3, 0.6, 0.999]) {
      const state = createFacts(FIXTURE, () => r);
      let last = "";
      for (let i = 0; i < 3 * FIXTURE.length; i++) {
        const id = nextFact(state, FIXTURE).id;
        expect(id, `rng ${r} call ${i}`).not.toBe(last);
        last = id;
      }
    }
  });

  it("prefers an unseen fact that matches the target", () => {
    const state = createFacts(FIXTURE, fixedRng);
    expect(factFor(state, { level: "AJT", vjt: null }, FIXTURE).id).toBe("d");
    expect(factFor(state, { level: "OJT", vjt: "vjt-u-sapcu" }, FIXTURE).id).toMatch(/^[ab]$/);
    const seen = new Set(["d"]);
    seen.add(factFor(state, { level: "OJT", vjt: "vjt-u-sapcu" }, FIXTURE).id);
    expect(seen.size).toBe(2);
  });

  it("falls back to rotation when nothing matches", () => {
    const state = createFacts(FIXTURE, fixedRng);
    const ids = FIXTURE.map(() => factFor(state, { level: "PJT", vjt: null }, FIXTURE).id);
    expect(new Set(ids).size).toBe(FIXTURE.length);
  });
});
