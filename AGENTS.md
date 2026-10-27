# Agent instructions — Probudimo Zagu

Read `docs/game-design.md` before changing gameplay.

## Order of work
1. Do not start implementation until the human asks for it.
2. When they do, follow `docs/superpowers/plans/2026-10-27-v1-game-loop.md` task by task.
3. Keep story, lords, and dialog in `src/data/`, not in scene files.
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
- Score still grants once per lord
- Relevant Vitest tests pass (`npm test`)
- No new systems unless the human asked
