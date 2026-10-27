import { describe, expect, it } from "vitest";
import {
  ADVANCE_KEYS,
  advanceDialog,
  createDialog,
  currentLine,
  isMovementBlocked,
  openDialog,
} from "./dialog";

describe("dialog", () => {
  it("blocks movement while open and unblocks after the last line", () => {
    const state = createDialog();
    openDialog(state, ["one", "two"]);
    expect(isMovementBlocked(state)).toBe(true);
    expect(currentLine(state)).toBe("one");
    advanceDialog(state);
    expect(currentLine(state)).toBe("two");
    advanceDialog(state);
    expect(isMovementBlocked(state)).toBe(false);
    expect(currentLine(state)).toBeNull();
  });

  it("does not block movement when opened with no lines", () => {
    const state = createDialog();
    openDialog(state, []);
    expect(isMovementBlocked(state)).toBe(false);
  });

  it("ignores advance when already closed", () => {
    const state = createDialog();
    advanceDialog(state);
    expect(isMovementBlocked(state)).toBe(false);
  });
});

describe("ADVANCE_KEYS", () => {
  it("advances on both Space and Enter", () => {
    expect([...ADVANCE_KEYS].sort()).toEqual(["enter", "space"]);
  });
});
