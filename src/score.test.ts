import { describe, expect, it } from "vitest";
import { createScore, visitOffice } from "./score";

describe("visitOffice", () => {
  it("grants the office's level points only on the first visit", () => {
    const state = createScore();
    expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(10);
    expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(0);
    expect(state.total).toBe(10);
    expect(state.visited).toEqual(["ojt-u-novom-sadu"]);
  });

  it("grants more for higher levels", () => {
    const state = createScore();
    expect(visitOffice(state, "vjt-u-novom-sadu").granted).toBe(20);
    expect(visitOffice(state, "ajt-u-novom-sadu").granted).toBe(30);
    expect(visitOffice(state, "vrhovno-javno-tuzilastvo").granted).toBe(50);
    expect(state.total).toBe(100);
  });

  it("grants nothing for an unknown id and does not throw", () => {
    const state = createScore();
    expect(visitOffice(state, "dragon").granted).toBe(0);
    expect(state.total).toBe(0);
    expect(state.visited).toEqual([]);
  });
});
