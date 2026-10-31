# Case files ("Ping-pong nadležnosti") — design

Date: 2026-10-31
Status: direction approved in conversation; this written spec awaits review
Target release: v0.11.0 (branch `feat/case-files`)
Research: `docs/research/slucajevi.md`

## Decisions (from the brainstorm)

| Question | Decision |
|---|---|
| Wake mode mechanic | Ping-pong: real stalled cases are files that offices bounce to each other. |
| Real endings | Yes: the ending reports each case with a sober "U stvarnosti" line. |
| Crowd in Find Zaga | Stays 3 people (visibility on phones). No growth. |
| Find Zaga trail | Later, v0.12.0, its own spec (outline at the end). |

## Cases

Only cases where prosecution did not act, acted late, or stalled. Named by
event and institution, never by a suspect. Chains follow the real route
from the research cards; a hop marked *(karikatura)* has no real route and
must read as a joke, never as a fact.

| id | Title on map | Chain (start → … → last) | Start dust |
|---|---|---|---|
| `nadstresnica` | Nadstrešnica | VJT Novi Sad → VJT Beograd → TOK | 0.3 |
| `zvucni-top` | Zvučni top | Prvo OJT Bgd → TOK → Prvo OJT Bgd → VJT Beograd | 0.1 |
| `izbori-2023` | Izbori 2023. | VJT Beograd → Prvo OJT Bgd | 0.5 |
| `napadi-studenti` | Napadi na studente | OJT Novi Sad → VJT Novi Sad *(karikatura)* → VJT Beograd *(karikatura)* | 0.2 |

Two candidates, kept only if the fact-check round supports them:
`jovanjica` (stalled since 2019; start dust 0.7) and `krik-otkrica`
(published corruption findings without a reaction).

Excluded: Ribnikar, Ćacilend (people hurt or killed; not for satire);
Generalštab (TOK did act — it can stay a Find Zaga shout).

## Flow in Wake the offices

The v1 loop is unchanged: every office still gives its points once, and
the ending still comes when every office has been visited. Cases are an
extra layer on top.

1. **Waiting.** Each case file waits at its start office. The office marker
   shows a folder; its tint goes from yellow to grey as dust fills.
2. **Pick up.** Visiting the start office runs the normal shout + reply,
   then the bounce line, e.g. `Nismo nadležni! Nosite to u TOK.` The crowd
   now carries the file (folder above the leader). A second HUD line shows
   `Nosiš: Zvučni top → TOK`, and the target office marker pulses.
3. **One file at a time.** While carrying, a start office of another case
   says `Prvo završite taj predmet!` and keeps its file. Other files keep
   gathering dust: choosing an order is the strategy.
4. **Bounce.** Each office in the chain except the last answers with its
   own bounce line and names the next office.
5. **Last office: the demand.** A 3-option choice (the existing `ask`). One
   demand fits the case; picking it shows `U RADU!`, the file leaves the
   crowd, dust stops, `CASE_POINTS = 50` are added. A wrong pick gets
   `Vraćeno na dopunu.` and the file goes back one hop (the previous office
   in the chain becomes the target). Picks never end the case on their own.
6. **Zastarevanje.** Dust grows from the start value to 1 over
   `DUST_SECONDS = 300` of play time, for waiting and carried files alike.
   Time with a dialog open does not count. At 1 the file is `ZASTARELO`:
   it turns grey, is dropped if carried, and gives no points. No fail state.
7. **Ending.** After the current ending text and score, one page per case:
   title, the game result (`U RADU` / `ZASTARELO` / `NIJE POKRENUTO`), then
   `U stvarnosti:` and a one- or two-line fact with its date
   (`stanje: okt. 2026`). Enter / tap turns pages; the last page goes back to
   the title.

Max score becomes `1060 + 50 × cases` (1260 with 4 cases); the HUD and the
score line keep their current format.

## Copy rules

- Bounce lines, demands and replies are caricature of the institution's
  pace, in Serbian Latin, each ≤ 33 characters per dialog line.
- No quote is put in a real person's mouth. No joke about victims; the
  Nadstrešnica lines are about delay only.
- Every "U stvarnosti" line comes from a research card, carries its
  date, and lists its sources in `src/data/cases.ts` (comment per case).
- Lines marked **[proveriti]** in the research may not ship. The plan's
  first task is the second fact-check round for the cases above; a case
  whose status cannot be confirmed gets a line that says only what is
  confirmed, or is dropped.

## Code

Pure, Kaplay-free, tested:

- `src/data/cases.ts` — `CaseFile = { id, title, chain: officeId[],
  bounces: string[] (one per hop), demands: [string, string, string],
  right: 0|1|2, done: string, reality: string[], asOf: string,
  startDust: number }` and `CASES`, `CASE_POINTS`, `DUST_SECONDS`, the
  fixed lines (`busyLine`, `returnedLine`, `carryHud(title, office)`).
- `src/cases.ts` — state and rules:
  - `createCases(cases)`; each case is `waiting | carried | working |
    expired` with `hop` and `dust`.
  - `tickCases(state, dt)` — adds dust to every waiting or carried case;
    expires at 1 (and drops a carried one).
  - `visitForCases(state, officeId)` → one of `pickup` (with bounce line
    and next office), `bounce`, `ask` (last office, with the demands),
    `busy`, or `none`.
  - `answerCase(state, index)` → `working` (+ points) or `returned`.
  - `caseReport(state)` → per case: title, result, reality lines.
- `src/score.ts` — `maxScore` adds case points; case points go into
  `ScoreState.total` through a new `grantCase` so the "once" rule stays in
  one place.

Scene changes stay thin: `overworld.ts` calls the module from `onVisit`
and `onFrame` (dust ticks only when no dialog is open); `mapView.ts` gets
two new `OfficeMark` values (`folder` with a dust amount, `target`) and an
optional second HUD line; `ending.ts` pages through `caseReport`.
Folder art is a placeholder drawn shape until real art exists.

## Tests (Vitest)

- Data: every chain uses real office ids, has ≥ 2 offices, one bounce line
  per hop, 3 demands, `right` in range, every line ≤ 33 characters, a
  non-empty reality line and `asOf`.
- Pickup only at the start office; only one carried file; `busy` at
  another start office while carrying.
- Bounces walk the chain in order; visiting a non-target office does
  nothing to the case.
- Right demand → working, points granted once; wrong → back one hop.
- Dust: grows with `dt`, stops when working, expires at 1 and drops a
  carried file; a dialog-open frame adds nothing (the scene passes 0).
- Report lists every case with the right result.
- Max score includes case points; the ending condition is still "every
  office visited".

Playwright smoke unchanged.

## Docs to update with the feature

`docs/game-design.md` (Wake mode rules; "Dialog is linear" gets the case
exception; "branching quests" stays out — chains are linear),
`docs/testing.md` (Cases entry).

## Next: Find Zaga trail (v0.12.0, own spec)

Outline only: after rounds 1 and 2 she drops case files along her
sleepwalk path; picking one shows its card, narrows the next hint, and
adds its shout to the next talk round; round 3's answer and the ending
(`Broj poseta: N, Spisa: M`) depend on files carried. Crowd stays 3.
