import { describe, expect, it } from "vitest";
import {
  ADVANCE_KEYS,
  advanceDialog,
  choiceAt,
  createDialog,
  currentChoices,
  currentLine,
  isMovementBlocked,
  moveChoice,
  openChoices,
  openDialog,
  pickChoice,
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

describe("dialog choices", () => {
  const open = () => {
    const state = createDialog();
    openChoices(state, ["a", "b", "c"]);
    return state;
  };

  it("blocks movement and shows the options instead of a line", () => {
    const state = open();
    expect(isMovementBlocked(state)).toBe(true);
    expect(currentLine(state)).toBeNull();
    expect(currentChoices(state)).toEqual(["a", "b", "c"]);
    expect(state.selected).toBe(0);
  });

  it("moves the marker and wraps both ways", () => {
    const state = open();
    moveChoice(state, -1);
    expect(state.selected).toBe(2);
    moveChoice(state, 1);
    expect(state.selected).toBe(0);
  });

  it("is not closed by advancing", () => {
    const state = open();
    advanceDialog(state);
    expect(currentChoices(state)).toEqual(["a", "b", "c"]);
  });

  it("picks the marked option and unblocks", () => {
    const state = open();
    moveChoice(state, 1);
    expect(pickChoice(state)).toBe(1);
    expect(isMovementBlocked(state)).toBe(false);
    expect(currentChoices(state)).toBeNull();
  });

  it("picks a given option, ignoring out-of-range ones", () => {
    const state = open();
    expect(pickChoice(state, 5)).toBeNull();
    expect(isMovementBlocked(state)).toBe(true);
    expect(pickChoice(state, 2)).toBe(2);
  });

  it("picks nothing when no choice is open", () => {
    const state = createDialog();
    openDialog(state, ["line"]);
    expect(pickChoice(state)).toBeNull();
    expect(currentLine(state)).toBe("line");
  });

  it("drops the options when a dialog opens", () => {
    const state = open();
    openDialog(state, ["line"]);
    expect(currentChoices(state)).toBeNull();
    expect(currentLine(state)).toBe("line");
  });
});

describe("choiceAt", () => {
  it("maps a y position to an option row", () => {
    expect(choiceAt(100, 100, 12, 3)).toBe(0);
    expect(choiceAt(111.9, 100, 12, 3)).toBe(0);
    expect(choiceAt(112, 100, 12, 3)).toBe(1);
    expect(choiceAt(135, 100, 12, 3)).toBe(2);
    expect(choiceAt(99, 100, 12, 3)).toBeNull();
    expect(choiceAt(136, 100, 12, 3)).toBeNull();
  });
});
