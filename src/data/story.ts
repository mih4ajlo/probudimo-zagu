export const TITLE = "Probudimo Zagu";

export const WAKE_LINES: readonly string[] = [
  "Stara princeza otvara jedno oko.",
  "Glas sa vrata: Tužioci spavaju. Obiđi svako tužilaštvo u Srbiji i probudi ih.",
  "Uzdahne, stavi orden i ustane.",
];

export const ENDING_LINES: readonly string[] = [
  "Sva tužilaštva su budna.",
  "Zaga opet može da drema - posle čaja.",
];

// The princess shouts this with her hands in the air (E key, and on each office visit).
export const SHOUT_LINE = "Budite se, na posao!";

// Title menu: game modes and the scene each one starts.
export const MODES: readonly { scene: string; label: string }[] = [
  { scene: "wake", label: "Probudi tužilaštva" },
  { scene: "huntIntro", label: "Nađi Zagu" },
];

// Under the title's mode list.
export const MENU_HINT_TOUCH = "Dodirni igru";
export const MENU_HINT_KEYS = "Gore/Dole, pa Enter";

// Wake the offices: the HUD strip and the ending's score.
export const wakeHud = (score: number, maxScore: number, visited: number, offices: number) =>
  `Poeni ${score}/${maxScore}  Tužilaštva ${visited}/${offices}`;
export const scoreLine = (score: number, maxScore: number) => `Poeni ${score} / ${maxScore}`;

// Under both endings.
export const backToTitle = (touch: boolean) => (touch ? "Dodirni za meni" : "Enter za meni");
