import { describe, expect, it } from "vitest";
import { wrappedRows } from "../textFit";
import { FACTS, SPLASH } from "./facts";
import { VJT_AJT } from "./jurisdiction";

describe("facts", () => {
  it("has 10 to 20 facts with unique ids", () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(10);
    expect(FACTS.length).toBeLessThanOrEqual(20);
    expect(new Set(FACTS.map((f) => f.id)).size).toBe(FACTS.length);
  });

  it("keeps every fact to two rows", () => {
    for (const fact of FACTS) {
      expect(wrappedRows(fact.text), fact.text).toBeLessThanOrEqual(2);
    }
  });

  it("keeps every splash to five rows", () => {
    expect(Object.keys(SPLASH).sort()).toEqual(["area", "level", "tok"]);
    for (const text of Object.values(SPLASH)) {
      expect(wrappedRows(text), text).toBeLessThanOrEqual(5);
    }
  });

  it("points vjt facts at real VJT", () => {
    for (const fact of FACTS.filter((f) => f.vjt !== undefined)) {
      expect(VJT_AJT[fact.vjt!], fact.id).toBeDefined();
    }
  });
});
