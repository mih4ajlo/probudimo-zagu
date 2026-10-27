import { describe, expect, it } from "vitest";
import { faceFromInput, pickAnim } from "./princess";

describe("faceFromInput", () => {
  it("faces left when walking left and right when walking right", () => {
    expect(faceFromInput(-1, "right")).toBe("left");
    expect(faceFromInput(1, "left")).toBe("right");
  });

  it("keeps the current facing when not moving sideways", () => {
    expect(faceFromInput(0, "left")).toBe("left");
    expect(faceFromInput(0, "right")).toBe("right");
  });
});

describe("pickAnim", () => {
  it("walks while moving and idles while still", () => {
    expect(pickAnim({ moving: true, shouting: false })).toBe("walk");
    expect(pickAnim({ moving: false, shouting: false })).toBe("idle");
  });

  it("shows the shout pose over walking", () => {
    expect(pickAnim({ moving: true, shouting: true })).toBe("shout");
  });
});
