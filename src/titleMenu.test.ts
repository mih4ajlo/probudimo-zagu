import { describe, expect, it } from "vitest";
import { moveSelection } from "./titleMenu";

describe("moveSelection", () => {
  it("moves down and wraps to the top", () => {
    expect(moveSelection(0, 1, 2)).toBe(1);
    expect(moveSelection(1, 1, 2)).toBe(0);
  });

  it("moves up and wraps to the bottom", () => {
    expect(moveSelection(0, -1, 2)).toBe(1);
    expect(moveSelection(1, -1, 2)).toBe(0);
  });
});
