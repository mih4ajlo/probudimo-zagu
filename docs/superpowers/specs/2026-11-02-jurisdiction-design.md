# Who is in charge — jurisdiction maps and teaching (v0.12.0)

Date: 2026-11-02. Research: `docs/research/nadleznost.md` (laws, areas,
sources) and `docs/research/slucajevi.md` (cases).

## Intent

The player should leave knowing one thing: **OJT prosecutes minor crimes,
VJT serious ones, each only in its own area.** The game teaches it two ways:

1. **Through play.** Case files bounce for real reasons ("too serious for
   us", "not our area", "the Supreme prosecutor handed it to TOK"), not
   random runaround. The joke stays the delay; the rules become true.
2. **In the empty time.** While walking (Wake) and while Zaga sleepwalks
   (Find Zaga), a neutral narrator box shows short, sourced facts.

## Goals

- All **58 OJT** on the map, each in its real place in the tree
  municipality → OJT → VJT → AJT.
- Case chains follow real jurisdiction; tests check every hop against the
  jurisdiction data.
- Wake ends when all four cases are resolved, not when every office is visited.
- A narrator box, visibly separate from dialog, in both modes.

## Non-goals

- Drawing area borders or municipalities on the map.
- Courts as places on the map.
- Kosovo and Metohija (special transitional regime in the law).
- Četvrto OJT u Beogradu (exists only from 1. 3. 2027; a later release adds it).
- The Find Zaga file trail ("Trag spisa"); it comes after this.
- Growing the crowd (stays 3).

## Anti-goals (a failure even if it works)

- A fact that reads like a joke, or a joke that reads like a fact.
- A wrong legal claim. Every fact traces to a line in `nadleznost.md`; items
  marked **[proveriti]** there do not become facts until confirmed.
- Teaching that nags: modal splashes that keep stopping the walk.
- Text that does not fit a phone (320×180 design area).
- Invented quotes of real people; jokes about victims; naming suspects who
  are not convicted (existing copy rules).

## Decisions (what the human decided)

- All 58 OJT on the map.
- Cases follow real jurisdiction.
- Wake ends after all four cases are resolved (each `working` or `expired`).
- Teaching appears as a text line or a splash; the map itself is unchanged.
- Facts also appear in Find Zaga, as a "spinner" while Zaga sleepwalks.
- Facts are spoken by a **neutral narrator box**, not by the crowd or Zaga.

- Find Zaga hides her among **all** offices on the map (90), accepting a
  longer search.

## Design

### 1. Offices (data)

- `assets/tuzilastva.csv` gets the 31 missing OJT (name, level, city; address
  and contacts may stay empty). `scripts/make-offices.py` regenerates
  `src/data/offices-list.ts` as today.
- **Remove "Posebno JT za visokotehnološki kriminal"**: under the 2023 law it
  is a department of VJT Beograd, not a prosecutor's office. (Claude's call,
  backed by the research; the fact about it can be a narrator line.)
- Result: 1 VRHOVNO, 2 PJT (TOK, ratni zločini), 4 AJT, 25 VJT, 58 OJT = **90**.
- `src/data/cities.ts` gets every new seat city with real coordinates
  (e.g. Lebane, Brus, Kuršumlija, Vladičin Han). Existing geo tests (inside
  Serbia, on land) cover them.
- Points per level stay (`LEVEL_POINTS`); max score grows with the count.
  Tests derive it, never hard-code it.
- Risk for the builder: new seats close to big rings (Stara Pazova and Inđija
  near Beograd/Novi Sad, Sremski places) must keep markers from overlapping
  across cities. Check with the existing layout code; add a test that no two
  office touch zones overlap if one does not exist.

### 2. Jurisdiction (data)

New `src/data/jurisdiction.ts`, typed, generated or hand-written from
`nadleznost.md` section 2:

- per OJT: its VJT id and its municipalities (display names);
- per VJT: its AJT id;
- TOK and war-crimes office: whole country.

Tests:
- exactly 58 OJT, 25 VJT, 4 AJT; every id exists in `OFFICES`;
- every VJT has at least one OJT; every OJT exactly one VJT;
- AJT sizes match the law: Beograd 4, Novi Sad 6, Kragujevac 8, Niš 7 VJT;
- VJT Šabac belongs to AJT Novi Sad (guards the surprising one);
- no municipality belongs to two OJT.

### 3. Areas while walking

The game has no municipality borders. **Claude's call:** the player's area is
the VJT of the **nearest OJT seat** to her feet (58 seats make this close to
the real map; it is never shown as a border, only named). A pure function
maps a point to a VJT id; tests pin a few cities to their real VJT
(Ruma → Sremska Mitrovica, Loznica → Šabac, Ub → Valjevo).

