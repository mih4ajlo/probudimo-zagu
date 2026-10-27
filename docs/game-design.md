# Probudimo Zagu — game design (v1)

## Intent
A short retro top-down adventure in the browser. An old, sleepy princess wakes.
Her people ask her to visit every lord and check on them. Each first visit
awards points. Travel is map movement. Talk is dialog.

## Player fantasy
Walk a small kingdom, greet each lord, feel the list and score fill up, then
see an ending.

## v1 loop
1. Title → start
2. Wake dialog (she is called to visit the lords)
3. Overworld: walk, collide with a lord marker, dialog, points once
4. HUD: score + lords visited / total
5. When every lord is visited → ending scene

## Rules
- One overworld map. Lords are markers on that map (not indoor rooms in v1).
- Dialog is linear per lord (no branching trees in v1).
- A lord can be talked to again, but points are granted only on first visit.
- Three ranks of lords on the same map. Rank sets points (not a second map).
- Movement is blocked while a dialog box is open.
- Advance dialog with Space / Enter / click.
- WASD or arrow keys to walk. She faces the way she walks (left/right) and
  plays a walk animation while moving.
- Shout: press E in the overworld. She throws her hands in the air and shouts
  "Budite se, na posao!" in a speech bubble for ~1.2 s. Movement is blocked
  while shouting. Cosmetic only: no points. Ignored while a dialog is open.
- Touch (phones/tablets): after the first touch, an on-screen joystick
  (bottom-left) walks her in 8 directions like the keys, and a "!" button
  (bottom-right) shouts. Both hide while a dialog is open. Tapping anywhere
  advances dialog and starts/leaves the title and ending screens. Best played
  in landscape.
- Every lord visit opens with the same shout (hands in the air) as the first
  dialog line; then the lord answers.

## Content (placeholders until copy is written)
- Opening: wake, call to duty.
- 3 lords, one per rank:

  | Rank | Role        | Points |
  |------|-------------|--------|
  | 1    | Lesser lord | 10     |
  | 2    | Lord        | 20     |
  | 3    | High lord   | 30     |

- Ending: all lords seen, score recap (max 60).

## Out of scope for v1
Combat, enemies, inventory, branching quests, multiple maps, save/load,
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
- Final lord names and copy
- Pixel size (recommend 16×16 sprites, integer scale, no blur)
