import { pageLine, RIGHT, TRAIL_STEPS, WRONG, type TrailStep } from "./data/trail";

// The file trail of one Find Zaga run: pages shown so far, then her check.
export type FileTrailState = { steps: readonly TrailStep[]; shown: number; checked: number; right: number };

export function createFileTrail(steps: readonly TrailStep[] = TRAIL_STEPS): FileTrailState {
  return { steps, shown: 0, checked: 0, right: 0 };
}

// The next page, found beside her; null once every page is shown.
export function trailPage(state: FileTrailState): string[] | null {
  const step = state.steps[state.shown];
  if (!step) {
    return null;
  }
  state.shown += 1;
  return [pageLine(state.shown, state.steps.length), step.order, step.trace];
}

export function checkDone(state: FileTrailState): boolean {
  return state.checked >= state.steps.length;
}

// What the step under check was; null when the check is done.
export function checkRecap(state: FileTrailState): string | null {
  return state.steps[state.checked]?.recap ?? null;
}

// The player's call on the current step: her verdict and the rule, then on.
export function checkAnswer(state: FileTrailState, lawful: boolean): string[] | null {
  const step = state.steps[state.checked];
  if (!step) {
    return null;
  }
  state.checked += 1;
  const right = step.lawful === lawful;
  if (right) {
    state.right += 1;
  }
  return [`${right ? RIGHT : WRONG} ${step.cite}`, step.rule];
}

export function checkScore(state: FileTrailState): number {
  return state.right;
}
