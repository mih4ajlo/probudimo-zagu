import { CAUGHT_LINE, FOUND_LINE, MIN_HIDE_DISTANCE } from "./data/hunt";
import type { Point } from "./geo";
import { hintFor } from "./hint";
import type { HuntResult } from "./session";

// Random number in [0, 1); scenes pass Math.random, tests a fixed value.
export type Rng = () => number;

export type HuntState = {
  positions: ReadonlyMap<string, Point>;
  rng: Rng;
  // The office she sleeps in (or is sleepwalking to).
  hidden: string;
  visits: number;
  // Empty offices searched since the last find ("?" marks).
  searched: string[];
  finds: number;
};

export type HuntVisit = { found: boolean; lines: string[] };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

// A random office far enough from `from`, never `exclude`; any other office
// when none is far enough.
export function pickHideout(
  positions: ReadonlyMap<string, Point>,
  from: Point,
  exclude: string | null,
  rng: Rng,
): string {
  const others = [...positions.keys()].filter((id) => id !== exclude);
  const far = others.filter((id) => distance(positions.get(id) as Point, from) >= MIN_HIDE_DISTANCE);
  const pool = far.length > 0 ? far : others;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

export function createHunt(positions: ReadonlyMap<string, Point>, start: Point, rng: Rng): HuntState {
  return { positions, rng, hidden: pickHideout(positions, start, null, rng), visits: 0, searched: [], finds: 0 };
}

// The crowd reaches an office: a hint, or a find; null for unknown offices.
export function huntVisit(state: HuntState, id: string): HuntVisit | null {
  const pos = state.positions.get(id);
  if (!pos) {
    return null;
  }
  state.visits += 1;
  if (id === state.hidden) {
    state.finds += 1;
    state.searched = [];
    return { found: true, lines: [state.finds === 1 ? FOUND_LINE : CAUGHT_LINE] };
  }
  if (!state.searched.includes(id)) {
    state.searched.push(id);
  }
  return { found: false, lines: [hintFor(pos, state.positions.get(state.hidden) as Point)] };
}

// After a talk round she sleepwalks to another office far away.
export function huntFlee(state: HuntState): { from: Point; to: Point } {
  const from = state.positions.get(state.hidden) as Point;
  state.hidden = pickHideout(state.positions, from, state.hidden, state.rng);
  return { from, to: state.positions.get(state.hidden) as Point };
}

// What the ending shows.
export function huntResult(state: HuntState): HuntResult {
  return { visits: state.visits };
}
