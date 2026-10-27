import type { Point } from "./geo";
import { clampZoom } from "./zoom";

// Two-finger pinch zoom. Positions are screen game units; only the first two
// fingers on the map count.
export type PinchState = {
  fingers: Map<number, Point>;
  startDistance: number;
  startZoom: number;
};

export function createPinch(): PinchState {
  return { fingers: new Map(), startDistance: 0, startZoom: 1 };
}

export function isPinching(state: PinchState): boolean {
  return state.fingers.size === 2;
}

function spread(state: PinchState): number {
  const [a, b] = [...state.fingers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pinchDown(state: PinchState, id: number, pos: Point, zoom: number): void {
  if (state.fingers.size >= 2) {
    return;
  }
  state.fingers.set(id, pos);
  if (isPinching(state)) {
    state.startDistance = spread(state);
    state.startZoom = zoom;
  }
}

// Returns the new zoom while two fingers pinch, otherwise null.
export function pinchMove(state: PinchState, id: number, pos: Point): number | null {
  if (!state.fingers.has(id)) {
    return null;
  }
  state.fingers.set(id, pos);
  if (!isPinching(state) || state.startDistance === 0) {
    return null;
  }
  return clampZoom((state.startZoom * spread(state)) / state.startDistance);
}

export function pinchUp(state: PinchState, id: number): void {
  state.fingers.delete(id);
  state.startDistance = 0;
}
