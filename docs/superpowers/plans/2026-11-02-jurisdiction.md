# Jurisdiction Maps and Teaching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put all 58 OJT on the map with their real areas, make case chains follow real jurisdiction, end Wake when the four cases are resolved, and teach the rules through a neutral narrator box in both modes.

**Architecture:** New Kaplay-free data (`src/data/jurisdiction.ts`, `src/data/facts.ts`) and pure logic (`src/area.ts`, `src/facts.ts`, `src/narrator.ts`) with Vitest coverage; scenes only wire them. The map view grows one UI piece (the narrator box) exposed through `MapTalk`.

**Tech Stack:** Kaplay 3001.0.19, TypeScript, Vite, Vitest, Playwright (smoke only), Python for `scripts/make-offices.py`.

**Spec:** `docs/superpowers/specs/2026-11-02-jurisdiction-design.md` (research: `docs/research/nadleznost.md`, `docs/research/slucajevi.md`)

## Global Constraints

- AGENTS.md: story, offices, map data and dialog live in `src/data/`; Vitest for logic, not Kaplay drawing; no extra frameworks; dialog still blocks movement; score still grants once per office.
- Offices after this plan: 1 VRHOVNO, 2 PJT, 4 AJT, 25 VJT, 58 OJT = **90**. "Posebno JT za visokotehnološki kriminal" is removed. No Četvrto OJT (from 1. 3. 2027).
- Every fact traces to a line in `nadleznost.md`; nothing marked **[proveriti]** there becomes a fact or a case hop until confirmed and the mark is removed in the research doc.
- Copy rules: no invented quotes of real people; no jokes about victims; no names of non-convicted suspects; facts read neutral, never as jokes.
- Text fit: facts and area lines ≤ **2** wrapped rows of **35** characters (284/8); splashes ≤ **5** rows; existing dialog lines ≤ 2 rows.
- Narrator line mode: `LINE_SECONDS = 6`; Wake idle fact after `IDLE_FACT_SECONDS = 20` of unblocked walking with no narration showing.
- Splash: once per game per hop reason (`level`, `area`, `tok`), right after that bounce's dialog closes; Wake only.
- Wake ends when every case is `working` or `expired`; office visits still score. Find Zaga hides her among all 90 offices.
- Repo files are LF. Version bump (v0.12.0) only at merge to main.

## Review Focus

1. Walking back and forth across an area border — the area line shows on each real change and never repeats while standing in one area (Task 3 test).
2. The fourth case expires while the player is walking (no visit) — the ending still comes after the `ZASTARELO!` line closes (Task 6 test on `casesResolved` after `tickCases`; scene wires `then: checkEnding`).
3. A new game after the ending — splashes show again and cases/narration start fresh (Task 6 session test).
4. Facts exhausted, or no fact matches the sleepwalk target — rotation reshuffles without showing the just-shown fact again, and `factFor` falls back to rotation (Task 5 tests).
5. A dialog opens while the narrator line is showing, or the player stands in dialog for long — the idle timer does not count blocked time, and the box never covers the dialog (Task 7 test for the timer; manual check for placement).

---

### Task 1: All 58 OJT on the map

**Files:**
- Modify: `assets/tuzilastva.csv` (add 31 OJT rows, remove the VTK row), `scripts/make-offices.py` only if the new rows need it
- Regenerate: `src/data/offices-list.ts` (`python scripts/make-offices.py`)
- Modify: `src/data/cities.ts`, `src/data/offices.test.ts`, `src/score.test.ts`, `src/officeLayout.test.ts`

**Interfaces:**
- Produces: `OFFICES` / `OFFICE_IDS` with 90 entries; ids follow the generator's slug, e.g. `ojt-u-rumi`, `ojt-u-vladicinom-hanu`, `trece-ojt-u-beogradu`.

New OJT (names as in the CSV style `OJT u <lokativ>`): Aleksincu, Aranđelovcu, Bečeju, Boru, Brusu, Velikom Gradištu, Vladičinom Hanu, Vranju, Gornjem Milanovcu, Despotovcu, Zaječaru, Zrenjaninu, Jagodini, Kikindi, Kraljevu, Kuršumliji, Lebanu, Negotinu, Novom Pazaru, Paraćinu, Petrovcu na Mlavi, Pirotu, Požarevcu, Požegi, Prijepolju, Prokuplju, Raškoj, Rumi, Sremskoj Mitrovici, Staroj Pazovi, Trsteniku. New cities for `CITIES` (real lon/lat of the town centre): Aleksinac, Aranđelovac, Bečej, Bor, Brus, Veliko Gradište, Vladičin Han, Gornji Milanovac, Despotovac, Kikinda, Kuršumlija, Lebane, Paraćin, Petrovac na Mlavi, Požega, Prijepolje, Raška, Ruma, Stara Pazova, Trstenik.

