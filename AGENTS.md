# Agent instructions — Probudimo Zagu

Read `docs/game-design.md` before changing gameplay.

## Order of work
1. Do not start implementation until the human asks for it.
2. When they do, follow `docs/superpowers/plans/2026-10-27-v1-game-loop.md` task by task.
3. Keep story, offices, map data, and dialog in `src/data/`, not in scene files.
4. Prefer the smallest change that preserves the v1 loop.

## Stack
- Kaplay, TypeScript, Vite
- Vitest (unit/logic), Playwright (one browser smoke)
- Browser only
- No extra frameworks (no React, no Phaser, no Jest, no Cypress, no backend)

## Testing
Follow `docs/testing.md`. Test score, dialog state, and lord data — not Kaplay
drawing. Do not claim a feature done if its logic has no Vitest coverage.

## Definition of done for a feature
- Playable in the browser
- Dialog still blocks movement
- Score still grants once per office
- Relevant Vitest tests pass (`npm test`)
- No new systems unless the human asked

## Versioning
- Semantic versioning: `MAJOR.MINOR.PATCH`. The single source of truth is
  `"version"` in `package.json`.
- While pre-1.0 (`0.x`):
  - **MINOR** (`0.1.0` → `0.2.0`): a new playable feature or content
    milestone (new art, new scene, new lords, new mechanic).
  - **PATCH** (`0.1.0` → `0.1.1`): bug fixes, copy/typo edits, tuning — no
    new features.
- `1.0.0` = the v1 loop is final (art, copy, and language decided) and
  shipped to players.
- Work on a feature branch (`feat/...`, `fix/...`), never directly on `main`.
- Bump the version only when merging to `main`, in the merge or a commit
  right after it — not on feature branches.
- Before bumping: `npm test`, `npm run test:e2e`, and `npm run build` must pass.
- Tag every version on `main` with an annotated tag `vX.Y.Z` whose message
  lists what changed:
  `git tag -a v0.2.0 -m "v0.2.0: <one line per change>"`
- Do not push or publish tags unless the human asks.
