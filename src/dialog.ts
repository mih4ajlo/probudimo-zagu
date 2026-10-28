import { moveSelection } from "./titleMenu";

export type DialogState = {
  lines: string[];
  index: number;
  open: boolean;
  // Options to pick from instead of lines, or null.
  choices: string[] | null;
  selected: number;
};

// Keyboard keys that advance a dialog line (click also advances).
export const ADVANCE_KEYS = ["space", "enter"] as const;

export function createDialog(): DialogState {
  return { lines: [], index: 0, open: false, choices: null, selected: 0 };
}

export function openDialog(state: DialogState, lines: readonly string[]): void {
  state.choices = null;
  state.selected = 0;
  if (lines.length === 0) {
    state.lines = [];
    state.index = 0;
    state.open = false;
    return;
  }
  state.lines = [...lines];
  state.index = 0;
  state.open = true;
}

export function advanceDialog(state: DialogState): void {
  if (!state.open || state.choices) {
    return;
  }
  if (state.index >= state.lines.length - 1) {
    state.open = false;
    return;
  }
  state.index += 1;
}

export function isMovementBlocked(state: DialogState): boolean {
  return state.open;
}

export function currentLine(state: DialogState): string | null {
  if (!state.open) {
    return null;
  }
  return state.lines[state.index] ?? null;
}

export function openChoices(state: DialogState, options: readonly string[]): void {
  if (options.length === 0) {
    openDialog(state, []);
    return;
  }
  state.lines = [];
  state.index = 0;
  state.open = true;
  state.choices = [...options];
  state.selected = 0;
}

export function currentChoices(state: DialogState): readonly string[] | null {
  return state.open ? state.choices : null;
}

export function moveChoice(state: DialogState, delta: number): void {
  if (state.choices) {
    state.selected = moveSelection(state.selected, delta, state.choices.length);
  }
}

// Closes the options and returns the picked index (the marked one by default).
export function pickChoice(state: DialogState, index = state.selected): number | null {
  if (!state.open || !state.choices || index < 0 || index >= state.choices.length) {
    return null;
  }
  state.choices = null;
  state.selected = 0;
  state.open = false;
  return index;
}

// Which option row a tap at height y hits, for rows starting at top.
export function choiceAt(y: number, top: number, rowHeight: number, count: number): number | null {
  const row = Math.floor((y - top) / rowHeight);
  return row >= 0 && row < count ? row : null;
}
