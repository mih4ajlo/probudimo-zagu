import { describe, expect, it } from "vitest";
import {
  DEAD_ZONE,
  JOYSTICK_RADIUS,
  createJoystick,
  isInsideCircle,
  joystickInput,
  knobOffset,
  moveJoystick,
  pressJoystick,
  releaseJoystick,
} from "./joystick";

const CENTER = { x: 40, y: 140 };

function pressedAt(x: number, y: number) {
  const stick = createJoystick(CENTER);
  pressJoystick(stick, 1, CENTER);
  moveJoystick(stick, 1, { x, y });
  return stick;
}

describe("isInsideCircle", () => {
  it("includes the edge and excludes points beyond it", () => {
    expect(isInsideCircle({ x: 50, y: 0 }, { x: 40, y: 0 }, 10)).toBe(true);
    expect(isInsideCircle({ x: 51, y: 0 }, { x: 40, y: 0 }, 10)).toBe(false);
  });
});

describe("joystick", () => {
  it("gives no input until pressed", () => {
    expect(joystickInput(createJoystick(CENTER))).toEqual({ dx: 0, dy: 0 });
  });

  it("ignores a press that starts far from the stick", () => {
    const stick = createJoystick(CENTER);
    expect(pressJoystick(stick, 1, { x: 300, y: 140 })).toBe(false);
    moveJoystick(stick, 1, { x: 320, y: 140 });
    expect(joystickInput(stick)).toEqual({ dx: 0, dy: 0 });
  });

  it("gives no input inside the dead zone", () => {
    const small = JOYSTICK_RADIUS * DEAD_ZONE - 1;
    expect(joystickInput(pressedAt(CENTER.x + small, CENTER.y))).toEqual({ dx: 0, dy: 0 });
  });

  it("snaps to the four directions like the arrow keys", () => {
    const far = JOYSTICK_RADIUS;
    expect(joystickInput(pressedAt(CENTER.x + far, CENTER.y + 2))).toEqual({ dx: 1, dy: 0 });
    expect(joystickInput(pressedAt(CENTER.x - far, CENTER.y - 2))).toEqual({ dx: -1, dy: 0 });
    expect(joystickInput(pressedAt(CENTER.x + 2, CENTER.y - far))).toEqual({ dx: 0, dy: -1 });
    expect(joystickInput(pressedAt(CENTER.x - 2, CENTER.y + far))).toEqual({ dx: 0, dy: 1 });
  });

  it("snaps to diagonals like two arrow keys held together", () => {
    expect(joystickInput(pressedAt(CENTER.x + 15, CENTER.y - 15))).toEqual({ dx: 1, dy: -1 });
    expect(joystickInput(pressedAt(CENTER.x - 15, CENTER.y + 15))).toEqual({ dx: -1, dy: 1 });
  });

  it("follows only the finger that pressed it", () => {
    const stick = pressedAt(CENTER.x + JOYSTICK_RADIUS, CENTER.y);
    moveJoystick(stick, 2, { x: CENTER.x - JOYSTICK_RADIUS, y: CENTER.y });
    releaseJoystick(stick, 2);
    expect(joystickInput(stick)).toEqual({ dx: 1, dy: 0 });
  });

  it("stops when released", () => {
    const stick = pressedAt(CENTER.x + JOYSTICK_RADIUS, CENTER.y);
    releaseJoystick(stick, 1);
    expect(joystickInput(stick)).toEqual({ dx: 0, dy: 0 });
  });

  it("keeps the knob within the ring", () => {
    const offset = knobOffset(pressedAt(CENTER.x + JOYSTICK_RADIUS * 3, CENTER.y));
    expect(offset.x).toBeCloseTo(JOYSTICK_RADIUS);
    expect(offset.y).toBeCloseTo(0);
    expect(knobOffset(createJoystick(CENTER))).toEqual({ x: 0, y: 0 });
  });
});
