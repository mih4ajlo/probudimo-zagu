// Wake the offices: real stalled cases as files the offices bounce around.
// Research and sources: docs/research/slucajevi.md. Lines are caricature of
// the institutions' pace, but every bounce names the real reason the file moves
// (docs/research/nadleznost.md); only `reality` states facts, each with its date.
import type { HopReason } from "./jurisdiction";

export type CaseResult = "working" | "expired" | "untouched";

export type CaseFile = {
  id: string;
  title: string;
  // Office ids; chain[0] is where the file waits.
  chain: readonly string[];
  // bounces[i] is said at chain[i] and names chain[i + 1].
  bounces: readonly string[];
  // reasons[i] is why the file goes from chain[i] to chain[i + 1].
  reasons: readonly HopReason[];
  // Said at the last office before the demands.
  ask: string;
  demands: readonly [string, string, string];
  right: 0 | 1 | 2;
  // Said after WORKING_LINE when the right demand is picked.
  done: string;
  reality: readonly string[];
  asOf: string;
  startDust: number;
};

export const CASE_POINTS = 50;
// Play seconds (no dialog open) for dust to go from 0 to 1.
export const DUST_SECONDS = 300;

const TOK = "javno-tuzilastvo-za-organizovani-kriminal";

export const CASES: readonly CaseFile[] = [
  // Sources: 021.rs 449295 (15. 7. 2026), 021.rs 449677 (19. 7. 2026),
  // n1info.rs/vesti/sudjenje-nadstresnica-odlaganje-advokati/,
  // n1info.rs/vesti/vjt-dolovac-ovlastila-tok-da-postupa-u-slucaju-nadstresnica-...
  {
    id: "nadstresnica",
    title: "Nadstrešnica",
    chain: ["ojt-u-novom-sadu", "vjt-u-novom-sadu", TOK],
    bounces: [
      "Kazna preko 10 godina? Nismo mi. Nosite to u VJT.",
      "Deo o novcu Vrhovno JT dalo je TOK-u. Nosite tamo.",
    ],
    reasons: ["level", "tok"],
    ask: "TOK: Dobro, šta tačno tražite?",
    demands: ["Pošaljite saopštenje za medije!", "Podignite optužnicu za novac!", "Sačekajte još 20 meseci!"],
    right: 1,
    done: "TOK: Dobro, dobro... budni smo.",
    reality: ["Optužnica potvrđena posle 20 meseci.", "Suđenje nije počelo: čeka se Vrhovni sud."],
    asOf: "okt. 2026",
    startDust: 0.3,
  },
  // Sources: insajder.net/teme/jedina-istraga-o-mogucoj-upotrebi-zvucnog-topa-...,
  // n1info.rs/vesti/zvucni-top-istraga-tok/ (TOK returned the files to Prvo OJT),
  // 021.rs 446649 and 446727 (jun 2026, VJT Beograd)
  {
    id: "zvucni-top",
    title: "Zvučni top",
    chain: ["prvo-ojt-u-beogradu", TOK, "prvo-ojt-u-beogradu", "vjt-u-beogradu"],
    bounces: [
      "Prijave za terorizam? To je za TOK. Nosite tamo.",
      "Nije organizovani kriminal. Vratite to Prvom OJT.",
      "Opet vi? Teška dela su za VJT. Nosite tamo.",
    ],
    reasons: ["tok", "tok", "level"],
    ask: "VJT: Šta hoćete? Nema mesta gonjenju.",
    demands: ["Objavite obrazloženje!", "Proglasite sve simulacijom!", "Ugasite zvučnike!"],
    right: 0,
    done: "VJT: Obrazloženje... važi, pišemo.",
    reality: [
      "VJT: nema mesta gonjenju za zvučni top.",
      'Umesto toga sumnja na "simulaciju" i najavljuje gonjenje učesnika protesta.',
    ],
    asOf: "jun 2026",
    startDust: 0.1,
  },
  // Sources: crta.rs/wp-content/uploads/2025/06/Krivicne-prijave-koje-je-Crta-podnela-a-tuzilastvo-zanemarilo.pdf,
  // danas.rs/vesti/politika/izbori-2023/vise-javno-tuzilastvo-se-oglasilo-...,
  // n1info.rs/vesti/izbori-2023/crta-poziva-tuzilastva-da-hitno-istraze-... (VJT forwarded to Prvo OJT)
  {
    id: "izbori-2023",
    title: "Izbori 2023.",
    chain: ["vjt-u-beogradu", "prvo-ojt-u-beogradu"],
    bounces: ["Lažni potpisi? Do 10 godina, to je za Prvo OJT."],
    reasons: ["level"],
    ask: "Prvo OJT: Potpisi? Koji potpisi?",
    demands: ["Sačekajte sledeće izbore!", "Pošaljite pozivnice biračima!", "Ispitajte falsifikovane potpise!"],
    right: 2,
    done: "Prvo OJT: Dobro... otvaramo fioku iz 2024.",
    reality: ["Prijave za izbore 2023, i za falsifikovane potpise birača, i dalje su bez epiloga."],
    asOf: "jun 2025",
    startDust: 0.5,
  },
  // Sources: insajder.net/vesti/napad-na-studente-fdu-bez-epiloga-... (19. 3. 2026),
  // n1info.rs/vesti/napad-na-studente-fdu-i-dalje-bez-epiloga-... (10. 2. 2025).
  // FDU is on Novi Beograd (Treće OJT); VJT Beograd runs the case.
  {
    id: "napadi-studenti",
    title: "Napad na studente",
    chain: ["trece-ojt-u-beogradu", "vjt-u-beogradu"],
    bounces: ["Nasilje na javnom skupu? To je za VJT. Nosite tamo."],
    reasons: ["level"],
    ask: "VJT: Troje je priznalo. Šta još hoćete?",
    demands: ["Pogledajte snimke dogodine!", "Nađite ostale napadače!", "Zatvorite predmet, dosta je!"],
    right: 1,
    done: "VJT: Dobro... gledamo snimke.",
    reality: ["Napad na studente FDU: troje priznalo uz uslovne kazne.", "Ostali napadači i dalje nepoznati."],
    asOf: "mar. 2026",
    startDust: 0.2,
  },
];

// Short office names for the HUD line.
export const OFFICE_LABEL: Readonly<Record<string, string>> = {
  "vjt-u-novom-sadu": "VJT N. Sad",
  "vjt-u-beogradu": "VJT Bgd",
  [TOK]: "TOK",
  "prvo-ojt-u-beogradu": "Prvo OJT Bgd",
  "ojt-u-novom-sadu": "OJT N. Sad",
  "trece-ojt-u-beogradu": "3. OJT Bgd",
};

export const BUSY_LINE = "Prvo završite taj predmet!";
export const RETURNED_LINE = "Vraćeno na dopunu.";
export const WORKING_LINE = "U RADU!";

export const RESULT_LABEL: Readonly<Record<CaseResult, string>> = {
  working: "U RADU",
  expired: "ZASTARELO",
  untouched: "NIJE POKRENUTO",
};

export const carryHud = (title: string, officeId: string) => `Nosiš: ${title} -> ${OFFICE_LABEL[officeId]}`;
export const expiredLine = (title: string) => `${title}: ZASTARELO!`;
export const reportPage = (title: string, result: CaseResult, reality: readonly string[], asOf: string) =>
  `${title}\n${RESULT_LABEL[result]}\n\nU stvarnosti:\n${reality.join(" ")}\n(stanje: ${asOf})`;
export const nextPage = (touch: boolean) => (touch ? "Dodirni dalje" : "Enter dalje");
