import type { Point } from "./geo";

// A tap on the map: one finger, lifted quickly, without sliding. Positions
// are screen game units.
export const TAP_MAX_SECONDS = 0.35;
export const TAP_MAX_MOVE = 6;

export type TapState = {
  id: number | null;
  start: Point;
  startTime: number;
  cancelled: boolean;
};

export function createTap(): TapState {
  return { id: null, start: { x: 0, y: 0 }, startTime: 0, cancelled: false };
}

export function tapDown(state: TapState, id: number, pos: Point, time: number): void {
  if (state.id !== null) {
    // A second finger: this is a pinch, not a tap.
    state.cancelled = true;
    return;
  }
  state.id = id;
  state.start = pos;
  state.startTime = time;
  state.cancelled = false;
}

export function tapMove(state: TapState, id: number, pos: Point): void {
  if (state.id === id && Math.hypot(pos.x - state.start.x, pos.y - state.start.y) > TAP_MAX_MOVE) {
    state.cancelled = true;
  }
}

// Returns where the tap landed, or null when this lift was not a tap.
export function tapUp(state: TapState, id: number, pos: Point, time: number): Point | null {
  if (state.id !== id) {
    return null;
  }
  const isTap = !state.cancelled && time - state.startTime <= TAP_MAX_SECONDS;
  state.id = null;
  return isTap ? pos : null;
}
