import { describe, expect, it } from "vitest";
import { MAX_SHOUT_CHARS } from "../talk";
import {
  BUSY_LINE,
  CASES,
  carryHud,
  expiredLine,
  nextPage,
  OFFICE_LABEL,
  reportPage,
  RETURNED_LINE,
} from "./cases";
import { OFFICE_IDS } from "./offices";

// One 284-unit dialog row at 8 units per letter.
const ROW_CHARS = 35;

// Rows the dialog text takes when it wraps at word boundaries.
function wrappedRows(text: string, width = ROW_CHARS): number {
  let rows = 1;
  let used = 0;
  for (const word of text.split(" ")) {
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need <= width) {
      used = need;
    } else {
      rows += 1;
      used = word.length;
    }
  }
  return rows;
}
// The 320-unit HUD strip minus its 8-unit margins, at 8 units per letter.
const HUD_CHARS = 38;

describe("case files", () => {
  it("has between 4 and 6 cases with unique ids", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(4);
    expect(CASES.length).toBeLessThanOrEqual(6);
    expect(new Set(CASES.map((c) => c.id)).size).toBe(CASES.length);
  });

  it("uses real office ids, at least 2 per chain", () => {
    for (const c of CASES) {
      expect(c.chain.length, c.id).toBeGreaterThanOrEqual(2);
      for (const id of c.chain) {
        expect(OFFICE_IDS, `${c.id}: ${id}`).toContain(id);
      }
    }
  });

  it("has one bounce line per hop", () => {
    for (const c of CASES) {
      expect(c.bounces.length, c.id).toBe(c.chain.length - 1);
    }
  });

  it("offers 3 demands that fit one choice line", () => {
    for (const c of CASES) {
      expect(c.demands).toHaveLength(3);
      expect([0, 1, 2]).toContain(c.right);
      for (const d of c.demands) {
        expect(`> ${d}`.length, d).toBeLessThanOrEqual(MAX_SHOUT_CHARS + 2);
      }
    }
  });

  it("keeps other lines to two dialog lines", () => {
    const lines = [BUSY_LINE, RETURNED_LINE];
    for (const c of CASES) {
      lines.push(...c.bounces, c.ask, c.done, expiredLine(c.title));
    }
    for (const line of lines) {
      expect(wrappedRows(line), line).toBeLessThanOrEqual(2);
    }
  });

  it("counts wrapped rows at word boundaries", () => {
    expect(wrappedRows("aaa bbb", 7)).toBe(1);
    expect(wrappedRows("aaa bbb ccc", 7)).toBe(2);
    expect(wrappedRows("aaaa bbbb", 7)).toBe(2);
  });

  it("starts every case at a different office", () => {
    expect(new Set(CASES.map((c) => c.chain[0])).size).toBe(CASES.length);
  });

  it("has a dated reality line for every case", () => {
    for (const c of CASES) {
      expect(c.reality.length, c.id).toBeGreaterThanOrEqual(1);
      for (const line of c.reality) {
        expect(line.trim(), c.id).not.toBe("");
      }
      expect(c.asOf.trim(), c.id).not.toBe("");
    }
  });

  it("starts dust between 0 and 1", () => {
    for (const c of CASES) {
      expect(c.startDust, c.id).toBeGreaterThanOrEqual(0);
      expect(c.startDust, c.id).toBeLessThan(1);
    }
  });

  it("labels every chain office for the HUD and fits one line", () => {
    for (const c of CASES) {
      for (const id of c.chain) {
        expect(OFFICE_LABEL[id], id).toBeDefined();
        expect(carryHud(c.title, id).length, carryHud(c.title, id)).toBeLessThanOrEqual(HUD_CHARS);
      }
    }
  });

  it("formats a report page with result and date", () => {
    expect(reportPage("X", "expired", ["a", "b"], "okt. 2026")).toBe(
      "X\nZASTARELO\n\nU stvarnosti:\na b\n(stanje: okt. 2026)",
    );
  });

  it("says how to turn the page for keys and touch", () => {
    expect(nextPage(false)).toBe("Enter dalje");
    expect(nextPage(true)).toBe("Dodirni dalje");
  });
});