- [ ] **Step 1: Update tests first**

```ts
// offices.test.ts
it("has all 90 offices from the CSV with unique ids", ...)        // OFFICES length 90, unique ids 90
it("has 58 OJT, 25 VJT, 4 AJT, 2 PJT and 1 VRHOVNO", ...)
it("gives each office its level's points and a max score of 1330", ...) // maxScore() === 1330
it("has no cybercrime office (a VJT Beograd department since 2023)", ...) // no id contains "visokotehnoloski"
// score.test.ts: wakeMaxScore() === maxScore() + 50 * CASES.length
// officeLayout.test.ts (Review: cities close together)
it("keeps touch zones of offices in different cities apart", ...) // for every pair in different cities: distance >= 2 * TOUCH_RADIUS + WALK_GAP
```

- [ ] **Step 2: Run** `npx vitest run src/data/offices.test.ts src/officeLayout.test.ts src/score.test.ts` — Expected: FAIL (60 offices, 1060).
- [ ] **Step 3: Add the CSV rows and cities, remove the VTK row, run the generator.** If the new cross-city test fails for a pair (likely near Beograd, Novi Sad, Sremska Mitrovica), fix it in `officeLayout.ts` with the smallest change (e.g. smaller ring radius for that city) — not by moving towns.
- [ ] **Step 4: Run** `npm test` — Expected: all pass (geo tests confirm every new city is inside Serbia; layout tests confirm land).
- [ ] **Step 5: Commit** `feat: all 58 OJT on the map, cybercrime office removed`

### Task 2: Jurisdiction data

**Files:**
- Create: `src/data/jurisdiction.ts`, `src/data/jurisdiction.test.ts`

**Interfaces:**
- Consumes: office ids from Task 1.
- Produces:
  - `export type HopReason = "level" | "area" | "tok"`
  - `export const OJT_AREAS: Readonly<Record<string, { vjt: string; municipalities: readonly string[] }>>` (keys: OJT ids)
  - `export const VJT_AJT: Readonly<Record<string, string>>` (VJT id → AJT id)
  - `export const TOK_ID = "javno-tuzilastvo-za-organizovani-kriminal"`
  - `export function legalHop(from: string, to: string, reason: HopReason): boolean`

Rules for `legalHop`: `level` — one is an OJT and the other is that OJT's own VJT (either direction); `area` — both the same level, different ids; `tok` — `to === TOK_ID`. Data comes from `nadleznost.md` §2, Treće OJT Bgd = Novi Beograd, Zemun, Surčin.

- [ ] **Step 1: Write the failing tests**

```ts
it("maps all 58 OJT to an existing VJT", ...)          // keys = every OJT id in OFFICES; every vjt is a VJT id
it("gives every VJT an OJT and an AJT", ...)           // 25 VJT keys in VJT_AJT; each has ≥1 OJT
it("matches the law's AJT sizes", ...)                 // ajt-u-beogradu 4, ajt-u-novom-sadu 6, ajt-u-kragujevcu 8, ajt-u-nisu 7
it("puts VJT Šabac under AJT Novi Sad", ...)           // VJT_AJT["vjt-u-sapcu"] === "ajt-u-novom-sadu"
it("never gives a municipality to two OJT", ...)
it("lists municipalities for every OJT", ...)          // non-empty, trimmed
it("allows only real hops", ...)
// legalHop("ojt-u-novom-sadu","vjt-u-novom-sadu","level") true; reverse true
// legalHop("ojt-u-rumi","vjt-u-novom-sadu","level") false (Ruma is Sremska Mitrovica)
// legalHop("vjt-u-novom-sadu", TOK_ID, "tok") true; legalHop("vjt-u-novom-sadu","vjt-u-beogradu","area") true
// legalHop("ojt-u-nisu","vjt-u-beogradu","area") false
```

