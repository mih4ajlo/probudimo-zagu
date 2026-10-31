# Case files ("Ping-pong nadležnosti") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In Wake the offices, real stalled cases become files that offices bounce to each other; the player carries each to its last office, picks the right demand before dust runs out, and the ending reports each case with a sourced "U stvarnosti" line.

**Architecture:** Copy and case data in `src/data/cases.ts`; all rules in a Kaplay-free `src/cases.ts` (state, visits, answers, dust, marks, report) with Vitest coverage; `score.ts` grants case points once. Scenes stay thin: `overworld.ts` wires the module into the existing `onVisit` / `onFrame` hooks, `mapView.ts` draws two new marks, a carried folder and a two-line HUD, `ending.ts` pages through the report.

**Tech Stack:** Kaplay 3001.0.19, TypeScript, Vite, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-31-case-files-design.md` (research: `docs/research/slucajevi.md`)

## Global Constraints

- Branch `feat/case-files`. No version bump on this branch (AGENTS.md: bump only when merging to `main`). No push.
- No new frameworks or dependencies.
- Copy lives in `src/data/`; scenes import it. Serbian Latin script.
- Cases are named by event and institution, never by a suspect. No quote is put in a real person's mouth. No joke about victims; Nadstrešnica lines are about delay only.
- Every "U stvarnosti" line comes from a research card, carries its date, and lists its sources (comment per case in `src/data/cases.ts`). Nothing marked **[proveriti]** ships.
- A chain hop with no real route is a caricature and must read as a joke.
- `CASE_POINTS = 50`, `DUST_SECONDS = 300`. Dust counts only frames with no dialog open.
- The v1 loop is unchanged: office points once each; the ending comes when every office is visited.
- Crowd/Find Zaga: untouched in this plan.
- Repo files are LF. After any edit by a Python or Windows tool run `sed -i 's/\r$//' <file>` and check `git ls-files --eol`.
- Port 5173 is the user's dev server — never start or kill anything on it. E2E runs with `npx playwright test -c .superpowers/pw.config.ts` (port 5181).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A wrong demand on a 2-office chain (Izbori: target falls back to the start office) — visiting the start office again must bounce it forward, not offer a new pickup or `busy`. Test in Task 3.
2. A carried file that expires — the crowd carries nothing afterwards and can pick up another file. Test in Task 3.
3. A new game after the ending — cases start fresh (start dust, all waiting, nothing carried). Test in Task 4.
4. The second HUD line with the longest chain office label — fits one 320-unit line (≤ 40 chars). Test in Task 2.
5. Visiting an office that is both a case office and not yet visited — the office points are still granted exactly once, independent of the case. Test in Task 4.

---

### Task 1: Fact-check round (research, no code)

**Files:**
- Modify: `docs/research/slucajevi.md`

**Interfaces:**
- Produces: for each kept case, a card section `- **U stvarnosti (za igru):**` with 1–2 sentences (≤ 140 characters total), `stanje: <mesec god.>`, and ≥ 1 source link; a line `## Konačan izbor za v0.11` listing the kept case ids.

- [ ] **Step 1: Research the open questions for the spec's cases** (WebSearch, standard then extended if thin): (a) Nadstrešnica — trial date at Viši sud Novi Sad; status of the TOK corruption case; (b) Zvučni top — any decision in Prvo OJT predistraga after the VJT finding; (c) Izbori 2023 — outcome of the cases sent to Prvo OJT; (d) Napadi na studente — outcomes of the named Beograd and Novi Sad cases after Feb 2025, and whether the Novi Sad case was handled by OJT or VJT Novi Sad; (e) candidates Jovanjica (status Oct 2026) and KRIK findings without reaction (one concrete finding, dated). Use the source rules already in the doc (prefer N1, RSE, Vreme, Insajder, BIRN, CRTA, 021, official sites; mark biased sources).
- [ ] **Step 2: Update the cards.** Replace each answered **[proveriti]** with the finding and its source; add the `U stvarnosti (za igru)` line to every kept case; fix a chain hop if the research shows a different real route (then mark the change in the card).
- [ ] **Step 3: Decide the final set** under `## Konačan izbor za v0.11`. Keep the spec's 4 cases unless one cannot be stated with a source (then drop it). Add a candidate only if its card has no **[proveriti]** left. 4–6 cases.

Expected: `grep -n "proveriti" docs/research/slucajevi.md` shows no hit inside a kept card.

- [ ] **Step 4: Commit**

```bash
git add docs/research/slucajevi.md
git commit -m "docs: second fact-check round for case files"
```

