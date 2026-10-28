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
5. When every office is visited → ending scene

## Modes
The title offers two modes (↑/↓ + Enter, or tap one):
- **Wake the offices** — the v1 loop above.
- **Find Zaga** — Zaga sleeps hidden in one office. A protest crowd (a
  leader with followers trailing) searches the offices. An empty office
  shouts back a hint: compass direction and "very close / not far / far
  away", and gets a "?" mark. Each first visit to an office adds a follower
  (3 to start, 12 at most). Finding her raises the wake meter by
  12 + 2 per follower; she then sleepwalks to another office at least
  300 units away and the "?" marks clear. At 100% she is awake and the
  ending shows visits and crowd size. No points, no fail state. Same map,
  controls, zoom and dialog rules as Wake the offices.

## Rules
- One map: a cartoon vector map of Serbia **including Kosovo**, drawn from
  Natural Earth borders. Kosovo is walkable; no offices there.
- She starts in Beograd and can only walk on Serbian land; walking into the
  border slides along it.
- Stops are the 60 public prosecutor's offices in `assets/tuzilastva.csv`,
  each its own marker around its city.
- Each visit opens with the shout ("Budite se, na posao!", hands in the air),
  then the office's reply. Dialog is linear.
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
| OJT | osnovno | 10 | 27 |
| VJT | više | 20 | 25 |
| AJT | apelaciono | 30 | 4 |
| PJT | posebno | 40 | 3 |
| VRHOVNO | Vrhovno javno tužilaštvo | 50 | 1 |

Max score 1060. Replies per level live in `src/data/replies.ts`.

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

## Open (decide before or during implementation)
- Dialog language (Serbian vs English)
- Final office reply copy (placeholders in `src/data/replies.ts`)
- Pixel size (recommend 16×16 sprites, integer scale, no blur)
