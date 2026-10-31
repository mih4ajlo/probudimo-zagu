import { CAUGHT_LINE, FOUND_LINE, MIN_HIDE_DISTANCE } from "./data/hunt";
import type { Point } from "./geo";
import { hintFor } from "./hint";
import type { HuntResult } from "./session";

// Random number in [0, 1); scenes pass Math.random, tests a fixed value.
export type Rng = () => number;
// Whether she can sleepwalk from one point to another in a straight line.
export type CanWalk = (from: Point, to: Point) => boolean;

export type HuntState = {
  positions: ReadonlyMap<string, Point>;
  rng: Rng;
  // The office she sleeps in (or is sleepwalking to).
  hidden: string;
  visits: number;
  // Empty offices searched since the last find ("?" marks).
  searched: string[];
  finds: number;
  // Times she has sleepwalked off; the talk round shown is one more.
  flees: number;
  canWalk: CanWalk;
};

export type HuntVisit = { found: boolean; lines: string[] };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

// A random office far enough from `from` that she can walk to, never
// `exclude`; a far one she cannot walk to, then any other, when none fits.
export function pickHideout(
  positions: ReadonlyMap<string, Point>,
  from: Point,
  exclude: string | null,
  rng: Rng,
  canWalk: CanWalk = () => true,
): string {
  const others = [...positions.keys()].filter((id) => id !== exclude);
  const far = others.filter((id) => distance(positions.get(id) as Point, from) >= MIN_HIDE_DISTANCE);
  const walkable = far.filter((id) => canWalk(from, positions.get(id) as Point));
  const pool = walkable.length > 0 ? walkable : far.length > 0 ? far : others;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

// The first hideout ignores `canWalk`: she starts there asleep.
export function createHunt(
  positions: ReadonlyMap<string, Point>,
  start: Point,
  rng: Rng,
  canWalk: CanWalk = () => true,
): HuntState {
  const hidden = pickHideout(positions, start, null, rng);
  return { positions, rng, hidden, visits: 0, searched: [], finds: 0, flees: 0, canWalk };
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
  state.hidden = pickHideout(state.positions, from, state.hidden, state.rng, state.canWalk);
  state.flees += 1;
  return { from, to: state.positions.get(state.hidden) as Point };
}

// The talk round the HUD shows: it moves on when she sleepwalks off, not
// while she is still replying.
export function huntRound(state: HuntState): number {
  return state.flees + 1;
}

// What the ending shows.
export function huntResult(state: HuntState): HuntResult {
  return { visits: state.visits };
}