---

### Task 2: Case data and copy

**Files:**
- Create: `src/data/cases.ts`
- Test: `src/data/cases.test.ts`

**Interfaces:**
- Consumes: Task 1's final set and reality lines; `OFFICE_IDS` from `src/data/offices.ts`; `MAX_SHOUT_CHARS` (33) from `src/talk.ts`.
- Produces:

```ts
export type CaseResult = "working" | "expired" | "untouched";
export type CaseFile = {
  id: string;
  title: string;                       // ≤ 20 chars
  chain: readonly string[];            // office ids, ≥ 2, chain[0] = start
  bounces: readonly string[];          // length chain.length - 1; bounces[i] is said at chain[i] and names chain[i+1]
  ask: string;                         // said at the last office before the demands
  demands: readonly [string, string, string];
  right: 0 | 1 | 2;
  done: string;                        // said with WORKING_LINE when the right demand is picked
  reality: readonly string[];          // from the research card
  asOf: string;                        // e.g. "okt. 2026"
  startDust: number;                   // 0 ≤ x < 1
};
export const CASES: readonly CaseFile[];
export const CASE_POINTS = 50;
export const DUST_SECONDS = 300;
export const OFFICE_LABEL: Readonly<Record<string, string>>; // short HUD name per chain office id, e.g. "TOK", "VJT Beograd", "Prvo OJT Bgd"
export const BUSY_LINE = "Prvo završite taj predmet!";
export const RETURNED_LINE = "Vraćeno na dopunu.";
export const WORKING_LINE = "U RADU!";
export const RESULT_LABEL: Readonly<Record<CaseResult, string>>; // "U RADU" | "ZASTARELO" | "NIJE POKRENUTO"
export const carryHud: (title: string, officeId: string) => string;   // `Nosiš: ${title} -> ${OFFICE_LABEL[id]}`
export const expiredLine: (title: string) => string;                 // `${title}: ZASTARELO!`
export const reportPage: (title: string, result: CaseResult, reality: readonly string[], asOf: string) => string;
// `${title}\n${RESULT_LABEL[result]}\n\nU stvarnosti:\n${reality.join(" ")}\n(stanje: ${asOf})`
export const nextPage: (touch: boolean) => string;                   // "Dodirni dalje" / "Enter dalje"
```

Use `->`, not `→` (the pixel font has no arrow glyph). Chain office ids for the spec's cases: `vjt-u-novom-sadu`, `vjt-u-beogradu`, `javno-tuzilastvo-za-organizovani-kriminal`, `prvo-ojt-u-beogradu`, `ojt-u-novom-sadu`. Each case gets a comment listing its source URLs. Spec's start dust: nadstresnica 0.3, zvucni-top 0.1, izbori-2023 0.5, napadi-studenti 0.2, jovanjica 0.7.

- [ ] **Step 1: Write the failing data tests** in `src/data/cases.test.ts`:

```ts
it("uses real office ids, at least 2 per chain", ...)        // every chain id in OFFICE_IDS; chain.length >= 2
it("has one bounce line per hop", ...)                      // bounces.length === chain.length - 1
it("offers 3 demands that fit one choice line", ...)        // each `> ${d}`.length <= MAX_SHOUT_CHARS + 2; right in 0..2
it("keeps other lines to two dialog lines", ...)            // bounces, ask, done, BUSY_LINE, RETURNED_LINE, expiredLine(title) <= 66 chars
it("starts every case at a different office", ...)          // chain[0] unique across CASES
it("has a dated reality line for every case", ...)          // reality.length >= 1, every line non-empty, asOf non-empty
it("starts dust between 0 and 1", ...)                      // 0 <= startDust < 1
it("labels every chain office for the HUD and fits one line", ...) // OFFICE_LABEL[id] defined; carryHud(title, id).length <= 40 for every case × chain id (Review Focus 4)
it("formats a report page with result and date", ...)       // reportPage("X","expired",["a","b"],"okt. 2026") === "X\nZASTARELO\n\nU stvarnosti:\na b\n(stanje: okt. 2026)"
it("says how to turn the page for keys and touch", ...)     // nextPage(false) === "Enter dalje"; nextPage(true) === "Dodirni dalje"
it("has between 4 and 6 cases with unique ids", ...)
```

