import { describe, expect, it } from "vitest";
import { createScore, visitLord } from "./score";

describe("visitLord", () => {
  it("grants points only on the first visit", () => {
    const state = createScore();
    expect(visitLord(state, "north").granted).toBe(10);
    expect(visitLord(state, "north").granted).toBe(0);
    expect(state.total).toBe(10);
    expect(state.visited).toEqual(["north"]);
  });

  it("grants rank 2 points for a rank 2 lord", () => {
    const state = createScore();
    expect(visitLord(state, "east").granted).toBe(20);
  });

  it("sums points across different ranked lords", () => {
    const state = createScore();
    visitLord(state, "north");
    visitLord(state, "east");
    visitLord(state, "west");
    expect(state.total).toBe(60);
  });

  it("grants nothing for an unknown id and does not throw", () => {
    const state = createScore();
    expect(visitLord(state, "dragon").granted).toBe(0);
    expect(state.total).toBe(0);
    expect(state.visited).toEqual([]);
  });
});
