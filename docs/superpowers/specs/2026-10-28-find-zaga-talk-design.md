# "Find Zaga" v2 — fixed crowd, talk, desk scenes — design

Date: 2026-10-28
Status: approved in conversation
Target release: v0.9.0 (branch `feat/find-zaga-talk`)
Supersedes the gameplay parts of `2026-10-28-find-zaga-design.md` (search,
hints, "?" marks, map view and protester art stay as built in v0.8.x).

## Decisions (from the brainstorm)

| Question | Decision |
|---|---|
| Crowd | Always 3 people: leader + 2 followers. No growth. |
| Rounds | 3 finds, one talk round per find (amended after approval: the user asked for her avatar to sleepwalk across the map between rounds). |
| Talk | Each round the player picks one of 3 crowd lines; she answers that line. Every pick works (no fail). |
| Zaga on map | Hidden until the first find; from then on always visible: asleep with floating z's at her office, and walking (sleepwalking) across the map between rounds. |
| Desk scenes | Both: asleep at the PC as the mode's intro; waking up at the PC as the ending. |

## Flow

Title → **huntIntro** (desk, asleep, intro text) → **hunt** (search, then
talk) → **huntEnding** (desk wake-up animation, result) → title.
Wake the offices is unchanged.

## Search (hunt scene)

- Leader + `FOLLOWERS = 2` trailing protesters, tinted.
- Hideout, hints, "?" marks, visit counting: as v0.8.x. The wake meter,
  crowd growth and mumbles are removed.
- HUD: `Round 2/3  Visits 7`.

## Finds, the talk and sleepwalking

- Touching her office counts a visit and is a find; "?" marks clear. The
  first find shows Zaga (princess sprite) beside that office with small
  "z"s floating up; line `FOUND_LINE`; later finds say `CAUGHT_LINE`.
- Each find runs one talk round (below). After rounds 1 and 2 the line
  `SLEEPWALK_LINE` shows, the dialog closes, and she sleepwalks: a new
  office at least `MIN_HIDE_DISTANCE` away is picked, and her avatar walks
  there in a straight line at `SLEEPWALK_SPEED = 40` units/s (half the
  crowd's speed), walk animation, facing her direction, z's still rising.
  She stays asleep at the new office until found. Touching her new office
  counts as a find even before she arrives (she snaps to it).
- 3 rounds (`TALK_ROUNDS` in `src/data/hunt.ts`), each 3 choices
  `{ shout, reply }`. The dialog box lists the 3 shouts with a `>` marker:
  ↑/↓ (W/S) moves, Enter/Space picks, click/tap on a row picks that row,
  a tap outside the rows does nothing.
- After a pick: the shout line (crowd in shout pose), then her reply.
  After round 3 → huntEnding with the result `{ visits }`.
- Shouts fit one dialog line: at most 33 characters.

## Desk scenes

Art made by `scripts/make-sprites.py` from the wake picture:
- `desk-asleep.png`: the baked-in Z's removed (inpainted from neighbours).
- `desk-awake.png`: asleep frame with eyes painted open and a small open
  "o" mouth.

Z's in both desk scenes are animated in game: a "Z" rises from her head
every 0.5 s, drifts up-right, grows and fades over 2.2 s.

- **huntIntro**: desk-asleep + Z's + dialog box with `HUNT_INTRO`;
  Enter/Space/click advances; after the last line → hunt.
- **huntEnding** (timeline from scene start): `asleep` 0–1.6 s → `burst`
  (Z's in the air fly off, no new ones, screen shake) → at 2.0 s `awake`
  (desk-awake frame, red "!" over her head) → at 3.0 s `text` (box:
  `Zaga is awake!`, `Found in N visits`, Enter/tap prompt). Enter/click
  return to the title only in `text`. Every phase's effect runs in order
  even if frames are skipped. No saved result → title.

## Code

| File | Change | Kaplay? |
|---|---|---|
| `src/dialog.ts` | choice menu: `openChoices`, `currentChoices`, `moveChoice`, `pickChoice`, `choiceAt` | no |
| `src/talk.ts` | rounds, `talkChoices`, `talkPick`, `isTalkDone` | no |
| `src/hunt.ts` | hideout, visits, searched, finds; `huntFlee` picks her next office; `huntResult → { visits }` | no |
| `src/deskWake.ts` | `wakePhase(t)`, `phasesToEnter(reached, t)` | no |
| `src/data/hunt.ts` | `FOLLOWERS`, `FOUND_LINE`, `TALK_ROUNDS`, intro/ending copy; old growth/wake/mumble/flee data removed | no |
| `src/scenes/mapView.ts` | hooks become `onVisit(id, talk)` with `talk.say(lines, {shoutFirst, then})` and `talk.ask(options, then)`; renders choices | yes |
| `src/scenes/overworld.ts`, `hunt.ts` | use the new hook | yes |
| `src/scenes/desk.ts` | `addSnore()` Z animation, head position | yes |
| `src/scenes/huntIntro.ts`, `huntEnding.ts` | desk scenes | yes |

## Testing

- **Dialog choices**: blocks movement; wraps; advance does not close a
  choice; pick returns the index and unblocks; out-of-range pick ignored;
  `choiceAt` rows.
- **Talk**: choices per round; a pick returns `[shout, reply]` and
  advances; done after the last round; invalid picks ignored. Data: 3
  rounds × 3 choices, shouts ≤ 33 chars.
- **Hunt**: as before for hideout/hints/searched; a find counts, clears
  "?" and returns the found/caught line; `huntFlee` moves the hideout ≥ the
  min distance and never to the same office; `huntResult`.
- **Sleepwalk**: straight steps at the given speed, lands exactly on the
  office, reports done.
- **Desk wake**: phase edges; skipped frames still enter every phase in
  order.
- **Playwright**: smoke unchanged (Find Zaga starts, through the intro).
- Not tested: drawing, the art edit, Z animation, shake.

## Out of scope

Branching outcomes, failing picks, voice/sound, more rounds, Cyrillic.
