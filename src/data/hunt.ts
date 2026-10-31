import type { Compass } from "../hint";

// "Find Zaga" mode: tuning numbers and copy.
export const HUNT_TITLE = "Nađi Zagu";

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
  "Negde u Srbiji, u jednom od tužilaštava, Zaga čvrsto spava.",
  "Vas troje krećete u potragu. Vičite na tužilaštva i pratite hrkanje.",
];

// Where the snoring comes from, as "na <side>".
const COMPASS_PLACE: Record<Compass, string> = {
  east: "na istoku",
  "north-east": "na severoistoku",
  north: "na severu",
  "north-west": "na severozapadu",
  west: "na zapadu",
  "south-west": "na jugozapadu",
  south: "na jugu",
  "south-east": "na jugoistoku",
};

export const HINT_NEAR = "Sasvim blizu! Zzz...";
export const hintMid = (direction: Compass) => `Zzz... hrkanje ${COMPASS_PLACE[direction]}, nedaleko.`;
export const hintFar = (direction: Compass) => `Zzz... hrkanje ${COMPASS_PLACE[direction]}, daleko.`;

export const huntHud = (round: number, rounds: number, visits: number) => `Runda ${round}/${rounds}  Posete ${visits}`;

export const HUNT_ENDING_LINE = "Zaga je budna!";
// "Broj poseta: N" avoids Serbian plural forms of "poseta".
export const foundIn = (visits: number) => `Broj poseta: ${visits}`;

export const FOUND_LINE = "Evo je, čvrsto spava u kancelariji!";
export const CAUGHT_LINE = "Opet smo je našli - i dalje spava!";
export const SLEEPWALK_LINE = "Mesečareći odlazi u drugo tužilaštvo. Za njom!";

export type TalkChoice = { shout: string; reply: string };

// The talk once she is found: each round the crowd picks one shout and she
// answers it, a little more awake each round. Shouts fit one dialog line.
export const TALK_ROUNDS: readonly (readonly TalkChoice[])[] = [
  [
    { shout: "Budite se, na posao!", reply: "Mmm... još pet minuta..." },
    { shout: "Novinari su ispred!", reply: "Recite im da sam na sastanku... zzz" },
    { shout: "Predmeti se gomilaju!", reply: "Neka se gomilaju... gomila je mekana..." },
  ],
  [
    { shout: "Dve godine bez odgovora!", reply: "Ko to viče? Nije još ni podne..." },
    { shout: "Građani čekaju!", reply: "Čekanje izgrađuje karakter... zzz" },
    { shout: "Doneli smo kafu!", reply: "Kafa...? Ne... prerano je..." },
  ],
  [
    { shout: "Ne idemo odavde!", reply: "Dobro, dobro... ustajem!" },
    { shout: "Cela zemlja vas gleda!", reply: "Cela zemlja? ...I televizija?!" },
    { shout: "Budite se, na posao!", reply: "Dobro! Budna sam! Budna sam!" },
  ],
];