- [ ] **Step 2: Run** `npx vitest run src/data/jurisdiction.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Write `src/data/jurisdiction.ts`** with a source comment pointing at `nadleznost.md` §2 and the law.
- [ ] **Step 4: Run** the same — Expected: PASS.
- [ ] **Step 5: Commit** `feat: real OJT/VJT/AJT areas as data`

### Task 3: Area of a point

**Files:**
- Create: `src/area.ts`, `src/area.test.ts`, `src/textFit.ts` (moved helper)
- Modify: `src/data/jurisdiction.ts` (add `areaLine`), `src/data/jurisdiction.test.ts`, `src/data/cases.test.ts` (import the moved helper)

**Interfaces:**
- Consumes: `OJT_AREAS`, `VJT_AJT`, `getOffice`.
- Produces:
  - `export function vjtAreaAt(point: Point, seats: ReadonlyMap<string, Point>): string | null` — VJT of the nearest OJT seat (seats: OJT id → map point); null when `seats` is empty.
  - `export type AreaWatch = { current: string | null }`, `export function watchArea(state: AreaWatch, vjt: string | null): string | null` — returns the new VJT id only when it differs from `current` (and updates it), else null.
  - `src/textFit.ts`: `export const ROW_CHARS = 35`, `export function wrappedRows(text: string, width?: number): number` (moved unchanged from `src/data/cases.test.ts`).
  - `export function areaLine(vjtId: string): string` in `src/data/jurisdiction.ts` → `` `Područje ${vjtName}. Žalbe: ${ajtName}.` `` using office names, e.g. `Područje VJT u Šapcu. Žalbe: AJT u Novom Sadu.`

- [ ] **Step 0: Move `wrappedRows`** to `src/textFit.ts`; `src/data/cases.test.ts` imports it. Run `npx vitest run src/data/cases.test.ts` — PASS.
- [ ] **Step 1: Write the failing tests**

```ts
// seats built from project(CITIES[office.city]) for every OJT
it("finds the real VJT for towns away from borders", ...) // Ruma → vjt-u-sremskoj-mitrovici, Loznica → vjt-u-sapcu, Ub → vjt-u-valjevu, Niš → vjt-u-nisu
it("returns null with no seats", ...)
it("reports an area only when it changes", ...)          // watchArea: null→A returns A; A→A null; A→B B; B→A A (Review Focus 1)
it("names the area and its appeals office", ...)         // areaLine("vjt-u-sapcu") === "Područje VJT u Šapcu. Žalbe: AJT u Novom Sadu."
it("keeps every area line to two rows", ...)             // wrappedRows(areaLine(v)) <= 2 for all 25 VJT
```

- [ ] **Step 2: Run** `npx vitest run src/area.test.ts src/data/jurisdiction.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** (plain nearest-distance scan; no spatial index).
- [ ] **Step 4: Run** the same — Expected: PASS.
- [ ] **Step 5: Commit** `feat: which VJT area a point is in`

### Task 4: Case chains on real rules

**Files:**
- Modify: `src/data/cases.ts`, `src/data/cases.test.ts`, `src/cases.ts`, `src/cases.test.ts`, `docs/research/slucajevi.md`, `docs/research/nadleznost.md`

**Interfaces:**
- Consumes: `HopReason`, `legalHop`, `TOK_ID`.
- Produces: `CaseFile.reasons: readonly HopReason[]` (`reasons[i]` is the hop from `chain[i]` to `chain[i+1]`); `CaseVisit` kinds `pickup` and `bounce` gain `reason: HopReason`.

- [ ] **Step 0: Confirm the two open qualifications.** Search for the charged crime in Izbori 2023 (false voter signatures) and the Zvučni top case (and whether TOK held it). Record findings with sources in `slucajevi.md`; clear or keep the **[proveriti]** marks in `nadleznost.md` §3. Chains from the spec table; if a finding contradicts one, choose the chain the sources support and ledger a ruling.
- [ ] **Step 1: Write the failing tests**

```ts
// data/cases.test.ts
it("gives every hop a reason", ...)                 // reasons.length === chain.length - 1
it("follows real jurisdiction on every hop", ...)    // legalHop(chain[i], chain[i+1], reasons[i]) for all
it("keeps start offices unique", ...)                // existing test stays
// cases.test.ts (fixture gains reasons)
it("tells the scene why a file bounces", ...)        // pickup/bounce visits carry reasons[hop]
```

