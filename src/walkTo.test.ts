import { describe, expect, it } from "vitest";
import { walkStep } from "./walkTo";

const anywhere = () => true;

describe("walkStep", () => {
  it("steps straight toward the target", () => {
    const step = walkStep({ x: 0, y: 0 }, { x: 30, y: 40 }, 5, anywhere);
    expect(step.pos.x).toBeCloseTo(3);
    expect(step.pos.y).toBeCloseTo(4);
    expect(step.done).toBe(false);
    expect(step.dx).toBeGreaterThan(0);
  });

  it("lands on the target and finishes when it is within one step", () => {
    expect(walkStep({ x: 0, y: 0 }, { x: 3, y: 0 }, 5, anywhere)).toEqual({
      pos: { x: 3, y: 0 },
      dx: 3,
      done: true,
    });
  });

  it("slides along a wall when the straight way is blocked", () => {
    // Land is y <= 0; target is up-right beyond the edge at y = 0.
    const land = (p: { x: number; y: number }) => p.y <= 0;
    const step = walkStep({ x: 0, y: 0 }, { x: 30, y: 40 }, 5, land);
    expect(step.pos.y).toBe(0);
    expect(step.pos.x).toBeGreaterThan(0);
    expect(step.done).toBe(false);
  });

  it("finishes when it cannot get any closer", () => {
    const land = (p: { x: number; y: number }) => p.y <= 0;
    const step = walkStep({ x: 30, y: 0 }, { x: 30, y: 40 }, 5, land);
    expect(step.pos).toEqual({ x: 30, y: 0 });
    expect(step.done).toBe(true);
  });
});
