import { describe, expect, it } from "vitest";
import { createPinch, isPinching, pinchDown, pinchMove, pinchUp } from "./pinch";
import { ZOOM_MAX, ZOOM_MIN } from "./zoom";

describe("pinch", () => {
  it("does not zoom with one finger", () => {
    const pinch = createPinch();
    pinchDown(pinch, 1, { x: 100, y: 100 }, 0.5);
    expect(isPinching(pinch)).toBe(false);
    expect(pinchMove(pinch, 1, { x: 150, y: 100 })).toBeNull();
  });

  it("zooms by how far two fingers spread or pinch", () => {
    const pinch = createPinch();
    pinchDown(pinch, 1, { x: 100, y: 100 }, 0.4);
    pinchDown(pinch, 2, { x: 120, y: 100 }, 0.4);
    expect(isPinching(pinch)).toBe(true);
    expect(pinchMove(pinch, 2, { x: 140, y: 100 })).toBeCloseTo(0.8);
    expect(pinchMove(pinch, 2, { x: 110, y: 100 })).toBeCloseTo(0.2);
  });

  it("stays within the zoom limits", () => {
    const pinch = createPinch();
    pinchDown(pinch, 1, { x: 100, y: 100 }, 0.5);
    pinchDown(pinch, 2, { x: 110, y: 100 }, 0.5);
    expect(pinchMove(pinch, 2, { x: 300, y: 100 })).toBe(ZOOM_MAX);
    expect(pinchMove(pinch, 2, { x: 100.1, y: 100 })).toBe(ZOOM_MIN);
  });

  it("stops pinching when a finger lifts", () => {
    const pinch = createPinch();
    pinchDown(pinch, 1, { x: 100, y: 100 }, 0.5);
    pinchDown(pinch, 2, { x: 120, y: 100 }, 0.5);
    pinchUp(pinch, 2);
    expect(isPinching(pinch)).toBe(false);
    expect(pinchMove(pinch, 1, { x: 200, y: 100 })).toBeNull();
  });

  it("ignores a third finger", () => {
    const pinch = createPinch();
    pinchDown(pinch, 1, { x: 100, y: 100 }, 0.4);
    pinchDown(pinch, 2, { x: 120, y: 100 }, 0.4);
    pinchDown(pinch, 3, { x: 500, y: 500 }, 0.4);
    expect(pinchMove(pinch, 3, { x: 900, y: 900 })).toBeNull();
    expect(pinchMove(pinch, 2, { x: 140, y: 100 })).toBeCloseTo(0.8);
  });
});
