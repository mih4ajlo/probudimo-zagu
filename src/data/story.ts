export const TITLE = "Probudimo Zagu";

export const WAKE_LINES: readonly string[] = [
  "The old princess opens one eye.",
  "A voice from the door: The prosecutors are asleep. Visit every office in Serbia and wake them up.",
  "She sighs, puts on her medal, and stands.",
];

export const ENDING_LINES: readonly string[] = [
  "Every prosecutor's office is awake.",
  "Zaga can nap again - after tea.",
];

// The princess shouts this with her hands in the air (E key, and on each office visit).
export const SHOUT_LINE = "Budite se, na posao!";

// Title menu: game modes and the scene each one starts.
export const MODES: readonly { scene: string; label: string }[] = [
  { scene: "wake", label: "Wake the offices" },
  { scene: "hunt", label: "Find Zaga" },
];

// Under the title's mode list.
export const MENU_HINT_TOUCH = "Tap a mode";
export const MENU_HINT_KEYS = "Up/Down, then Enter";
