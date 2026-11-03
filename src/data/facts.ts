// What the narrator box teaches while she walks. Neutral voice, never a joke.
// Every fact names its line in docs/research/nadleznost.md; nothing marked
// [proveriti] there goes in until it is confirmed.
import type { HopReason } from "./jurisdiction";
import type { OfficeLevel } from "./offices";

export type FactTopic = "level" | "area" | "special" | "oversight" | "conflict" | "staff";

export type Fact = {
  id: string;
  text: string;
  topic: FactTopic;
  // Shown first when she heads to an office of one of these levels, or in this VJT area.
  levels?: readonly OfficeLevel[];
  vjt?: string;
};

export const FACTS: readonly Fact[] = [
  // §1, ZUS čl. 24 i 25
  { id: "do-10", text: "OJT goni dela do 10 godina zatvora. Teža dela idu u VJT.", topic: "level", levels: ["OJT"] },
  // §1, ZJT čl. 25, 34, 35
  {
    id: "prati-sud",
    text: "Tužilaštvo prati sud: OJT radi pred osnovnim, VJT pred višim.",
    topic: "level",
    levels: ["OJT", "VJT"],
  },
  // §1, ZUS čl. 25 st. 1 t. 1
  { id: "preko-10", text: "VJT goni dela za koja je propisano preko 10 godina zatvora.", topic: "level", levels: ["VJT"] },
  // §1, ZUS čl. 25 st. 1 t. 2
  { id: "mito", text: "Primanje mita i pranje novca idu u VJT, bez obzira na kaznu.", topic: "level", levels: ["VJT"] },
  // §1, ZUS čl. 25 st. 1 t. 2
  {
    id: "javni-skup",
    text: "Nasilničko ponašanje na javnom skupu uvek ide u VJT.",
    topic: "level",
    levels: ["VJT"],
  },
  // §1, ZUS čl. 25 st. 1 t. 3
  { id: "maloletnici", text: "Kad je okrivljeni maloletan, postupa VJT.", topic: "level", levels: ["VJT"] },
  // §1, ZJT čl. 32
  {
    id: "ajt",
    text: "AJT ne goni od početka: radi žalbe i usmerava VJT i OJT.",
    topic: "oversight",
    levels: ["AJT"],
  },
  // §1, ZJT čl. 34
  { id: "vjt-prati", text: "VJT prati i usmerava rad OJT sa svog područja.", topic: "oversight", levels: ["VJT", "OJT"] },
  // §1, ZJT čl. 36
  {
    id: "vrhovno-prenosi",
    text: "Kad nadležno ne može da postupa, Vrhovno JT predaje predmet drugom.",
    topic: "oversight",
    levels: ["VRHOVNO"],
  },
  // §1, ZJT čl. 21 st. 2
  {
    id: "tok-ovlascenje",
    text: "Vrhovni javni tužilac može da ovlasti TOK da preuzme predmet.",
    topic: "special",
    levels: ["PJT", "VRHOVNO"],
  },
  // §1, ZJT čl. 13
  {
    id: "cela-srbija",
    text: "Posebna tužilaštva su samo dva: TOK i za ratne zločine.",
    topic: "special",
    levels: ["PJT"],
  },
  // §1, ZJT čl. 27
  {
    id: "sukob",
    text: "Kad se dva tužilaštva prebacuju, odlučuje ono iznad oba.",
    topic: "conflict",
  },
  // §2, ZJT čl. 13 i 26
  { id: "podrucje", text: "Tužilaštvo goni na području svog suda: opština, OJT, VJT, AJT.", topic: "area" },
  // §2
  { id: "broj", text: "Srbija ima 58 OJT, 25 VJT i 4 AJT.", topic: "area" },
  // §2
  {
    id: "sabac",
    text: "VJT u Šapcu pripada AJT u Novom Sadu, iako Mačva nije Vojvodina.",
    topic: "area",
    vjt: "vjt-u-sapcu",
  },
  // §2
  {
    id: "trece-ojt",
    text: "Do 1. 3. 2027. Treće OJT Beograd pokriva i Zemun i Surčin.",
    topic: "area",
    vjt: "vjt-u-beogradu",
  },
  // §5, ZJT čl. 13
  { id: "skracenice", text: "OJT, VJT i AJT su osnovno, više i apelaciono javno tužilaštvo.", topic: "oversight" },
  // §5, ZJT čl. 13 i 15
  {
    id: "lestvica",
    text: "Iznad OJT je VJT, iznad VJT je AJT, a na vrhu je Vrhovno JT.",
    topic: "oversight",
    levels: ["OJT", "VJT", "AJT", "VRHOVNO"],
  },
  // §5, ZJT čl. 17
  {
    id: "uputstvo",
    text: "Viši glavni tužilac može nižem da izda obavezno uputstvo za predmet.",
    topic: "oversight",
    levels: ["VJT", "AJT"],
  },
  // §5, ZJT čl. 15
  {
    id: "glavni-i-tuzioci",
    text: "Tužilaštvo vodi glavni tužilac; javni tužioci odgovaraju njemu.",
    topic: "staff",
  },
  // §5, ZJT čl. 80
  { id: "bira-glavnog", text: "Glavnog javnog tužioca bira Visoki savet tužilaštva, na 6 godina.", topic: "staff" },
  // §5, ZJT čl. 62
  { id: "jednom", text: "Glavni tužilac ne može ponovo biti biran u istom tužilaštvu.", topic: "staff" },
  // §5, ZJT čl. 61 i 80
  { id: "stalna", text: "Javnog tužioca bira Visoki savet tužilaštva, na stalnu funkciju.", topic: "staff" },
  // §5, ZJT čl. 80
  {
    id: "vrhovni-bira",
    text: "Vrhovnog javnog tužioca bira Narodna skupština, na 6 godina.",
    topic: "staff",
    levels: ["VRHOVNO"],
  },
  // §5, ZJT čl. 82 t. 1
  {
    id: "staz-ojt",
    text: "Tužilac u OJT: 3 godine u struci posle pravosudnog ispita.",
    topic: "staff",
    levels: ["OJT"],
  },
  // §5, ZJT čl. 82
  {
    id: "staz-vise",
    text: "Tužilac u VJT: 6 godina staža, u AJT i TOK 9, u Vrhovnom 11.",
    topic: "staff",
    levels: ["VJT", "AJT", "PJT"],
  },
  // §5, ZJT čl. 82
  {
    id: "staz-glavni",
    text: "Glavnom tužiocu treba godina više: OJT 4, VJT 7, AJT 10, Vrhovni 12.",
    topic: "staff",
  },
];

// Shown once per game, after the first bounce of each kind.
export const SPLASH: Readonly<Record<HopReason, string>> = {
  // §1, ZUS čl. 24 i 25; ZJT čl. 25
  level:
    "OJT goni dela do 10 godina zatvora. Teža dela, i neka sa posebne liste (primanje mita, nasilničko ponašanje na javnom skupu), goni VJT.",
  // §2, ZJT čl. 26; §1, ZJT čl. 27
  area: "Svako tužilaštvo goni samo na području svog suda. Ako se dva tužilaštva ne slože, odlučuje ono iznad oba.",
  // §1, ZJT čl. 13 i 21 st. 2; slucajevi.md (Nadstrešnica, Zvučni top)
  tok: "TOK radi za celu Srbiju. Vrhovni javni tužilac može da ga ovlasti da preuzme predmet, a predmet koji nije njegov TOK vraća.",
};
