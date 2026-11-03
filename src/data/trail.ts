// "Trag spisa": a made-up case file found page by page beside Zaga, then
// checked against the rules once she is awake. The case is invented (Dobro
// Polje does not exist); the rules are real, see docs/research/trag-spisa.md.

export type TrailStep = {
  id: string;
  // The prosecutor's instruction and the rumor of how it was done.
  order: string;
  trace: string;
  // Short reminder shown before the player calls the step.
  recap: string;
  lawful: boolean;
  cite: string;
  rule: string;
};

export const TRAIL_STEPS: readonly TrailStep[] = [
  {
    // ZKP čl. 158 st. 1 t. 1
    id: "stan",
    order: "Uputstvo: pretresti stan blagajnika opštine Dobro Polje.",
    trace: "Priča se: policija je ušla bez naredbe, otvorio im je komšija.",
    recap: "Stan: ušli bez naredbe suda, pustio ih komšija.",
    lawful: false,
    cite: "(ZKP čl. 158)",
    rule: "Bez naredbe, pristanak za ulazak daje držalac stana, ne komšija.",
  },
  {
    // ZKP čl. 147 i 152 st. 3
    id: "laptop",
    order: "Uputstvo: privremeno oduzeti laptop iz opštinske blagajne.",
    trace: "Kažu: laptop su oduzeli i odmah ga pregledali, bez naredbe.",
    recap: "Laptop: oduzet i odmah pregledan, bez naredbe suda.",
    lawful: false,
    cite: "(ZKP čl. 152)",
    rule: "Laptop sme da se oduzme, ali pregled uređaja traži naredbu suda.",
  },
  {
    // ZKP čl. 289
    id: "iskaz",
    order: "Uputstvo: saslušati blagajnika kao osumnjičenog.",
    trace: "Navodno: iskaz je dao uz branioca, pošto je poučen o pravima.",
    recap: "Iskaz: dat policiji uz branioca, posle pouke o pravima.",
    lawful: true,
    cite: "(ZKP čl. 289)",
    rule: "Iskaz dat uz branioca, posle pouke, sme da se koristi.",
  },
];

export const pageLine = (n: number, total: number) => `List spisa ${n}/${total}.`;
export const RIGHT = "Tačno.";
export const WRONG = "Netačno.";

export const CHECK_INTRO = "Zaga uzima spis i proverava ga, korak po korak.";
export const CHECK_CHOICES: readonly string[] = ["Po propisu", "Nije po propisu"];
// ZKP čl. 16 i 84
export const CHECK_CLOSE = "Nezakonit dokaz se izdvaja iz spisa i ne koristi se. (ZKP čl. 84)";
export const checkedLine = (right: number, total: number) => `Tačne procene: ${right}/${total}`;
