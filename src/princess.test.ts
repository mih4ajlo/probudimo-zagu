import { describe, expect, it } from "vitest";
import { characterLayout, faceFromInput, pickAnim } from "./princess";

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

describe("characterLayout", () => {
  it("keeps the princess's bubble and camera where they were", () => {
    // Princess frames are 98 px at 4 px per unit.
    expect(characterLayout(24.5)).toEqual({ bubbleLift: 27, bodyCenter: 12.25 });
  });

  it("lifts the bubble above a taller character's raised sign", () => {
    const layout = characterLayout(30);
    expect(layout.bubbleLift).toBeGreaterThan(30);
    expect(layout.bodyCenter).toBe(15);
  });
});
