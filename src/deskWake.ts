// The ending's wake-up timeline at the desk, in seconds from the scene start.
export const WAKE_PHASES = ["asleep", "burst", "awake", "text"] as const;
export type WakePhase = (typeof WAKE_PHASES)[number];
export const WAKE_TIMES = { burst: 1.6, awake: 2.0, text: 3.0 };

export function wakePhase(t: number): WakePhase {
  if (t < WAKE_TIMES.burst) {
    return "asleep";
  }
  if (t < WAKE_TIMES.awake) {
    return "burst";
  }
  return t < WAKE_TIMES.text ? "awake" : "text";
}

// Phases after index `reached` up to the one at time t, in order, so a
// skipped frame never skips a phase's effect.
export function phasesToEnter(reached: number, t: number): WakePhase[] {
  return WAKE_PHASES.slice(reached + 1, WAKE_PHASES.indexOf(wakePhase(t)) + 1);
}