- [ ] **Step 2: Run** `npx vitest run src/data/cases.test.ts src/cases.test.ts` — Expected: FAIL.
- [ ] **Step 3: Update chains, reasons and bounce lines** (caricature tone, each naming the true reason; ≤ 2 rows). Update `OFFICE_LABEL` for new chain offices (`Treće OJT Bgd`, `OJT N. Sad` stays) so the HUD test still fits 38 chars. Keep `reality`/`asOf` unless a chain change makes one wrong.
- [ ] **Step 4: Run** `npm test` — Expected: all pass.
- [ ] **Step 5: Commit** `feat: case files bounce for real jurisdiction reasons`

### Task 5: Facts and splashes

**Files:**
- Create: `src/data/facts.ts`, `src/data/facts.test.ts`, `src/facts.ts`, `src/facts.test.ts`

**Interfaces:**
- Consumes: `wrappedRows` (Task 3), `HopReason`, `VJT_AJT` (Task 2).
- Produces:
  - `src/data/facts.ts`: `export type FactTopic = "level" | "area" | "special" | "oversight" | "conflict"`; `export type Fact = { id: string; text: string; topic: FactTopic; levels?: readonly OfficeLevel[]; vjt?: string }`; `export const FACTS: readonly Fact[]` (10–20 facts, each with a `// nadleznost.md §N` comment); `export const SPLASH: Readonly<Record<HopReason, string>>`.
  - `src/facts.ts`: `export type FactsState = { order: number[]; pos: number; last: string | null }`; `createFacts(facts?: readonly Fact[], rng?: Rng): FactsState`; `nextFact(state, facts?): Fact`; `factFor(state, target: { level: OfficeLevel; vjt: string | null }, facts?): Fact`.

- [ ] **Step 1: Write the failing tests**

```ts
// data/facts.test.ts
it("has 10 to 20 facts with unique ids", ...)
it("keeps every fact to two rows", ...)          // wrappedRows(text) <= 2
it("keeps every splash to five rows", ...)       // all three reasons present
it("points vjt facts at real VJT", ...)          // vjt in VJT_AJT
// facts.test.ts (fixture facts, fixed rng)
it("shows every fact once before repeating", ...)            // n calls → n distinct ids
it("never repeats the last fact across a reshuffle", ...)     // call n+1 !== call n (Review Focus 4)
it("prefers an unseen fact that matches the target", ...)     // level or vjt match
it("falls back to rotation when nothing matches", ...)        // (Review Focus 4)
```

- [ ] **Step 2: Run** `npx vitest run src/data/facts.test.ts src/facts.test.ts` — Expected: FAIL.
- [ ] **Step 3: Write the facts** from `nadleznost.md` §1, §2 and §4 drafts (neutral voice, no **[proveriti]** items), the three splashes, and the rotation logic.
- [ ] **Step 4: Run** `npm test` — Expected: all pass.
- [ ] **Step 5: Commit** `feat: sourced facts and splash texts`
- [ ] **Step 6: Copy checkpoint — stop and show the human** every new bounce line (Task 4), fact and splash, each with its source line. Apply their edits before Task 6.

### Task 6: Wake ends with the cases

**Files:**
- Modify: `src/cases.ts`, `src/cases.test.ts`, `src/session.ts`, `src/session.test.ts`, `src/data/story.ts`, `src/scenes/overworld.ts`, `src/scenes/ending.ts`

**Interfaces:**
- Produces: `export function casesResolved(state: CasesState): boolean` (every entry `working` or `expired`); `Session.taught: HopReason[]` (reset by `resetSession`); `visitedLine(visited: number, offices: number): string` in `src/data/story.ts` → `` `Posećeno: ${visited}/${offices}` ``.

- [ ] **Step 1: Write the failing tests**

```ts
it("is resolved only when every case is working or expired", ...) // 3 of 4 → false; 4th working → true
it("resolves when the last case expires on the road", ...)       // tickCases past dust → casesResolved true (Review Focus 2)
it("starts a new game with nothing taught", ...)                 // session: taught pushed, resetSession → [] (Review Focus 3)
it("formats the visited line", ...)                              // visitedLine(12, 90) === "Posećeno: 12/90"
```