- [ ] **Step 2: Run** `npx vitest run src/data/cases.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Write `src/data/cases.ts`** with the interfaces above, Task 1's final cases and reality lines, and caricature bounce/ask/demand/done lines following the Global Constraints. Example tone: bounce `Nismo nadležni! Nosite to u TOK.`; wrong demands are plausible but off-target (e.g. asking for a press release), the right one names the real missing step (e.g. `Zakažite suđenje!`).
- [ ] **Step 4: Run** `npx vitest run src/data/cases.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/data/cases.ts src/data/cases.test.ts
git commit -m "feat: case file data and copy"
```

- [ ] **Step 6: HUMAN CHECKPOINT — copy review.** Stop. Show the user every case: title, chain, bounce lines, ask, demands (mark the right one), done line, reality line with sources. The user asked to review dialog before it goes into the game. Apply their edits (re-run Step 4, commit `fix: case copy from review`) before Task 3.

---

### Task 3: Case rules

**Files:**
- Create: `src/cases.ts`
- Test: `src/cases.test.ts`

**Interfaces:**
- Consumes: `CaseFile`, `CaseResult`, `CASES`, `DUST_SECONDS`, `BUSY_LINE`, `RETURNED_LINE`, `WORKING_LINE` from Task 2.
- Produces:

```ts
export type CaseStatus = "waiting" | "carried" | "working" | "expired";
export type CaseEntry = { file: CaseFile; status: CaseStatus; hop: number; dust: number };
// hop = index in file.chain of the target office while carried (0 while waiting).
export type CasesState = { entries: CaseEntry[]; asking: string | null };
export type CaseVisit =
  | { kind: "none" }
  | { kind: "busy"; line: string }
  | { kind: "pickup" | "bounce"; caseId: string; line: string; next: string }
  | { kind: "ask"; caseId: string; ask: string; demands: readonly string[] };
export type CaseAnswer =
  | { kind: "working"; caseId: string; lines: readonly string[] }      // [WORKING_LINE, file.done]
  | { kind: "returned"; caseId: string; lines: readonly string[]; next: string }; // [RETURNED_LINE]
export type CaseMark = { kind: "folder"; dust: number } | { kind: "target" } | null;

export function createCases(files?: readonly CaseFile[]): CasesState;   // default CASES; status waiting, hop 0, dust = startDust
export function carriedCase(state: CasesState): CaseEntry | null;
export function visitForCases(state: CasesState, officeId: string): CaseVisit;
export function answerCase(state: CasesState, index: number): CaseAnswer | null;
export function tickCases(state: CasesState, dt: number): CaseEntry[]; // entries that expired this tick
export function caseMark(state: CasesState, officeId: string): CaseMark;
export function caseReport(state: CasesState): { title: string; result: CaseResult; reality: readonly string[]; asOf: string }[];
```

Rules (the algorithm the tests pin):
- `visitForCases`, in this order: (1) a carried case whose `chain[hop]` is this office: if `hop` is the last index → set `asking`, return `ask`; else return `bounce` with `bounces[hop]`, `next = chain[hop + 1]`, and `hop += 1`. (2) Something is carried and a waiting case starts here → `busy` with `BUSY_LINE`. (3) Nothing carried and a waiting case starts here → status `carried`, return `pickup` with `bounces[0]`, `next = chain[1]`, `hop = 1`. (4) Otherwise `none`.
- `answerCase` returns `null` unless `asking` is set (and the index is 0–2). Right index → status `working`. Wrong → `hop -= 1`, `next = chain[hop]`. Both clear `asking`.
- `tickCases` adds `dt / DUST_SECONDS` to waiting and carried entries; at ≥ 1 sets `dust = 1`, status `expired`, clears `asking` if it was that case.
- `caseMark`: waiting or expired case starting here → `folder` with its dust (expired = 1); carried case whose `chain[hop]` is here → `target`; else `null`.
- `caseReport`: working → `"working"`, expired → `"expired"`, waiting/carried → `"untouched"`, in `CASES` order.

Tests use a local two-case fixture (`CaseFile[]` with fake ids `a`, `b`, `c` offices — the module never checks ids) plus one test on the real `CASES` default.

- [ ] **Step 1: Write the failing tests** in `src/cases.test.ts`:

```ts
it("starts every case waiting at its start office with its start dust", ...)
it("picks up a file only at its start office", ...)            // visit chain[1] first → none; chain[0] → pickup, next chain[1]
it("carries one file at a time", ...)                           // carrying A, visit B's start → busy with BUSY_LINE; B still waiting
it("bounces along the chain in order", ...)                     // 3-office chain: pickup → bounce at chain[1] names chain[2] → ask at chain[2]
it("ignores offices off the chain while carrying", ...)        // none; hop unchanged
it("puts the case to work on the right demand", ...)            // status working; lines [WORKING_LINE, done]; carriedCase null; asking null
it("sends the file back one hop on a wrong demand", ...)        // returned, next = chain[last-1]; visiting chain[last-1] → bounce, then ask again
it("bounces from the start office after a wrong demand on a 2-office chain", ...) // Review Focus 1: chain [a,b]; wrong → next a; visit a → bounce (not pickup/busy); visit b → ask
it("ignores answers when nothing is asked", ...)                // answerCase → null; and index 3 → null while asking
it("adds dust over time and expires at 1", ...)                 // startDust 0.5, tick DUST_SECONDS/2 → expired, dust 1, returned in the tick result
it("adds no dust when dt is 0 or the case is working", ...)
it("drops an expired carried file so another can be picked up", ...) // Review Focus 2
it("marks folders, the target and expired files", ...)
it("reports every case with its result", ...)                    // working / expired / untouched
it("uses the real cases by default", ...)                        // createCases().entries.length === CASES.length
```

- [ ] **Step 2: Run** `npx vitest run src/cases.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement `src/cases.ts`** per the Interfaces and Rules above.
- [ ] **Step 4: Run** `npx vitest run src/cases.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/cases.ts src/cases.test.ts
git commit -m "feat: case file rules (pickup, bounce, demand, dust)"
```

