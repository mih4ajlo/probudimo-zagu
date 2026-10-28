// "Find Zaga" mode: tuning numbers and copy.
export const HUNT_TITLE = "Find Zaga";

// The crowd: the leader and this many followers.
export const FOLLOWERS = 2;
// Her sleepwalk between talk rounds, game units per second (the crowd walks 80).
export const SLEEPWALK_SPEED = 40;
// Game units (about 3.3 per km): she always hides at least this far away.
export const MIN_HIDE_DISTANCE = 300;
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

export const HUNT_ENDING_LINE = "Zaga is awake!";

export const FOUND_LINE = "There she is, fast asleep in the office!";
export const CAUGHT_LINE = "Caught her again - still asleep!";
export const SLEEPWALK_LINE = "She sleepwalks off to another office. After her!";

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
