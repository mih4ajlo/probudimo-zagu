import { getOffice } from "./offices";

// Who prosecutes where: municipality → OJT → VJT → AJT.
// Source: docs/research/nadleznost.md §2 (Zakon o sedištima i područjima sudova
// i javnih tužilaštava; ZJT čl. 13 i 26). Treće OJT u Beogradu keeps Zemun and
// Surčin until Četvrto OJT starts on 1. 3. 2027.

// Why a file moves on: level (OJT ↔ its own VJT), area (same level, other office),
// tok (the file goes to TOK, e.g. the Supreme prosecutor hands it over, ZJT čl. 21
// st. 2, or TOK hands back what is not its own).
export type HopReason = "level" | "area" | "tok";

export const TOK_ID = "javno-tuzilastvo-za-organizovani-kriminal";

type Area = { vjt: string; municipalities: readonly string[] };

const area = (vjt: string, ...municipalities: string[]): Area => ({ vjt, municipalities });

export const OJT_AREAS: Readonly<Record<string, Area>> = {
  // AJT Beograd
  "prvo-ojt-u-beogradu": area("vjt-u-beogradu", "Vračar", "Zvezdara", "Palilula", "Savski venac", "Stari grad"),
  "drugo-ojt-u-beogradu": area("vjt-u-beogradu", "Voždovac", "Grocka", "Rakovica", "Čukarica"),
  "trece-ojt-u-beogradu": area("vjt-u-beogradu", "Novi Beograd", "Zemun", "Surčin"),
  "ojt-u-lazarevcu": area("vjt-u-beogradu", "Lazarevac"),
  "ojt-u-mladenovcu": area("vjt-u-beogradu", "Barajevo", "Mladenovac", "Sopot"),
  "ojt-u-obrenovcu": area("vjt-u-beogradu", "Obrenovac"),
  "ojt-u-valjevu": area("vjt-u-valjevu", "Valjevo", "Osečina"),
  "ojt-u-mionici": area("vjt-u-valjevu", "Ljig", "Mionica"),
  "ojt-u-ubu": area("vjt-u-valjevu", "Lajkovac", "Ub"),
  "ojt-u-pancevu": area("vjt-u-pancevu", "Pančevo", "Alibunar", "Kovačica", "Opovo"),
  "ojt-u-vrscu": area("vjt-u-pancevu", "Vršac", "Bela Crkva", "Plandište"),
  "ojt-u-smederevu": area("vjt-u-smederevu", "Smederevo", "Kovin"),
  "ojt-u-velikoj-plani": area("vjt-u-smederevu", "Velika Plana", "Smederevska Palanka"),
  // AJT Novi Sad
  "ojt-u-novom-sadu": area(
    "vjt-u-novom-sadu",
    "Novi Sad",
    "Bački Petrovac",
    "Beočin",
    "Žabalj",
    "Sremski Karlovci",
    "Temerin",
    "Titel",
  ),
  "ojt-u-backoj-palanci": area("vjt-u-novom-sadu", "Bač", "Bačka Palanka"),
  "ojt-u-zrenjaninu": area("vjt-u-zrenjaninu", "Zrenjanin", "Žitište", "Sečanj"),
  "ojt-u-beceju": area("vjt-u-zrenjaninu", "Bečej", "Novi Bečej"),
  "ojt-u-kikindi": area("vjt-u-zrenjaninu", "Kikinda", "Nova Crnja", "Novi Kneževac", "Čoka"),
  "ojt-u-somboru": area("vjt-u-somboru", "Sombor", "Apatin", "Odžaci"),
  "ojt-u-vrbasu": area("vjt-u-somboru", "Vrbas", "Kula", "Srbobran"),
  "ojt-u-sremskoj-mitrovici": area("vjt-u-sremskoj-mitrovici", "Sremska Mitrovica", "Šid"),
  "ojt-u-rumi": area("vjt-u-sremskoj-mitrovici", "Irig", "Pećinci", "Ruma"),
  "ojt-u-staroj-pazovi": area("vjt-u-sremskoj-mitrovici", "Inđija", "Stara Pazova"),
  "ojt-u-subotici": area("vjt-u-subotici", "Subotica", "Bačka Topola", "Mali Iđoš"),
  "ojt-u-senti": area("vjt-u-subotici", "Ada", "Kanjiža", "Senta"),
  "ojt-u-sapcu": area("vjt-u-sapcu", "Šabac", "Bogatić", "Vladimirci", "Koceljeva"),
  "ojt-u-loznici": area("vjt-u-sapcu", "Loznica", "Krupanj", "Ljubovija", "Mali Zvornik"),
  // AJT Kragujevac
  "ojt-u-kragujevcu": area("vjt-u-kragujevcu", "Kragujevac", "Batočina", "Knić", "Lapovo"),
  "ojt-u-arandjelovcu": area("vjt-u-kragujevcu", "Aranđelovac", "Rača", "Topola"),
  "ojt-u-jagodini": area("vjt-u-jagodini", "Jagodina", "Rekovac"),
  "ojt-u-despotovcu": area("vjt-u-jagodini", "Despotovac", "Svilajnac"),
  "ojt-u-paracinu": area("vjt-u-jagodini", "Paraćin", "Ćuprija"),
  "ojt-u-krusevcu": area("vjt-u-krusevcu", "Kruševac", "Varvarin", "Ćićevac"),
  "ojt-u-brusu": area("vjt-u-krusevcu", "Aleksandrovac", "Brus"),
  "ojt-u-trsteniku": area("vjt-u-krusevcu", "Trstenik"),
  "ojt-u-kraljevu": area("vjt-u-kraljevu", "Kraljevo", "Vrnjačka Banja"),
  "ojt-u-raskoj": area("vjt-u-kraljevu", "Raška"),
  "ojt-u-novom-pazaru": area("vjt-u-novom-pazaru", "Novi Pazar", "Tutin", "Sjenica"),
  "ojt-u-pozarevcu": area("vjt-u-pozarevcu", "Požarevac", "Žabari", "Kučevo", "Malo Crniće"),
  "ojt-u-velikom-gradistu": area("vjt-u-pozarevcu", "Veliko Gradište", "Golubac"),
  "ojt-u-petrovcu-na-mlavi": area("vjt-u-pozarevcu", "Petrovac na Mlavi", "Žagubica"),
  "ojt-u-cacku": area("vjt-u-cacku", "Čačak", "Ivanjica", "Lučani"),
  "ojt-u-gornjem-milanovcu": area("vjt-u-cacku", "Gornji Milanovac"),
  "ojt-u-uzicu": area("vjt-u-uzicu", "Užice", "Bajina Bašta", "Čajetina"),
  "ojt-u-pozegi": area("vjt-u-uzicu", "Arilje", "Kosjerić", "Požega"),
  "ojt-u-prijepolju": area("vjt-u-uzicu", "Prijepolje", "Nova Varoš", "Priboj"),
  // AJT Niš
  "ojt-u-nisu": area("vjt-u-nisu", "Niš", "Gadžin Han", "Doljevac", "Svrljig"),
  "ojt-u-aleksincu": area("vjt-u-nisu", "Aleksinac", "Ražanj", "Sokobanja"),
  "ojt-u-leskovcu": area("vjt-u-leskovcu", "Leskovac", "Vlasotince", "Crna Trava"),
  "ojt-u-lebanu": area("vjt-u-leskovcu", "Bojnik", "Lebane", "Medveđa"),
  "ojt-u-vranju": area("vjt-u-vranju", "Vranje", "Trgovište", "Bujanovac", "Preševo"),
  "ojt-u-vladicinom-hanu": area("vjt-u-vranju", "Bosilegrad", "Vladičin Han", "Surdulica"),
  "ojt-u-prokuplju": area("vjt-u-prokuplju", "Prokuplje", "Žitorađa", "Merošina"),
  "ojt-u-kursumliji": area("vjt-u-prokuplju", "Blace", "Kuršumlija"),
  "ojt-u-pirotu": area("vjt-u-pirotu", "Pirot", "Babušnica", "Bela Palanka", "Dimitrovgrad"),
  "ojt-u-zajecaru": area("vjt-u-zajecaru", "Zaječar", "Boljevac", "Knjaževac"),
  "ojt-u-boru": area("vjt-u-zajecaru", "Bor"),
  "ojt-u-negotinu": area("vjt-u-negotinu", "Negotin", "Kladovo", "Majdanpek"),
};

