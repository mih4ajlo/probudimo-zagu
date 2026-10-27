export type DialogState = {
  lines: string[];
  index: number;
  open: boolean;
};

// Keyboard keys that advance a dialog line (click also advances).
export const ADVANCE_KEYS = ["space", "enter"] as const;

export function createDialog(): DialogState {
  return { lines: [], index: 0, open: false };
}

export function openDialog(state: DialogState, lines: readonly string[]): void {
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
  if (!state.open) {
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
