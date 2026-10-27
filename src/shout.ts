import { SHOUT_LINE } from "./data/story";

export const SHOUT_SECONDS = 1.2;

export type ShoutState = {
  remaining: number;
};

export function createShout(): ShoutState {
  return { remaining: 0 };
}

export function startShout(state: ShoutState): void {
  if (isShouting(state)) {
    return;
  }
  state.remaining = SHOUT_SECONDS;
}

export function tickShout(state: ShoutState, dt: number): void {
  state.remaining = Math.max(0, state.remaining - dt);
}

export function isShouting(state: ShoutState): boolean {
  return state.remaining > 0;
}

// A lord visit opens with the princess shouting, then the lord answers.
export function withShout(lines: readonly string[]): string[] {
  return [SHOUT_LINE, ...lines];
}
