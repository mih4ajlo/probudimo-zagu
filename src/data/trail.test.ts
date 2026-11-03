import { describe, expect, it } from "vitest";
import { MAX_SHOUT_CHARS } from "../talk";
import { wrappedRows } from "../textFit";
import { TALK_ROUNDS } from "./hunt";
import { CHECK_CHOICES, CHECK_CLOSE, CHECK_INTRO, checkedLine, TRAIL_STEPS } from "./trail";

describe("trail data", () => {
  it("has one step per talk round with unique ids", () => {
    expect(TRAIL_STEPS).toHaveLength(TALK_ROUNDS.length);
    expect(new Set(TRAIL_STEPS.map((s) => s.id)).size).toBe(TRAIL_STEPS.length);
  });

  it("has both lawful and unlawful steps, each citing the ZKP", () => {
    expect(TRAIL_STEPS.some((s) => s.lawful)).toBe(true);
    expect(TRAIL_STEPS.some((s) => !s.lawful)).toBe(true);
    for (const s of TRAIL_STEPS) {
      expect(s.cite, s.id).toMatch(/^\(ZKP čl\. \d+/);
    }
  });

  it("keeps every line to two dialog rows", () => {
    const lines = [CHECK_INTRO, CHECK_CLOSE];
    for (const s of TRAIL_STEPS) {
      lines.push(s.order, s.trace, s.recap, s.rule, `Netačno. ${s.cite}`);
    }
    for (const line of lines) {
      expect(wrappedRows(line), line).toBeLessThanOrEqual(2);
    }
  });

  it("offers two choices that fit one choice line", () => {
    expect(CHECK_CHOICES).toEqual(["Po propisu", "Nije po propisu"]);
    for (const c of CHECK_CHOICES) {
      expect(`> ${c}`.length).toBeLessThanOrEqual(MAX_SHOUT_CHARS + 2);
    }
  });

  it("formats the ending line", () => {
    expect(checkedLine(2, 3)).toBe("Tačne procene: 2/3");
  });
});