When the area changes, the narrator box shows the area line, e.g.
`Područje VJT u Šapcu. Žalbe: AJT Novi Sad.` It also shows once at the start.

Between area changes, after a stretch of walking with no dialog and no box
showing (start at 20 s; tune in play), Wake shows the next fact in line mode
(Claude's call: otherwise long walks inside one area teach nothing).

### 4. Case chains on real rules

`CaseFile` hops get a reason: `"level" | "area" | "tok"`.

- `level`: between an OJT and **its own** VJT (either direction: "too
  serious, go up" or "up to 10 years, go down").
- `area`: between two offices of the same level.
- `tok`: to TOK (ZJT čl. 21 st. 2 — the Supreme prosecutor hands it over).

A test validates every hop of every case against `jurisdiction.ts`. Bounce
lines stay caricature in tone but must name the true reason.

Proposed chains (builder confirms each against the research before copy):

| Case | Chain | Why |
|---|---|---|
| Nadstrešnica | OJT Novi Sad → VJT Novi Sad → TOK | 16 dead is over 10 years → VJT; corruption part handed to TOK (12. 2. 2025) |
| Napad na studente | Treće OJT Bgd → VJT Beograd | FDU is on Novi Beograd; violence at a public gathering is on the VJT list |
| Izbori 2023. | VJT Beograd → Prvo OJT Bgd | signatures are an OJT-level crime **[proveriti kvalifikaciju]** |
| Zvučni top | Prvo OJT Bgd → VJT Beograd (+ TOK if the research confirms TOK's role) | VJT decided "nema mesta gonjenju" |

Starting at the "wrong door" is allowed (the player brings it there); the
bounce is what must be legally right. Start offices stay unique.

The ending's `reality` lines and dates stay as in v0.11 unless the chain
change makes one wrong.

### 5. Wake ending

- The round ends when every case is `working` or `expired`. After the last
  resolving line (the `WORKING_LINE` dialog, or a `ZASTARELO!` line) is
  dismissed, go to the ending.
- Office visits still score points; the HUD keeps `Tužilaštva N/90` as
  progress. `isReadyForEnding` over offices is no longer the trigger in Wake.
- The ending pages stay; the score page may add `Posećeno: N/90`
  (Claude's call).

### 6. Narrator box

- Its own look: different fill from dialog, an "i" mark, placed so it never
  covers the dialog box or the HUD (e.g. just under the HUD bar).
- **Line mode:** does not block movement; hides by itself after a few seconds
  (start at 6 s; tune in play) or when the next fact replaces it.
- **Splash mode (Wake only):** blocks movement like dialog, dismissed with
  Enter/tap. Shown **once per game per topic**: first `level` bounce, first
  `area` bounce, first `tok` hop. The splash comes right after the bounce
  dialog is dismissed (Claude's call). Later events of the same kind show
  only the bounce line.
- Text: facts are one sentence that fits **two rows** of the box; splashes
  fit the dialog area (up to 5 rows). Reuse the wrapped-row counting from
  `src/data/cases.test.ts` (move it to a shared test helper).

### 7. Facts (data + logic)

- `src/data/facts.ts`: `{ id, text, topic, levels?, vjt? }` plus a comment
  per fact naming its `nadleznost.md` section. Topics: `level`, `area`,
  `special`, `oversight`, `conflict`. Draft lines are in `nadleznost.md`
  section 4; the copy gets the human's review like v0.11.
- Splash texts per topic live there too.
- Pure `src/facts.ts`:
  - rotation without repeats until the list is used up, then reshuffle;
  - `factFor(target)` prefers a fact matching the target office's level or
    VJT area, else the next in rotation.
- Find Zaga: when she starts sleepwalking, show `factFor(destination)` in
  line mode; it stays until she arrives (no timer there).

## Testing

Vitest, Kaplay-free modules as today: jurisdiction data, area-of-point, case
hops, facts rotation and matching, copy fit, Wake end condition (session-level
test: resolving the fourth case ends; resolving three does not). Playwright
smoke stays two tests. Manual check: narrator box placement on phone and
desktop, a splash, an area change, a sleepwalk fact.

## Docs

- `docs/game-design.md`: Wake ending rule, narrator box, Find Zaga spinner.
- `docs/testing.md`: new modules.
- `docs/research/slucajevi.md`: drop "Ništa odavde još ne ide u igru".

## Left to the builder

Exact narrator colors and position; timing; the fact list's final wording
(within the copy rules and two rows); whether jurisdiction data is generated
by a script or hand-written (either is fine if the tests above hold).

## Version

New mechanic and content → **v0.12.0** on merge.
