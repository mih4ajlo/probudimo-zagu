import {
  BUSY_LINE,
  CASES,
  DUST_SECONDS,
  RETURNED_LINE,
  WORKING_LINE,
  type CaseFile,
  type CaseResult,
} from "./data/cases";
import type { HopReason } from "./data/jurisdiction";

export type CaseStatus = "waiting" | "carried" | "working" | "expired";
// hop: index in file.chain of the target office while carried (0 while waiting).
export type CaseEntry = { file: CaseFile; status: CaseStatus; hop: number; dust: number };
export type CasesState = { entries: CaseEntry[]; asking: string | null };

export type CaseVisit =
  | { kind: "none" }
  | { kind: "busy"; line: string }
  | { kind: "pickup" | "bounce"; caseId: string; line: string; next: string; reason: HopReason }
  | { kind: "ask"; caseId: string; ask: string; demands: readonly string[] };

export type CaseAnswer =
  | { kind: "working"; caseId: string; lines: readonly string[] }
  | { kind: "returned"; caseId: string; lines: readonly string[]; next: string };

// folder: dust of the file waiting (or expired) here; target: the carried file goes here.
export type CaseMark = { folder: number | null; target: boolean } | null;

export function createCases(files: readonly CaseFile[] = CASES): CasesState {
  return {
    entries: files.map((file) => ({ file, status: "waiting", hop: 0, dust: file.startDust })),
    asking: null,
  };
}

// Every case is either at work or expired: the Wake round is over.
export function casesResolved(state: CasesState): boolean {
  return state.entries.every((entry) => entry.status === "working" || entry.status === "expired");
}

export function carriedCase(state: CasesState): CaseEntry | null {
  return state.entries.find((entry) => entry.status === "carried") ?? null;
}

function waitingAt(state: CasesState, officeId: string): CaseEntry | undefined {
  return state.entries.find((entry) => entry.status === "waiting" && entry.file.chain[0] === officeId);
}

// Moves the carried file one office on and says the bounce line of the office it leaves.
function bounce(entry: CaseEntry, kind: "pickup" | "bounce"): CaseVisit {
  const line = entry.file.bounces[entry.hop];
  const reason = entry.file.reasons[entry.hop];
  entry.hop += 1;
  return { kind, caseId: entry.file.id, line, next: entry.file.chain[entry.hop], reason };
}

export function visitForCases(state: CasesState, officeId: string): CaseVisit {
  const carried = carriedCase(state);
  if (carried && carried.file.chain[carried.hop] === officeId) {
    if (carried.hop === carried.file.chain.length - 1) {
      state.asking = carried.file.id;
      return { kind: "ask", caseId: carried.file.id, ask: carried.file.ask, demands: carried.file.demands };
    }
    return bounce(carried, "bounce");
  }
  const waiting = waitingAt(state, officeId);
  if (!waiting) {
    return { kind: "none" };
  }
  if (carried) {
    return { kind: "busy", line: BUSY_LINE };
  }
  waiting.status = "carried";
  return bounce(waiting, "pickup");
}

export function answerCase(state: CasesState, index: number): CaseAnswer | null {
  const entry = state.entries.find((e) => e.file.id === state.asking);
  if (!entry || ![0, 1, 2].includes(index)) {
    return null;
  }
  state.asking = null;
  if (index === entry.file.right) {
    entry.status = "working";
    return { kind: "working", caseId: entry.file.id, lines: [WORKING_LINE, entry.file.done] };
  }
  entry.hop -= 1;
  return { kind: "returned", caseId: entry.file.id, lines: [RETURNED_LINE], next: entry.file.chain[entry.hop] };
}

export function tickCases(state: CasesState, dt: number): CaseEntry[] {
  const expired: CaseEntry[] = [];
  for (const entry of state.entries) {
    if (entry.status !== "waiting" && entry.status !== "carried") {
      continue;
    }
    entry.dust += dt / DUST_SECONDS;
    if (entry.dust >= 1) {
      entry.dust = 1;
      entry.status = "expired";
      if (state.asking === entry.file.id) {
        state.asking = null;
      }
      expired.push(entry);
    }
  }
  return expired;
}

export function caseMark(state: CasesState, officeId: string): CaseMark {
  const target = state.entries.some((e) => e.status === "carried" && e.file.chain[e.hop] === officeId);
  const folder = state.entries.find(
    (e) => (e.status === "waiting" || e.status === "expired") && e.file.chain[0] === officeId,
  );
  if (!target && !folder) {
    return null;
  }
  return { folder: folder?.dust ?? null, target };
}

const RESULT: Record<CaseStatus, CaseResult> = {
  working: "working",
  expired: "expired",
  waiting: "untouched",
  carried: "untouched",
};

export function caseReport(
  state: CasesState,
): { title: string; result: CaseResult; reality: readonly string[]; asOf: string }[] {
  return state.entries.map((entry) => ({
    title: entry.file.title,
    result: RESULT[entry.status],
    reality: entry.file.reality,
    asOf: entry.file.asOf,
  }));
}
