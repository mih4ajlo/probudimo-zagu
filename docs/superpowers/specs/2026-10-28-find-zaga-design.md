# "Find Zaga" mode — design

Date: 2026-10-28
Status: approved in conversation, awaiting written-spec review
Target release: v0.8.0 (branch `feat/find-zaga`)

## Intent

A second game mode on the same Serbia map. This time Zaga is the one
asleep. The player leads a protest crowd from office to office, looking for
the office where she naps. Each time they find her they shout, she wakes a
little, and she sleepwalks off to hide in another office. After enough
persistent finds she is fully awake.

## Decisions (from the brainstorm)

| Question | Decision |
|---|---|
| Core loop | She hides in one office; each find raises a wake meter, then she flees to another hidden office. |
| Search hints | Every empty office gives a warmer/colder hint (compass direction + distance band). |
| Crowd | A leader with trailing followers. Each newly visited office adds one follower (cap). A bigger crowd wakes her more per find. |
| Goal | Wake her fully. Fewest visits is the implicit score. No points, no fail state. |
| Architecture | Shared map view extracted from the overworld; a new `hunt` scene; hunt rules in pure modules. |

## Flow

- Title shows two modes: **Wake the offices** (today's game, unchanged) and
  **Find Zaga** (new). ↑/↓ (or W/S) selects, Enter starts; on touch,
  tapping a mode starts it.
- Wake the offices: title → wake → overworld → ending (unchanged).
- Find Zaga: title → hunt → hunt ending → title.

## Gameplay

### Start

- The crowd starts at the Beograd spawn point (`spawnPoint()`), as the
  current mode does.
- Leader: a protester sprite steered exactly like the princess today
  (keys, joystick, tap-to-walk, border sliding, zoom).
- Followers: `START_FOLLOWERS = 3` protesters walking in the leader's trail.
- Zaga hides in a random office at least `MIN_HIDE_DISTANCE = 300` game
  units from the start (ignored if no office qualifies). Her office is not
  marked.

### Visiting an office

Touching an office (same touch rule as today) opens a dialog; movement is
blocked while it is open. Every touch counts as a visit (`visits + 1`).

- First line, always: the shout `SHOUT_LINE`; the leader and followers
  play the shout pose.
- **Empty office**: second line is a hint toward her office, e.g.
  `"Zzz... snoring to the north-east, far away."`. The office gets a "?"
  mark (visited-empty this round).
- **Her office**: the wake meter rises by
  `wakeGain(followers) = WAKE_BASE + WAKE_PER_FOLLOWER * followers`
  (`12 + 2·f`, so 18 with 3 followers, 36 with 12), capped at 100.
  Second line: her mumble for the new meter value
  (see *Copy*). If the meter is now 100 the dialog ends and the hunt ending
  starts. Otherwise she flees: a new hidden office is chosen (never the
  same one, at least `MIN_HIDE_DISTANCE` away from the office she left,
  falling back to any other office), and all "?" marks clear.
- **Crowd growth**: the first time an office is visited in this run (empty
  or hers), followers `+1`, up to `MAX_FOLLOWERS = 12`. Revisits never grow
  the crowd.

### Hints

`hintFor(from, to)` with game-unit points (y grows south):

- Distance `d = |to − from|`:
  - `d < 150` → band `near`: `"Very close! Zzz..."` (no direction).
  - `d < 450` → band `mid`: `"Zzz... snoring to the <dir>, not far."`
  - otherwise → band `far`: `"Zzz... snoring to the <dir>, far away."`
- `<dir>` is one of 8 compass names (`north`, `north-east`, `east`,
  `south-east`, `south`, `south-west`, `west`, `north-west`) from the angle
  of `to − from`, north up, 45° sectors centred on each direction.
- `from` is the visited office's map position, `to` her office's position.

### HUD

`Awake 36%  Crowd 7  Visits 14` on the existing dark strip. "Crowd" counts
the leader plus followers.

### Ending

Hunt ending scene: title, `"Zaga is awake!"`, then
`"<visits> visits, <crowd> protesters"`, then "Press Enter / Tap for title".

### Unchanged

The Wake the offices mode: rules, scoring, HUD, ending. Dialog blocks
movement in both modes. E/"!" shout works in hunt mode (the crowd shouts,
cosmetic).

## Copy (`src/data/hunt.ts`)

- `HUNT_TITLE = "Find Zaga"`, the mode names, the hint templates above,
  the ending lines.
- Her mumbles by meter after the find (first line whose threshold ≥ meter):
  - ≤ 30: `"Mmm... five more minutes..."`
  - ≤ 60: `"Who is shouting? It's not even noon..."`
  - ≤ 99: `"Fine, fine, I'm getting up... *yawn*"`
  - 100: `"I'm up! I'm up! Who called the press?"`
- Flee line (after her mumble, when not awake):
  `"She sleepwalks away to another office."`

## Art (`scripts/make-sprites.py`)

- Protester: same size and style as the princess walk sprites, plain
  clothes, holding a sign; walk frames facing right and left, plus a shout
  pose (sign raised).
- Followers reuse the protester sprite with a small per-follower tint so the
  crowd looks varied.
- Sleeping Zaga is not shown on the map (her office is hidden). No new
  portrait.

## Code structure

| File | Role | Kaplay? |
|---|---|---|
| `src/data/hunt.ts` | constants, hint/mumble/ending copy | no |
| `src/hunt.ts` | `createHunt(rng)`, `visitOffice`, `flee`, `wakeGain`, `isAwake` | no |
| `src/hint.ts` | `compassDirection`, `distanceBand`, `hintFor` | no |
| `src/crowd.ts` | trail history and follower positions | no |
| `src/titleMenu.ts` | mode list, selection wrap | no |
| `src/scenes/mapView.ts` | map drawing, office markers, camera/zoom, input, leader movement, dialog box, HUD strip, touch UI — extracted from `overworld.ts` with hooks for the scene's touch handler, marker decoration and HUD text | yes |
| `src/scenes/overworld.ts` | Wake the offices on top of `mapView` | yes |
| `src/scenes/hunt.ts` | Find Zaga on top of `mapView` | yes |
| `src/scenes/huntEnding.ts` | hunt ending | yes |
| `src/scenes/title.ts` | mode menu | yes |
| `src/session.ts` | also holds the hunt result for the ending | no |

`src/hunt.ts` takes a random source `rng: () => number` so tests are
deterministic; scenes pass `Math.random`.

## Testing (Vitest unless noted)

- **Hunt**: start hide office is ≥ `MIN_HIDE_DISTANCE` from the start
  point; empty visit counts a visit and returns a hint; first visits add a
  follower, revisits do not; followers stop at 12; finding her raises the
  meter by `wakeGain` and moves her to a different office ≥ the min
  distance away; the meter caps at 100 and `isAwake` is then true; finding
  her clears the "?" marks; unknown office id is ignored; visits after
  awake are ignored.
- **wakeGain**: 3 → 18, 12 → 36.
- **Hint**: each of the 8 directions; band edges 149/150 and 449/450;
  `near` has no direction; north is −y.
- **Crowd**: followers sit at fixed path distances behind the leader;
  standing still does not collapse them onto the leader; fewer history
  points than needed puts followers at the oldest point.
- **Title menu**: selection wraps both ways.
- **Overworld refactor**: existing tests stay green; manual play of Wake
  the offices unchanged.
- **Playwright**: existing smoke unchanged, plus a step that starts Find
  Zaga and checks no `pageerror`.
- Not tested: drawing, sprite art, follower tints.

## Docs to update

- `docs/game-design.md`: second mode section.
- `docs/testing.md`: hunt, hint, crowd, title menu cases.

## Out of scope

Saving best visit counts, difficulty levels, a timer, showing her location,
crowd collisions, followers walking independently, new office data.

## Risks

- The `mapView` extraction touches the working overworld. Mitigation:
  extract first with no behaviour change (own task, smoke + manual check),
  then add the hunt scene.
- Many sprites per frame: at most 13 crowd sprites, negligible.
