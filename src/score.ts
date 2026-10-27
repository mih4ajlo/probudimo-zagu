import { getOffice } from "./data/offices";

export type ScoreState = {
  total: number;
  visited: string[];
};

export function createScore(): ScoreState {
  return { total: 0, visited: [] };
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
