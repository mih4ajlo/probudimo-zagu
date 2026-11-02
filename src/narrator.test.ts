import { describe, expect, it } from "vitest";
import { IDLE_FACT_SECONDS, LINE_SECONDS, clearNarration, createNarrator, narrate, tickNarrator } from "./narrator";

describe("narrator", () => {
  it("hides a line after LINE_SECONDS", () => {
    const state = createNarrator();
    narrate(state, "hello", LINE_SECONDS);
    tickNarrator(state, LINE_SECONDS - 0.1, false);
    expect(state.text).toBe("hello");
    tickNarrator(state, 0.2, false);
    expect(state.text).toBeNull();
  });

  it("holds a line until cleared when seconds is null", () => {
    const state = createNarrator();
    narrate(state, "hold", null);
    tickNarrator(state, 1000, false);
    expect(state.text).toBe("hold");
    clearNarration(state);
    expect(state.text).toBeNull();
  });

  it("asks for an idle fact after IDLE_FACT_SECONDS of free walking", () => {
    const state = createNarrator();
    expect(tickNarrator(state, IDLE_FACT_SECONDS - 1, false)).toBe(false);
    expect(tickNarrator(state, 1, false)).toBe(true);
    expect(state.idle).toBe(0);
    expect(tickNarrator(state, 1, false)).toBe(false);
  });

  it("does not count blocked time or time with a line showing", () => {
    const state = createNarrator();
    expect(tickNarrator(state, IDLE_FACT_SECONDS * 2, true)).toBe(false);
    expect(state.idle).toBe(0);
    narrate(state, "line", LINE_SECONDS);
    expect(tickNarrator(state, LINE_SECONDS / 2, false)).toBe(false);
    expect(state.idle).toBe(0);
    narrate(state, "held", null);
    expect(tickNarrator(state, IDLE_FACT_SECONDS * 2, false)).toBe(false);
    expect(state.idle).toBe(0);
  });

  it("replaces the current line with a new one", () => {
    const state = createNarrator();
    narrate(state, "old", LINE_SECONDS);
    tickNarrator(state, LINE_SECONDS - 1, false);
    narrate(state, "new", LINE_SECONDS);
    tickNarrator(state, 2, false);
    expect(state.text).toBe("new");
  });

  it("starts the idle count again after a line", () => {
    const state = createNarrator();
    tickNarrator(state, IDLE_FACT_SECONDS - 1, false);
    narrate(state, "area", LINE_SECONDS);
    expect(state.idle).toBe(0);
  });
});
