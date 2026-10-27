import { describe, expect, it } from "vitest";
import { MAP_DETAILS, pickMapDetail } from "./mapCanvas";

describe("pickMapDetail", () => {
  it("uses the least detail that still covers the screen pixels", () => {
    expect(pickMapDetail(0.36)).toBe(0.5);
    expect(pickMapDetail(0.8)).toBe(1);
    expect(pickMapDetail(1.6)).toBe(2);
  });

  it("falls back to the most detail when zoomed in past it", () => {
    expect(pickMapDetail(4)).toBe(Math.max(...MAP_DETAILS));
  });
});
