import { describe, expect, it } from "vitest";
import { TAP_MAX_MOVE, TAP_MAX_SECONDS, createTap, tapDown, tapMove, tapUp } from "./tap";

describe("tap", () => {
  it("is a tap when one finger lifts quickly without sliding", () => {
    const tap = createTap();
    tapDown(tap, 1, { x: 100, y: 50 }, 0);
    tapMove(tap, 1, { x: 102, y: 51 });
    expect(tapUp(tap, 1, { x: 102, y: 51 }, 0.1)).toEqual({ x: 102, y: 51 });
  });

  it("is not a tap when the finger slides too far", () => {
    const tap = createTap();
    tapDown(tap, 1, { x: 100, y: 50 }, 0);
    tapMove(tap, 1, { x: 100 + TAP_MAX_MOVE + 1, y: 50 });
    tapMove(tap, 1, { x: 100, y: 50 });
    expect(tapUp(tap, 1, { x: 100, y: 50 }, 0.1)).toBeNull();
  });

  it("is not a tap when held too long", () => {
    const tap = createTap();
    tapDown(tap, 1, { x: 100, y: 50 }, 0);
    expect(tapUp(tap, 1, { x: 100, y: 50 }, TAP_MAX_SECONDS + 0.1)).toBeNull();
  });

  it("is not a tap when a second finger joins (pinch)", () => {
    const tap = createTap();
    tapDown(tap, 1, { x: 100, y: 50 }, 0);
    tapDown(tap, 2, { x: 150, y: 50 }, 0.05);
    expect(tapUp(tap, 2, { x: 150, y: 50 }, 0.1)).toBeNull();
    expect(tapUp(tap, 1, { x: 100, y: 50 }, 0.12)).toBeNull();
  });

  it("is ready for the next tap after a finger lifts", () => {
    const tap = createTap();
    tapDown(tap, 1, { x: 100, y: 50 }, 0);
    tapUp(tap, 1, { x: 100, y: 50 }, 2);
    tapDown(tap, 3, { x: 10, y: 20 }, 3);
    expect(tapUp(tap, 3, { x: 10, y: 20 }, 3.1)).toEqual({ x: 10, y: 20 });
  });
});
