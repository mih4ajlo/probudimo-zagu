import { LORDS } from "./data/lords";

export type ScoreState = {
  total: number;
  visited: string[];
};

export function createScore(): ScoreState {
  return { total: 0, visited: [] };
}

export function visitLord(state: ScoreState, id: string): { granted: number } {
  const lord = LORDS.find((item) => item.id === id);
  if (!lord) {
    return { granted: 0 };
  }
  if (state.visited.includes(id)) {
    return { granted: 0 };
  }
  state.visited.push(id);
  state.total += lord.points;
  return { granted: lord.points };
}