export const VJT_AJT: Readonly<Record<string, string>> = {
  "vjt-u-beogradu": "ajt-u-beogradu",
  "vjt-u-valjevu": "ajt-u-beogradu",
  "vjt-u-pancevu": "ajt-u-beogradu",
  "vjt-u-smederevu": "ajt-u-beogradu",
  "vjt-u-novom-sadu": "ajt-u-novom-sadu",
  "vjt-u-zrenjaninu": "ajt-u-novom-sadu",
  "vjt-u-somboru": "ajt-u-novom-sadu",
  "vjt-u-sremskoj-mitrovici": "ajt-u-novom-sadu",
  "vjt-u-subotici": "ajt-u-novom-sadu",
  "vjt-u-sapcu": "ajt-u-novom-sadu",
  "vjt-u-kragujevcu": "ajt-u-kragujevcu",
  "vjt-u-jagodini": "ajt-u-kragujevcu",
  "vjt-u-krusevcu": "ajt-u-kragujevcu",
  "vjt-u-kraljevu": "ajt-u-kragujevcu",
  "vjt-u-novom-pazaru": "ajt-u-kragujevcu",
  "vjt-u-pozarevcu": "ajt-u-kragujevcu",
  "vjt-u-cacku": "ajt-u-kragujevcu",
  "vjt-u-uzicu": "ajt-u-kragujevcu",
  "vjt-u-nisu": "ajt-u-nisu",
  "vjt-u-leskovcu": "ajt-u-nisu",
  "vjt-u-vranju": "ajt-u-nisu",
  "vjt-u-prokuplju": "ajt-u-nisu",
  "vjt-u-pirotu": "ajt-u-nisu",
  "vjt-u-zajecaru": "ajt-u-nisu",
  "vjt-u-negotinu": "ajt-u-nisu",
};

export function legalHop(from: string, to: string, reason: HopReason): boolean {
  if (reason === "tok") {
    return (to === TOK_ID) !== (from === TOK_ID);
  }
  if (reason === "area") {
    const [a, b] = [getOffice(from), getOffice(to)];
    return a !== undefined && b !== undefined && from !== to && a.level === b.level;
  }
  return OJT_AREAS[from]?.vjt === to || OJT_AREAS[to]?.vjt === from;
}

// Shown when she walks into a VJT area, e.g. "Područje VJT u Šapcu; žalbe: AJT u Novom Sadu."
export function areaLine(vjtId: string): string {
  return `Područje ${getOffice(vjtId)?.name}; žalbe: ${getOffice(VJT_AJT[vjtId])?.name}.`;
}
