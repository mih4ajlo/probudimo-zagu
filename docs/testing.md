# Testing — Probudimo Zagu

Read this before adding or changing tests. Install Vitest and Playwright only
when implementation starts, not while the repo is docs-only.

## Stack
| Layer | Tool | What it covers |
|--------|------|----------------|
| Logic | Vitest + TypeScript | Score, dialog, office data, map geometry, zoom, “all visited”, hunt rules |
| Browser smoke | Playwright | Page loads, canvas exists, Find Zaga starts, no page error |

Vite is the bundler, so Vitest is the runner. Do not add Jest or Cypress.

## What to test (required)
Keep rules in modules that do not import Kaplay, then unit-test those modules.

- **Dialog:** open blocks movement; Space / Enter / click advances a line;
  last line closes the box and unblocks movement.
- **Score:** first visit grants the office's level points (10/20/30/40/50);
  a second visit grants 0; unknown ids grant 0.
- **Offices:** 60 entries, unique ids, level counts 27/25/4/3/1, max 1060,
  every city has coordinates.
- **Geo:** projection keeps north up; known cities inside/outside the
  Serbia+Kosovo outline; every office city inside; blocked diagonals slide.
- **Layout:** offices of one city do not overlap; every office on land;
  a visit starts only when stepping onto a new office with no dialog open.
- **Zoom:** clamped to its limits; camera never shows past the map, centers
  when the map is smaller than the view.
- **Progress:** after every office is visited, the game is ready for the
  ending scene.
- **Princess:** facing follows sideways input and is kept when still; the
  animation is shout over walk over idle.
- **Shout:** lasts `SHOUT_SECONDS`, does not restart mid-shout, and an office
  visit's dialog starts with the shout line.
- **Joystick:** no input until grabbed or inside the dead zone; snaps to the
  same 8 directions as the keys; follows only the grabbing finger; the knob
  stays inside the ring.
- **Tap:** one quick finger without sliding is a tap; sliding, holding, or a
  second finger (pinch) is not.
- **Walk to a tap:** steps straight toward the target, lands on it, slides
  along the border, and stops when it can get no closer.
- **Screen fit:** 16:9 shows exactly 320x180; wider or taller screens show
  more, never less.
- **Pixel density:** phones keep 2x; big high-DPI screens stay within
  `MAX_CANVAS_PIXELS`; never below 1 unless the screen ratio is.
- **Pinch:** one finger never zooms; two fingers zoom by their spread ratio,
  clamped to the zoom limits; lifting a finger stops; a third finger is ignored.
- **Hint:** 8 compass directions with north up (−y), sector edges halfway;
  distance bands at 150 and 450; "near" has no direction.
- **Hunt:** she hides at least `MIN_HIDE_DISTANCE` away (also on the real
  map from Beograd); empty offices hint and get "?" once; her office is a
  find (first "found", later "caught again") and clears the "?" marks;
  `huntFlee` sends her to another office at least the min distance away,
  preferring one she can walk to on land (every flee stays on Serbian land
  on the real map); the round moves on only when she flees; unknown offices
  are ignored; the result is the visit count.
- **Line on land:** a straight walk is on land only if every point on it is.
- **Crowd:** followers stand a fixed path distance behind the leader, round
  corners, do not collapse when the leader stands still, wait at the oldest
  point on a short path; the trail keeps only what the last follower needs.
- **Title menu:** selection wraps both ways; reset clears the hunt result.
- **Dialog choices:** options block movement; the marker wraps; advancing
  does not close them; a pick returns its index and unblocks; out-of-range
  picks are ignored; a tap's row maps to an option.
- **Talk:** each round offers its shouts; a pick returns shout + reply and
  moves on; done after 3 rounds; 3 × 3 choices, shouts fit one line.
- **Copy:** hints name all 8 directions in Serbian; HUDs, the score line and
  "back to menu" read in Serbian; mode names fit the title button.
- **Desk wake:** phase times; skipped frames still enter every phase in order.

Colocate tests: `src/score.ts` → `src/score.test.ts` (same for dialog,
offices, geo, officeLayout, zoom, progress, hint, hunt, crowd, titleMenu,
talk, deskWake).

## What not to test
- Pixel drawing, sprite animation, camera, or Kaplay internals
- Exact dialog wording (assert structure and ids, not full copy)
- Visual regression / screenshots in v1
- Network, auth, or persistence (v1 has none)

## Commands (when the app exists)
- `npm test` — Vitest once (CI and definition of done)
- `npm run test:watch` — Vitest watch while editing logic
- `npm run test:e2e` — Playwright smoke against the Vite preview

## Playwright smoke (one test)
Start the built site or Vite preview. Open `/`. Expect:

- HTTP 200
- A canvas (or the Kaplay root) is present
- No `pageerror`

Do not script walking the whole map in v1. That is brittle on canvas.

## Style
- One behavior per `it(...)`. Name the rule, not the function.
- No `any`. Prefer explicit types shared with game data.
- Do not import scenes into unit tests.

## Example (score)

```typescript
it("grants the office's level points only on the first visit", () => {
  const state = createScore();
  expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(10);
  expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(0);
  expect(visitOffice(state, "vjt-u-novom-sadu").granted).toBe(20);
  expect(state.total).toBe(30);
});
```

## Definition of done
A gameplay change is done when `npm test` passes and any new rule in
`docs/game-design.md` has a Vitest case. The smoke test is required once a
playable page exists.
