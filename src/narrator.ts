// The narrator box: short neutral lines while she walks.
// A line hides after LINE_SECONDS; after IDLE_FACT_SECONDS of walking with
// nothing showing, the scene is asked for a fact.
export const LINE_SECONDS = 6;
export const IDLE_FACT_SECONDS = 20;

// left: seconds until the line hides, null = held until cleared.
export type NarratorState = { text: string | null; left: number | null; idle: number };

export function createNarrator(): NarratorState {
  return { text: null, left: null, idle: 0 };
}

export function narrate(state: NarratorState, text: string, seconds: number | null): void {
  state.text = text;
  state.left = seconds;
  state.idle = 0;
}

export function clearNarration(state: NarratorState): void {
  state.text = null;
  state.left = null;
}

// True once when it is time for an idle fact. A line waits while dialog blocks
// the walk, so it is not lost behind a dialog; idle time counts only walking.
export function tickNarrator(state: NarratorState, dt: number, blocked: boolean, moving: boolean): boolean {
  if (blocked) {
    return false;
  }
  if (state.text !== null) {
    if (state.left !== null) {
      state.left -= dt;
      if (state.left <= 0) {
        clearNarration(state);
      }
    }
    return false;
  }
  if (!moving) {
    return false;
  }
  state.idle += dt;
  if (state.idle >= IDLE_FACT_SECONDS) {
    state.idle = 0;
    return true;
  }
  return false;
}
