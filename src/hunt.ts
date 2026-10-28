import {
  FLEE_LINE,
  MAX_FOLLOWERS,
  MIN_HIDE_DISTANCE,
  MUMBLES,
  START_FOLLOWERS,
  WAKE_BASE,
  WAKE_FULL,
  WAKE_PER_FOLLOWER,
} from "./data/hunt";
import type { Point } from "./geo";
import { hintFor } from "./hint";

// Random number in [0, 1); scenes pass Math.random, tests a fixed value.
export type Rng = () => number;

export type HuntState = {
  positions: ReadonlyMap<string, Point>;
  rng: Rng;
  // The office she sleeps in.
  hidden: string;
  wake: number;
  followers: number;
  visits: number;
  // Offices visited at least once this run; each grows the crowd once.
  seen: string[];
  // Empty offices searched since she last moved ("?" marks).
  searched: string[];
};

export type HuntVisit = { found: boolean; lines: string[] };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function wakeGain(followers: number): number {
  return WAKE_BASE + WAKE_PER_FOLLOWER * followers;
}

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
  return {
    positions,
    rng,
    hidden: pickHideout(positions, start, null, rng),
    wake: 0,
    followers: START_FOLLOWERS,
    visits: 0,
    seen: [],
    searched: [],
  };
}

export function isAwake(state: HuntState): boolean {
  return state.wake >= WAKE_FULL;
}

// Followers plus the leader.
export function crowdSize(state: HuntState): number {
  return state.followers + 1;
}

export function mumbleFor(wake: number): string {
  return (MUMBLES.find((m) => wake <= m.upTo) ?? MUMBLES[MUMBLES.length - 1]).line;
}

// The crowd reaches an office: the lines that follow the shout, or null when
// nothing happens (unknown office, or she is already awake).
export function huntVisit(state: HuntState, id: string): HuntVisit | null {
  const pos = state.positions.get(id);
  if (!pos || isAwake(state)) {
    return null;
  }
  state.visits += 1;
  if (!state.seen.includes(id)) {
    state.seen.push(id);
    state.followers = Math.min(MAX_FOLLOWERS, state.followers + 1);
  }
  if (id !== state.hidden) {
    if (!state.searched.includes(id)) {
      state.searched.push(id);
    }
    return { found: false, lines: [hintFor(pos, state.positions.get(state.hidden) as Point)] };
  }
  state.wake = Math.min(WAKE_FULL, state.wake + wakeGain(state.followers));
  state.searched = [];
  const lines = [mumbleFor(state.wake)];
  if (!isAwake(state)) {
    state.hidden = pickHideout(state.positions, pos, id, state.rng);
    lines.push(FLEE_LINE);
  }
  return { found: true, lines };
}