- [ ] **Step 2: Run** `npx vitest run src/cases.test.ts src/session.test.ts src/data/copy.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement**; in `overworld.ts` `checkEnding` uses `casesResolved(cases)`; the expiry `say` gets `then: checkEnding`; ending page 0 adds `visitedLine` under the score. `isReadyForEnding` stays for any other caller; remove it only if unused (and its test with it).
- [ ] **Step 4: Run** `npm test` — Expected: all pass.
- [ ] **Step 5: Commit** `feat: Wake ends when all four cases are resolved`

### Task 7: Narrator box

**Files:**
- Create: `src/narrator.ts`, `src/narrator.test.ts`
- Modify: `src/scenes/mapView.ts`

**Interfaces:**
- Produces:
  - `src/narrator.ts`: `export const LINE_SECONDS = 6`, `export const IDLE_FACT_SECONDS = 20`; `export type NarratorState = { text: string | null; left: number | null; idle: number }`; `createNarrator()`; `narrate(state, text: string, seconds: number | null)` (`null` = hold until cleared); `clearNarration(state)`; `tickNarrator(state, dt: number, blocked: boolean): boolean` — counts the line timer down (hides at 0), and returns `true` once when `idle` reaches `IDLE_FACT_SECONDS` (then resets); `idle` advances only while not blocked and no text is showing.
  - `MapTalk` gains `narrate(text: string, seconds?: number | null): void` (default `LINE_SECONDS`), `clearNarration(): void`, `splash(text: string, then?: () => void): void` (narrator look, blocks movement like dialog, closes on Enter/tap).
  - `MapViewHooks.onFrame`'s `LeaderFrame` gains `idleFact: boolean` (the `tickNarrator` result for that frame).

- [ ] **Step 1: Write the failing tests**

```ts
it("hides a line after LINE_SECONDS", ...)
it("holds a line until cleared when seconds is null", ...)
it("asks for an idle fact after IDLE_FACT_SECONDS of free walking", ...)
it("does not count blocked time or time with a line showing", ...)   // (Review Focus 5)
it("replaces the current line with a new one", ...)
```

- [ ] **Step 2: Run** `npx vitest run src/narrator.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement `narrator.ts`, then the box in `mapView.ts`:** UI layer like the HUD; fill distinct from the dialog box, an "i" mark, width 300, placed under the HUD bar (moves with `hudBar.height`); splash reuses the dialog block/close flow with the narrator look. Never overlaps the dialog box.
- [ ] **Step 4: Run** `npm test` — Expected: all pass.
- [ ] **Step 5: Commit** `feat: narrator box on the map`

### Task 8: Teaching in Wake and Find Zaga

**Files:**
- Modify: `src/scenes/overworld.ts`, `src/scenes/hunt.ts`, `src/session.ts` (if a facts state per game is kept there)

**Interfaces:**
- Consumes: `vjtAreaAt`, `watchArea`, `areaLine`, `createFacts`, `nextFact`, `factFor`, `SPLASH`, `Session.taught`, `MapTalk.narrate/clearNarration/splash`, `LeaderFrame.idleFact`, `CaseVisit.reason`, `OJT_AREAS`.

- [ ] **Step 1: Wake wiring.** Seats = OJT office points from the layout. Each frame: `watchArea(..., vjtAreaAt(frame.pos, seats))` → `narrate(areaLine(v))`; `frame.idleFact` → `narrate(nextFact(facts).text)`. On a `pickup`/`bounce` visit whose `reason` is not in `session.taught`: push it, and in the dialog's `then` call `splash(SPLASH[reason], next)` before the existing continuation.
- [ ] **Step 2: Find Zaga wiring.** In `sleepwalk()`: `narrate(factFor(facts, { level, vjt }).text, null)` for the destination office (`vjt` = its own id for a VJT, its VJT for an OJT, else null); `clearNarration()` when she arrives. No splashes, no idle facts.
- [ ] **Step 3: Run** `npm test`, `npx playwright test -c .superpowers/pw.config.ts`, `npm run build` — Expected: all pass.
- [ ] **Step 4: Manual check** (dev server on 5180, `.superpowers/manual-cases.mjs`): narrator box on phone-size and desktop viewports, the start area line, an area change on a walk Beograd → Šabac, one splash, an idle fact, a sleepwalk fact; no console errors.
- [ ] **Step 5: Commit** `feat: jurisdiction teaching in both modes`

### Task 9: Docs

**Files:**
- Modify: `docs/game-design.md` (90 offices, Wake end rule, narrator box, splashes, Find Zaga spinner, hideouts among 90), `docs/testing.md` (jurisdiction, area, facts, narrator, textFit)

- [ ] **Step 1: Update both docs.**
- [ ] **Step 2: Run** `npm test` — Expected: all pass.
- [ ] **Step 3: Commit** `docs: jurisdiction and teaching in game design and testing`
