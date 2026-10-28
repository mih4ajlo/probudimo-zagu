// "Find Zaga" mode: tuning numbers and copy.
export const HUNT_TITLE = "Find Zaga";

export const START_FOLLOWERS = 3;
export const MAX_FOLLOWERS = 12;
// Game units (about 3.3 per km): she always hides at least this far away.
export const MIN_HIDE_DISTANCE = 300;
// Each find wakes her by WAKE_BASE + WAKE_PER_FOLLOWER per follower.
export const WAKE_BASE = 12;
export const WAKE_PER_FOLLOWER = 2;
export const WAKE_FULL = 100;
// Hint distance bands, in game units.
export const NEAR_DISTANCE = 150;
export const MID_DISTANCE = 450;

export const HUNT_INTRO: readonly string[] = [
  "Zaga is asleep in one of the offices, and she will not get up.",
  "Lead the crowd from office to office. Shout, follow the snoring, and keep at it.",
];

export const HINT_NEAR = "Very close! Zzz...";
export const hintMid = (direction: string) => `Zzz... snoring to the ${direction}, not far.`;
export const hintFar = (direction: string) => `Zzz... snoring to the ${direction}, far away.`;

// Her line after a find: the first entry whose upTo is at least the meter.
export const MUMBLES: readonly { upTo: number; line: string }[] = [
  { upTo: 30, line: "Mmm... five more minutes..." },
  { upTo: 60, line: "Who is shouting? It's not even noon..." },
  { upTo: 99, line: "Fine, fine, I'm getting up... *yawn*" },
  { upTo: 100, line: "I'm up! I'm up! Who called the press?" },
];
export const FLEE_LINE = "She sleepwalks away to another office.";

export const HUNT_ENDING_LINE = "Zaga is awake!";

export const FOUND_LINE = "There she is, fast asleep in the office!";

export type TalkChoice = { shout: string; reply: string };

// The talk once she is found: each round the crowd picks one shout and she
// answers it, a little more awake each round. Shouts fit one dialog line.
export const TALK_ROUNDS: readonly (readonly TalkChoice[])[] = [
  [
    { shout: "Budite se, na posao!", reply: "Mmm... five more minutes..." },
    { shout: "The press is outside!", reply: "Tell them I'm in a meeting... zzz" },
    { shout: "Cases are piling up!", reply: "Let them pile... piles are comfy..." },
  ],
  [
    { shout: "Two years, no answer!", reply: "Who is shouting? It's not even noon..." },
    { shout: "The citizens are waiting!", reply: "Waiting builds character... zzz" },
    { shout: "We brought coffee!", reply: "Coffee...? No... too early..." },
  ],
  [
    { shout: "We are not leaving!", reply: "Fine, fine... I'm getting up!" },
    { shout: "The whole country sees you!", reply: "The whole country? ...Even TV?!" },
    { shout: "Budite se, na posao!", reply: "Alright! I'm awake! I'm awake!" },
  ],
];
