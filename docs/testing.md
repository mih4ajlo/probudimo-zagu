# Testing — Probudimo Zagu

Read this before adding or changing tests. Install Vitest and Playwright only
when implementation starts, not while the repo is docs-only.

## Stack
| Layer | Tool | What it covers |
|--------|------|----------------|
| Logic | Vitest + TypeScript | Score, dialog, lord data, “all visited” |
| Browser smoke | Playwright | Page loads, canvas exists, no page error |

Vite is the bundler, so Vitest is the runner. Do not add Jest or Cypress.

## What to test (required)
Keep rules in modules that do not import Kaplay, then unit-test those modules.

- **Score:** first visit grants that lord’s points; a second talk grants 0;
  total equals the sum of visited lords (ranks differ: 10, then 20, then 30).
- **Dialog:** open blocks movement; Space / Enter / click advances a line;
  last line closes the box and unblocks movement.
- **Lords:** exactly three lords, ranks 1–3 unique, each with stable `id`,
  display name, marker, linear lines, and `points` matching `RANK_POINTS`.
- **Progress:** after every lord is visited, the game is ready for the
  ending scene.

Colocate tests: `src/score.ts` → `src/score.test.ts` (same for dialog,
lords, progress).

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
it("grants that lord's rank points only on the first visit", () => {
  const state = createScore();
  expect(visitLord(state, "north").granted).toBe(10);
  expect(visitLord(state, "north").granted).toBe(0);
  expect(visitLord(state, "east").granted).toBe(20);
  expect(state.total).toBe(30);
});
```

## Definition of done
A gameplay change is done when `npm test` passes and any new rule in
`docs/game-design.md` has a Vitest case. The smoke test is required once a
playable page exists.
