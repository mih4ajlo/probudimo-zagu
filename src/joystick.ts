// On-screen joystick for touch play. Positions are in game units.

export type Point = { x: number; y: number };

export const JOYSTICK_RADIUS = 22;
// Fraction of the radius the finger must travel before she walks.
export const DEAD_ZONE = 0.3;
// A press this far from the center (in radii) still grabs the stick.
const GRAB_RADII = 1.6;

export type JoystickState = {
  center: Point;
  touchId: number | null;
  finger: Point;
};

export function createJoystick(center: Point): JoystickState {
  return { center, touchId: null, finger: center };
}

export function isInsideCircle(point: Point, center: Point, radius: number): boolean {
  return Math.hypot(point.x - center.x, point.y - center.y) <= radius;
}

// Returns true when this touch grabbed the stick.
export function pressJoystick(state: JoystickState, touchId: number, pos: Point): boolean {
  if (state.touchId !== null || !isInsideCircle(pos, state.center, JOYSTICK_RADIUS * GRAB_RADII)) {
    return false;
  }
  state.touchId = touchId;
  state.finger = pos;
  return true;
}

export function moveJoystick(state: JoystickState, touchId: number, pos: Point): void {
  if (state.touchId === touchId) {
    state.finger = pos;
  }
}

export function releaseJoystick(state: JoystickState, touchId: number): void {
  if (state.touchId === touchId) {
    state.touchId = null;
    state.finger = state.center;
  }
}

// Same -1/0/1 per axis as the arrow keys, snapped to 8 directions.
export function joystickInput(state: JoystickState): { dx: number; dy: number } {
  const x = state.finger.x - state.center.x;
  const y = state.finger.y - state.center.y;
  if (state.touchId === null || Math.hypot(x, y) < JOYSTICK_RADIUS * DEAD_ZONE) {
    return { dx: 0, dy: 0 };
  }
  const octant = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  const angle = (octant * Math.PI) / 4;
  // `+ 0` turns -0 into 0.
  return { dx: Math.round(Math.cos(angle)) + 0, dy: Math.round(Math.sin(angle)) + 0 };
}

// Where to draw the knob relative to the center, clamped to the ring.
export function knobOffset(state: JoystickState): Point {
  const x = state.finger.x - state.center.x;
  const y = state.finger.y - state.center.y;
  const length = Math.hypot(x, y);
  if (length <= JOYSTICK_RADIUS) {
    return { x: x + 0, y: y + 0 };
  }
  return { x: (x / length) * JOYSTICK_RADIUS, y: (y / length) * JOYSTICK_RADIUS };
}
