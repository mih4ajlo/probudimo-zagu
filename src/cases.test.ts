import { describe, expect, it } from "vitest";
import {
  answerCase,
  carriedCase,
  caseMark,
  caseReport,
  createCases,
  tickCases,
  visitForCases,
  type CasesState,
} from "./cases";
import { BUSY_LINE, CASES, DUST_SECONDS, RETURNED_LINE, WORKING_LINE, type CaseFile } from "./data/cases";

// The module never checks office ids, so fake ones keep the chains readable.
function file(id: string, chain: string[], startDust = 0): CaseFile {
  return {
    id,
    title: id.toUpperCase(),
    chain,
    bounces: chain.slice(0, -1).map((office, i) => `${office} -> ${chain[i + 1]}`),
    ask: `${id} ask`,
    demands: ["wrong", "right", "also wrong"],
    right: 1,
    done: `${id} done`,
    reality: [`${id} fact`],
    asOf: "okt. 2026",
    startDust,
  };
}

const LONG = file("long", ["a", "b", "c"], 0.5);
const OTHER = file("other", ["x", "c"]);

function fixture(): CasesState {
  return createCases([LONG, OTHER]);
}

function entry(state: CasesState, id: string) {
  return state.entries.find((e) => e.file.id === id)!;
}

describe("case files", () => {
  it("starts every case waiting at its start office with its start dust", () => {
    const state = fixture();
    expect(state.entries.map((e) => [e.status, e.hop, e.dust])).toEqual([
      ["waiting", 0, 0.5],
      ["waiting", 0, 0],
    ]);
    expect(state.asking).toBeNull();
    expect(carriedCase(state)).toBeNull();
  });

  it("picks up a file only at its start office", () => {
    const state = fixture();
    expect(visitForCases(state, "b")).toEqual({ kind: "none" });
    expect(visitForCases(state, "a")).toEqual({ kind: "pickup", caseId: "long", line: "a -> b", next: "b" });
    expect(carriedCase(state)?.file.id).toBe("long");
    expect(entry(state, "long").hop).toBe(1);
  });

  it("carries one file at a time", () => {
    const state = fixture();
    visitForCases(state, "a");
    expect(visitForCases(state, "x")).toEqual({ kind: "busy", line: BUSY_LINE });
    expect(entry(state, "other").status).toBe("waiting");
  });

  it("bounces along the chain in order", () => {
    const state = fixture();
    visitForCases(state, "a");
    expect(visitForCases(state, "b")).toEqual({ kind: "bounce", caseId: "long", line: "b -> c", next: "c" });
    expect(visitForCases(state, "c")).toEqual({
      kind: "ask",
      caseId: "long",
      ask: "long ask",
      demands: ["wrong", "right", "also wrong"],
    });
    expect(state.asking).toBe("long");
  });

  it("ignores offices off the chain while carrying", () => {
    const state = fixture();
    visitForCases(state, "a");
    expect(visitForCases(state, "c")).toEqual({ kind: "none" });
    expect(visitForCases(state, "zzz")).toEqual({ kind: "none" });
    expect(entry(state, "long").hop).toBe(1);
  });

  it("puts the case to work on the right demand", () => {
    const state = fixture();
    visitForCases(state, "a");
    visitForCases(state, "b");
    visitForCases(state, "c");
    expect(answerCase(state, 1)).toEqual({ kind: "working", caseId: "long", lines: [WORKING_LINE, "long done"] });
    expect(entry(state, "long").status).toBe("working");
    expect(carriedCase(state)).toBeNull();
    expect(state.asking).toBeNull();
  });

  it("sends the file back one hop on a wrong demand", () => {
    const state = fixture();
    visitForCases(state, "a");
    visitForCases(state, "b");
    visitForCases(state, "c");
    expect(answerCase(state, 0)).toEqual({ kind: "returned", caseId: "long", lines: [RETURNED_LINE], next: "b" });
    expect(state.asking).toBeNull();
    expect(carriedCase(state)?.file.id).toBe("long");
    expect(visitForCases(state, "b").kind).toBe("bounce");
    expect(visitForCases(state, "c").kind).toBe("ask");
  });

  it("bounces from the start office after a wrong demand on a 2-office chain", () => {
    const state = fixture();
    visitForCases(state, "x");
    visitForCases(state, "c");
    expect(answerCase(state, 2)).toMatchObject({ kind: "returned", next: "x" });
    expect(visitForCases(state, "x")).toEqual({ kind: "bounce", caseId: "other", line: "x -> c", next: "c" });
    expect(visitForCases(state, "c").kind).toBe("ask");
  });

  it("ignores answers when nothing is asked", () => {
    const state = fixture();
    expect(answerCase(state, 1)).toBeNull();
    visitForCases(state, "x");
    visitForCases(state, "c");
    expect(answerCase(state, 3)).toBeNull();
    expect(state.asking).toBe("other");
  });

  it("adds dust over time and expires at 1", () => {
    const state = fixture();
    expect(tickCases(state, DUST_SECONDS / 4)).toEqual([]);
    expect(entry(state, "long").dust).toBeCloseTo(0.75);
    const expired = tickCases(state, DUST_SECONDS / 4);
    expect(expired.map((e) => e.file.id)).toEqual(["long"]);
    expect(entry(state, "long")).toMatchObject({ status: "expired", dust: 1 });
    expect(entry(state, "other").dust).toBeCloseTo(0.5);
  });

  it("adds no dust when dt is 0 or the case is working", () => {
    const state = fixture();
    tickCases(state, 0);
    expect(entry(state, "long").dust).toBe(0.5);
    visitForCases(state, "x");
    visitForCases(state, "c");
    answerCase(state, 1);
    const before = entry(state, "other").dust;
    tickCases(state, 60);
    expect(entry(state, "other").dust).toBe(before);
  });

  it("drops an expired carried file so another can be picked up", () => {
    const state = fixture();
    visitForCases(state, "a");
    visitForCases(state, "b");
    visitForCases(state, "c");
    tickCases(state, DUST_SECONDS / 2);
    expect(entry(state, "long").status).toBe("expired");
    expect(state.asking).toBeNull();
    expect(carriedCase(state)).toBeNull();
    expect(answerCase(state, 1)).toBeNull();
    expect(visitForCases(state, "x").kind).toBe("pickup");
  });

  it("marks folders, the target and expired files", () => {
    const state = fixture();
    expect(caseMark(state, "a")).toEqual({ folder: 0.5, target: false });
    expect(caseMark(state, "b")).toBeNull();
    visitForCases(state, "a");
    expect(caseMark(state, "a")).toBeNull();
    expect(caseMark(state, "b")).toEqual({ folder: null, target: true });
    tickCases(state, DUST_SECONDS);
    expect(caseMark(state, "a")).toEqual({ folder: 1, target: false });
    expect(caseMark(state, "b")).toBeNull();
  });

  it("shows a waiting folder and the target ring on the same office", () => {
    const state = createCases([LONG, file("third", ["b", "z"], 0.2)]);
    visitForCases(state, "a");
    expect(caseMark(state, "b")).toEqual({ folder: 0.2, target: true });
  });

  it("reports every case with its result", () => {
    const state = createCases([LONG, OTHER, file("third", ["q", "r"])]);
    visitForCases(state, "x");
    visitForCases(state, "c");
    answerCase(state, 1);
    tickCases(state, DUST_SECONDS / 2);
    expect(caseReport(state)).toEqual([
      { title: "LONG", result: "expired", reality: ["long fact"], asOf: "okt. 2026" },
      { title: "OTHER", result: "working", reality: ["other fact"], asOf: "okt. 2026" },
      { title: "THIRD", result: "untouched", reality: ["third fact"], asOf: "okt. 2026" },
    ]);
  });

  it("uses the real cases by default", () => {
    expect(createCases().entries.map((e) => e.file.id)).toEqual(CASES.map((c) => c.id));
  });
});