---

### Task 4: Score and session

**Files:**
- Modify: `src/score.ts`, `src/session.ts`
- Test: `src/score.test.ts`, `src/session.test.ts`

**Interfaces:**
- Consumes: `CASE_POINTS`, `CASES` (Task 2); `createCases`, `CasesState`, `visitForCases` (Task 3); `maxScore` from `src/data/offices.ts` (stays 1060).
- Produces:

```ts
// score.ts
export type ScoreState = { total: number; visited: string[]; cases: string[] };
export function grantCase(state: ScoreState, caseId: string): { granted: number }; // CASE_POINTS once per id
export function wakeMaxScore(): number;                                           // maxScore() + CASE_POINTS * CASES.length
// session.ts
export type Session = { score: ScoreState; hunt: HuntResult | null; cases: CasesState };
```

- [ ] **Step 1: Write the failing tests**:

```ts
// score.test.ts
it("grants case points only once per case", ...)          // 50 then 0; total 50; cases ["x"]
it("adds case points to the wake max score", ...)         // wakeMaxScore() === 1060 + 50 * CASES.length
it("grants office points once even on a case office", ...) // Review Focus 5: visitForCases + visitOffice on "vjt-u-novom-sadu" → 20 then 0
// session.test.ts — update "starts a fresh score of 0 on reset" to toEqual({ total: 0, visited: [], cases: [] })
it("starts fresh cases on reset", ...)                    // Review Focus 3: pick up a case, reset → every entry waiting, dust = startDust, carriedCase null
```

- [ ] **Step 2: Run** `npx vitest run src/score.test.ts src/session.test.ts` — Expected: FAIL (`grantCase` / `wakeMaxScore` not exported; session has no `cases`).
- [ ] **Step 3: Implement** in `src/score.ts` and `src/session.ts` (`resetSession` builds `createCases()`).
- [ ] **Step 4: Run** `npm test` — Expected: all pass.
- [ ] **Step 5: Commit**

```bash
git add src/score.ts src/score.test.ts src/session.ts src/session.test.ts
git commit -m "feat: case points and fresh cases per game"
```

---

### Task 5: Map view and Wake mode wiring

**Files:**
- Modify: `src/scenes/mapView.ts`, `src/scenes/overworld.ts`

**Interfaces:**
- Consumes: Task 3 (`visitForCases`, `answerCase`, `tickCases`, `caseMark`, `carriedCase`, `CaseMark`), Task 4 (`grantCase`, `wakeMaxScore`, `session.cases`), Task 2 copy (`carryHud`, `expiredLine`).
- Produces (mapView):

```ts
export type LeaderFrame = { pos: Point; anim: PrincessAnim; facing: Facing; blocked: boolean };
export type MapViewHooks = {
  // ...existing fields...
  caseMark?: (id: string) => CaseMark;  // drawn above the office, after officeMark
  carrying?: () => boolean;             // draws a folder above the leader
};
```

Drawing is not unit-tested (docs/testing.md); rules are already covered in Task 3.

