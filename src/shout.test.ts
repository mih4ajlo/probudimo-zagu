import { describe, expect, it } from "vitest";
import { SHOUT_LINE } from "./data/story";
import {
  SHOUT_SECONDS,
  createShout,
  isShouting,
  startShout,
  tickShout,
  withShout,
} from "./shout";

describe("shout", () => {
  it("is not shouting until started", () => {
    expect(isShouting(createShout())).toBe(false);
  });

  it("shouts for SHOUT_SECONDS and then stops", () => {
    const state = createShout();
    startShout(state);
    tickShout(state, SHOUT_SECONDS - 0.1);
    expect(isShouting(state)).toBe(true);
    tickShout(state, 0.2);
    expect(isShouting(state)).toBe(false);
  });

  it("does not restart while already shouting", () => {
    const state = createShout();
    startShout(state);
    tickShout(state, SHOUT_SECONDS - 0.1);
    startShout(state);
    tickShout(state, 0.2);
    expect(isShouting(state)).toBe(false);
  });
});

describe("withShout", () => {
  it("opens an office visit with the shout, then the office's lines", () => {
    expect(withShout(["hello", "bye"])).toEqual([SHOUT_LINE, "hello", "bye"]);
  });
});
