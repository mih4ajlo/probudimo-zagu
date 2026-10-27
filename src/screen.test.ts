import { describe, expect, it } from "vitest";
import { GAME_HEIGHT, GAME_WIDTH, MAX_CANVAS_PIXELS, fitScreen, pixelDensityFor } from "./screen";

describe("fitScreen", () => {
  it("shows exactly the design area on a 16:9 screen", () => {
    expect(fitScreen(1280, 720)).toEqual({ scale: 4, w: GAME_WIDTH, h: GAME_HEIGHT });
  });

  it("shows more width on a wide phone in landscape", () => {
    const fit = fitScreen(915, 412);
    expect(fit.h).toBeCloseTo(GAME_HEIGHT);
    expect(fit.w).toBeGreaterThan(GAME_WIDTH);
  });

  it("shows more height on a phone in portrait", () => {
    const fit = fitScreen(412, 915);
    expect(fit.w).toBeCloseTo(GAME_WIDTH);
    expect(fit.h).toBeGreaterThan(GAME_HEIGHT);
  });
});

describe("pixelDensityFor", () => {
  it("keeps phones at full 2x sharpness", () => {
    expect(pixelDensityFor(3, 390, 844)).toBe(2);
  });

  it("caps big high-DPI screens to the canvas pixel budget", () => {
    const density = pixelDensityFor(2, 1280, 720);
    expect(density).toBeGreaterThan(1);
    expect(density).toBeLessThan(2);
    expect(1280 * density * 720 * density).toBeLessThanOrEqual(MAX_CANVAS_PIXELS + 1);
  });

  it("uses the screen's own ratio on normal screens", () => {
    expect(pixelDensityFor(1, 1280, 720)).toBe(1);
  });

  it("never drops below 1, even on huge windows", () => {
    expect(pixelDensityFor(2, 3840, 2160)).toBe(1);
  });

  it("does not go above a ratio below 1 (zoomed-out browser)", () => {
    expect(pixelDensityFor(0.8, 1280, 720)).toBe(0.8);
  });
});
