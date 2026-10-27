import { describe, expect, it } from "vitest";
import { GAME_HEIGHT, GAME_WIDTH, fitScreen } from "./screen";

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