- [ ] **Step 1: mapView.** `hudText` may contain `\n`: set the HUD bar height to `4 + 12 × lines`. Pass `blocked` in `onFrame`. Draw `caseMark`: `folder` = small rect (≈ 7×5 units) above the roof, color lerped from yellow `(240, 200, 80)` at dust 0 to grey `(140, 140, 140)` at dust 1, with the map's ink outline; `target` = a ring around the office whose radius pulses with `k.time()`. Draw a yellow folder above the leader's head when `carrying()` is true.
- [ ] **Step 2: overworld.** HUD: `wakeHud(total, wakeMaxScore(), visited, offices)` plus `"\n" + carryHud(title, chain[hop])` while a case is carried. `onVisit`: grant office points as now; `visitForCases`; `say` the office lines plus the case `line` (pickup/bounce/busy) or `ask` (ask kind), with `shoutFirst`; for `ask`, after the lines `talk.ask(demands, i => …)` → `answerCase`; on `working` call `grantCase`; `say` the answer's `lines`. Run the existing "every office visited → ending" check after the last dialog of the visit. `onFrame`: `tickCases(session.cases, frame.blocked ? 0 : k.dt())`; for each expired entry `say([expiredLine(title)])`. Pass `caseMark` and `carrying`.
- [ ] **Step 3: Run** `npm test` and `npm run build` — Expected: all pass; build succeeds with no type errors.
- [ ] **Step 4: Manual check.** Start `npx vite --port 5180` and adapt `.superpowers/manual.mjs` (headless Playwright, keyboard input): start Wake mode, screenshot the map at Beograd zoom (folders on VJT Beograd and Prvo OJT, yellow). Walk with arrow keys to the nearest case office and screenshot the bounce line and the two-line HUD. Save screenshots in the scratchpad. Expected: folder marks visible, HUD second line readable, no console error. Stop the 5180 server afterwards.
- [ ] **Step 5: Commit**

```bash
git add src/scenes/mapView.ts src/scenes/overworld.ts
git commit -m "feat: case files on the Wake map"
```

---

### Task 6: Ending report pages

**Files:**
- Modify: `src/scenes/ending.ts`

**Interfaces:**
- Consumes: `caseReport` (Task 3); `reportPage`, `nextPage` (Task 2); `wakeMaxScore` (Task 4); `backToTitle` (story.ts).

- [ ] **Step 1: Implement paging.** Page 0 is the current ending (title, `ENDING_LINES`, `scoreLine(total, wakeMaxScore())`). Pages 1..n are `reportPage(...)` for each `caseReport(session.cases)` entry, size 8, width 296, centered. The bottom hint is `nextPage(touch)` on every page but the last, `backToTitle(touch)` on the last. Enter and click advance; past the last page → `k.go("title")`.
- [ ] **Step 2: Run** `npm test` and `npm run build` — Expected: pass.
- [ ] **Step 3: Manual check.** In the 5180 dev server, from the browser console or the headless script, run `k.go("ending")` after a fresh session (all cases `NIJE POKRENUTO`) and screenshot every page. Expected: the longest reality line fits inside 320×180 with the hint visible. If not, shorten the line in `src/data/cases.ts` (copy edit, re-run Task 2 tests).
- [ ] **Step 4: Commit**

```bash
git add src/scenes/ending.ts
git commit -m "feat: case report pages in the Wake ending"
```

---

### Task 7: Docs and full verification

**Files:**
- Modify: `docs/game-design.md`, `docs/testing.md`

- [ ] **Step 1: game-design.md.** Under Modes → Wake the offices, describe case files (pickup, bounce, one at a time, demand, `Vraćeno na dopunu`, dust over 300 s of play, `ZASTARELO`, report pages with "U stvarnosti"). In Rules, change "Dialog is linear" to "Dialog is linear, except the 3-option choices (Find Zaga talk, case demands)". Content: max score `1060 + 50 per case`.
- [ ] **Step 2: testing.md.** Add a **Cases** bullet (pickup at start only, one at a time, chain order, right/wrong demand, 2-office fallback, dust and expiry, marks, report, case points once, fresh on reset) and a **Case data** bullet (real ids, line lengths, unique starts, dated reality lines, HUD fits). Add `cases` to the colocated list.
- [ ] **Step 3: Run** `npm test`, `npx playwright test -c .superpowers/pw.config.ts`, `npm run build` — Expected: all unit tests pass, 2/2 e2e pass, build succeeds.
- [ ] **Step 4: Check line endings:** `git ls-files --eol src docs | grep -v "i/lf"` — Expected: no output.
- [ ] **Step 5: Commit**

```bash
git add docs/game-design.md docs/testing.md
git commit -m "docs: case files in game design and testing"
```

Merge to `main`, the v0.11.0 bump, the tag and any push happen only after the user says so.
