# Probudimo Zagu — game design (v1)

## Intent
A short retro adventure in the browser. An old, sleepy princess (Zaga) wakes
and is sent across a cartoon map of Serbia to wake up every public
prosecutor's office. Each first visit awards points. Travel is map movement.
Talk is dialog.

## Player fantasy
Walk across Serbia, shout "Budite se, na posao!" at every office, watch the
office count and score fill up, then see an ending.

## v1 loop
1. Title → start
2. Wake dialog (the prosecutors are asleep; visit every office)
3. Serbia map: walk, touch an office, shout + reply, points once
4. HUD: score / max and offices visited / total
5. When all four case files are resolved → ending scene

## Modes
The title offers two modes (↑/↓ + Enter, or tap one):
- **Wake the offices** — the v1 loop above, plus case files: real stalled
  cases (`src/data/cases.ts`, research in `docs/research/slucajevi.md`)
  wait as folders at their start office. Visiting it picks the file up and
  the office bounces it to the next office in its chain. Every bounce
  follows real jurisdiction (`src/data/jurisdiction.ts`) and its line names
  the reason: `level` (OJT ↔ its own VJT), `area` (same level, other office)
  or `tok` (to or from TOK).
  The crowd carries one file at a time (a second start office says "Prvo
  završite taj predmet!"); the HUD's second line names the target office,
  which gets a pulsing ring. At the last office the player picks one of 3
  demands: the right one puts the case "U RADU" (+50 points, once); a wrong
  one says "Vraćeno na dopunu." and sends the file back one office. Each
  file gathers dust over 300 s of play (time with a dialog open does not
  count); full dust makes it "ZASTARELO" (grey, dropped, no points, no fail
  state). The round ends when every case is "U RADU" or "ZASTARELO": after
  the last resolving line closes, the ending comes. After the score and
  "Posećeno: N/90", the ending shows one page per case: the game result and
  a dated, sourced "U stvarnosti" line.
  A neutral **narrator box** (teal, an "i" badge, just under the HUD; never
  over the dialog) teaches who prosecutes what and where:
  - entering a VJT area shows `Područje VJT u X; žalbe: AJT u Y.` (her
    area is the VJT of the nearest OJT town; no borders are drawn; an area
    named in the last 30 s is not named again);
  - after 20 s of walking with nothing shown, a sourced fact
    (`src/data/facts.ts`); a line hides after 6 s, and waits while a dialog
    is open;
  - the first `level`, `area` and `tok` bounce of a game each get a splash
    after the bounce dialog: narrator look, blocks movement until dismissed,
    once per game.
- **Find Zaga** — opens at her desk: Zaga asleep behind the PC, Z's rising,
  intro text. Then three protesters (a leader and two followers in its
  trail; the crowd never grows) search the offices. An empty office shouts
  back a hint: compass direction and "sasvim blizu / nedaleko / daleko",
  and gets a "?" mark. At her office she appears asleep on the map and a
  talk round starts: pick one of 3 lines to shout (↑/↓ + Enter, or tap a
  line) and she answers it. Every pick works. After rounds 1 and 2 she
  sleepwalks (her avatar walks across the map, half the crowd's speed) to
  another office at least 300 units away that she can reach in a straight
  line without leaving Serbia, and stays asleep there; chase her and the
  next round starts. The HUD round moves on when she walks off. While she
  sleepwalks, the narrator box shows a fact about where she heads (its
  level or VJT area) until she arrives. She hides among all 90 offices. After round 3 the desk scene shows her waking
  with a start, then "Broj poseta: N". No points, no fail state. Same
  map, controls, zoom and dialog rules as Wake the offices.

## Rules
- One map: a cartoon vector map of Serbia **including Kosovo**, drawn from
  Natural Earth borders. Kosovo is walkable; no offices there.
- She starts in Beograd and can only walk on Serbian land; walking into the
  border slides along it.
- Stops are the 90 public prosecutor's offices in `assets/tuzilastva.csv`
  (all 58 OJT; the cybercrime office is a VJT Beograd department since 2023
  and is not a stop), each its own marker around its city. Beograd's and
  Pančevo's rings are turned so their offices stay apart.
- Each visit opens with the shout ("Budite se, na posao!", hands in the air),
  then the office's reply. Dialog is linear, except the 3-option choices
  (Find Zaga talk, case demands).
- An office can be visited again, but points are granted only the first time.
- Movement is blocked while a dialog box is open or while shouting.
- Advance dialog with Space / Enter / click. Walk with WASD or arrow keys.
- Shout any time with E (cosmetic, ~1.2 s, no points).
- Zoom with the mouse wheel or +/-, from all of Serbia to a close view.
- Touch (phones/tablets): after the first touch, an on-screen joystick
  (bottom-left) walks her in 8 directions like the keys, a "!" button
  (bottom-right) shouts, and + / - buttons zoom; two-finger pinch on the map
  also zooms. A quick one-finger tap on the map walks her straight to that
  spot (a red x marks it); she slides along the border and stops when she can
  get no closer, and keys or the joystick cancel the walk. Controls hide while
  a dialog is open. Tapping anywhere advances dialog and starts/leaves the
  title and ending screens.
- The game fills the whole browser window, in landscape or portrait, on
  phones and desktop. At least the 320x180 design area is always visible; a
  wider or taller screen shows more map. HUD, dialog and touch controls stick
  to the screen edges. Title, wake and ending stay centered.

## Content
| Level | Office | Points | Count |
|---|---|---|---|
| OJT | osnovno | 10 | 58 |
| VJT | više | 20 | 25 |
| AJT | apelaciono | 30 | 4 |
| PJT | posebno | 40 | 2 |
| VRHOVNO | Vrhovno javno tužilaštvo | 50 | 1 |

Max score 1330 for offices, plus 50 per case file (1530 with 4 cases).
Jurisdiction (municipality → OJT → VJT → AJT) lives in
`src/data/jurisdiction.ts`, from `docs/research/nadleznost.md`.
Replies per level live in `src/data/replies.ts`.

## Out of scope for v1
Combat, enemies, inventory, branching quests, indoor office scenes, fast
travel, a minimap, save/load,
backend, accounts, pixel-perfect original art (use
placeholders).

## Tech (locked for v1)
Kaplay + TypeScript + Vite. Static site. No server.

## Testing (locked for v1)
Vitest for logic. Playwright for one browser smoke test. Details in
`docs/testing.md`. No Jest, Cypress, or React Testing Library.

## Success
A stranger can open the game, finish all visits in a few minutes, see score
go up, and reach the ending without a console error.

## Language
All player-facing text is Serbian in Latin script (the pixel font has the
Latin Extended letters č, ć, š, ž, đ). Copy lives in `src/data/`.

## Open (decide before or during implementation)
- Final office reply copy (placeholders in `src/data/replies.ts`)
- Pixel size (recommend 16×16 sprites, integer scale, no blur)
