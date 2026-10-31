import { CASE_POINTS, CASES } from "./data/cases";
import { getOffice, maxScore } from "./data/offices";

export type ScoreState = {
  total: number;
  visited: string[];
  cases: string[];
};

export function createScore(): ScoreState {
  return { total: 0, visited: [], cases: [] };
}

export function visitOffice(state: ScoreState, id: string): { granted: number } {
  const office = getOffice(id);
  if (!office || state.visited.includes(id)) {
    return { granted: 0 };
  }
  state.visited.push(id);
  state.total += office.points;
  return { granted: office.points };
}

// A case put to work: its points, once.
export function grantCase(state: ScoreState, caseId: string): { granted: number } {
  if (state.cases.includes(caseId)) {
    return { granted: 0 };
  }
  state.cases.push(caseId);
  state.total += CASE_POINTS;
  return { granted: CASE_POINTS };
}

// Wake the offices: every office plus every case.
export function wakeMaxScore(): number {
  return maxScore() + CASE_POINTS * CASES.length;
}
