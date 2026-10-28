# Find Zaga v2 (talk + desk scenes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework Find Zaga: a fixed crowd of 3 searches for her; when found she appears asleep on the map and the player runs a 3-round, pick-a-line talk; desk scenes show her asleep (intro) and waking up (ending).

**Architecture:** Pure, tested modules for the choice menu (`dialog.ts`), the talk (`talk.ts`), the simplified hunt (`hunt.ts`) and the ending timeline (`deskWake.ts`). `mapView` swaps its visit hooks for one `onVisit(id, talk)` with `talk.say` / `talk.ask`, and renders a choice list in the dialog box. Two desk scenes reuse an `addSnore()` Z animation. Desk art is generated from the wake picture by `make-sprites.py`.

**Tech Stack:** Kaplay 3001, TypeScript, Vite, Vitest, Playwright, Python + Pillow.

**Spec:** `docs/superpowers/specs/2026-10-28-find-zaga-talk-design.md`

## Global Constraints

- Branch `feat/find-zaga-talk`; release v0.9.0 bumped only at merge (AGENTS.md).
- No new dependencies. Copy and tuning in `src/data/`. Rules in Kaplay-free modules with Vitest coverage.
- Wake the offices behaves exactly as v0.8.1 (dialog blocks movement, points once per office, ending after 60).
- Crowd = leader + `FOLLOWERS = 2`. Talk = 3 rounds × 3 choices; shouts ≤ 33 characters.
- Ending timeline: burst at 1.6 s, awake at 2.0 s, text at 3.0 s.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Port 5173 belongs to the user's server: run e2e through a temporary config on 5181, manual checks on 5180.
- Done = `npm test`, e2e, `npm run build` pass; both modes playable.

## Review Focus

1. A tap/click on a choice row picks that row; a tap outside the rows does nothing; the tap that picks never also starts a tap-to-walk (`lastAdvanceTime`).
2. During choices, ↑/↓/W/S move the marker, never the crowd; Enter and Space pick the marked line.
3. Wake the offices after the hook change: shout pose on the first line, points, HUD, check marks, ending after the last line of the 60th office.
4. Ending phases all run in order even if frames are skipped (tab in background) — pinned by `phasesToEnter` tests.
5. Clicks/Enter on the ending before the text shows do nothing; after it, they return to the title.

---

### Task 1: Desk art

**Files:** Modify `scripts/make-sprites.py`, `src/assets.ts`; Create `public/sprites/desk-asleep.png`, `public/sprites/desk-awake.png`.

**Interfaces — Produces:** `SPRITES.deskAsleep = "desk-asleep"`, `SPRITES.deskAwake = "desk-awake"` (1280×720, drawn at `SPRITE_SCALE` = 320×180 units).

Not unit-tested (art). Coordinates were found on `public/sprites/wake.png` (1280×720) and prototyped.

- [ ] **Step 1: Add the desk frames to the script**

Before `def main()`:

```python
# Desk scenes for "Find Zaga", made from the wake picture (1280x720). The
# baked-in Z's are removed so the game can animate its own; the awake frame
# paints her eyes open and a small open mouth.
SNORE_Z_BOXES = [
    (545, 70, 588, 118), (590, 100, 628, 146), (728, 180, 772, 226),
    (790, 140, 836, 195), (838, 125, 882, 178), (888, 95, 938, 153),
]
# Closed eyes (her right, her left) and the open mouth.
FACE_BOXES = [(664, 145, 690, 169), (700, 147, 732, 165), (660, 188, 703, 215)]
OPEN_EYES = [((667, 147, 687, 165), (673, 151, 683, 161)), ((703, 146, 729, 164), (711, 150, 722, 161))]
O_MOUTH = (676, 198, 690, 211)
EYE_WHITE = (250, 248, 240)
FACE_LINE = (40, 22, 24)
MOUTH_DARK = (92, 22, 34)


def is_snore_z(rgb: tuple[int, int, int]) -> bool:
    """The Z's are dark navy outlines around a pale lavender fill."""
    r, g, b = rgb
    return (max(rgb) < 90 and b > r + 10) or (r > 150 and g > 150 and b - r >= 6)


def inpaint(image: Image.Image, mask: set[tuple[int, int]]) -> None:
    """Fill masked pixels from the outside in with the average of known neighbours."""
    px = image.load()
    todo = set(mask)
    while todo:
        filled = {}
        for x, y in todo:
            known = [
                px[n]
                for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
                if n not in todo and 0 <= n[0] < image.width and 0 <= n[1] < image.height
            ]
            if known:
                filled[(x, y)] = tuple(sum(c[i] for c in known) // len(known) for i in range(3))
        if not filled:
            return
        for point, color in filled.items():
            px[point] = color
        todo -= filled.keys()


def desk_asleep(wake: Image.Image) -> Image.Image:
    image = wake.convert("RGB")
    px = image.load()
    mask: set[tuple[int, int]] = set()
    for x0, y0, x1, y1 in SNORE_Z_BOXES:
        for x in range(x0, x1):
            for y in range(y0, y1):
                if is_snore_z(px[x, y]):
                    # Grow by 2 px to catch the soft edge around each letter.
                    mask.update((x + dx, y + dy) for dx in range(-2, 3) for dy in range(-2, 3))
    inpaint(image, mask)
    return image


def desk_awake(asleep: Image.Image) -> Image.Image:
    image = asleep.copy()
    inpaint(image, {(x, y) for x0, y0, x1, y1 in FACE_BOXES for x in range(x0, x1) for y in range(y0, y1)})
    draw = ImageDraw.Draw(image)
    for eye, pupil in OPEN_EYES:
        draw.ellipse(eye, fill=EYE_WHITE, outline=FACE_LINE, width=2)
        draw.ellipse(pupil, fill=FACE_LINE)
    draw.ellipse(O_MOUTH, fill=MOUTH_DARK, outline=FACE_LINE, width=2)
    return image
```

In `main()`, replace `wake_background(ASSETS / "usnula_zaga.jfif").save(OUT / "wake.png")` with:

```python
    wake = wake_background(ASSETS / "usnula_zaga.jfif")
    wake.save(OUT / "wake.png")
    asleep = desk_asleep(wake)
    asleep.save(OUT / "desk-asleep.png")
    desk_awake(asleep).save(OUT / "desk-awake.png")
```

- [ ] **Step 2: Generate and check**

Run: `python scripts/make-sprites.py && git status --short public/sprites`
Expected: two new files `desk-asleep.png`, `desk-awake.png`; no existing sprite modified. Open both (and a 2× crop of the face, box 520,60–960,260): no Z's left, the cheek looks like skin, the awake frame has two open eyes and an "o" mouth. Small smudges on the wall are acceptable.

- [ ] **Step 3: Load them**

`src/assets.ts`: add `deskAsleep: "desk-asleep",` and `deskAwake: "desk-awake",` to `SPRITES`, and after the wake `loadSprite`:

```ts
  k.loadSprite(SPRITES.deskAsleep, `sprites/${SPRITES.deskAsleep}.png`);
  k.loadSprite(SPRITES.deskAwake, `sprites/${SPRITES.deskAwake}.png`);
```

Run: `npm run build` — Expected: success.

- [ ] **Step 4: Commit** — `git add scripts/make-sprites.py src/assets.ts public/sprites/desk-asleep.png public/sprites/desk-awake.png` and commit `feat: desk art for Zaga asleep and awake`.

---

### Task 2: Choice menu in the dialog

**Files:** Modify `src/dialog.ts`, Test `src/dialog.test.ts`.

**Interfaces — Produces:** `DialogState` gains `choices: string[] | null; selected: number`; `openChoices(state, options: readonly string[]): void`; `currentChoices(state): readonly string[] | null`; `moveChoice(state, delta: number): void`; `pickChoice(state, index?: number): number | null`; `choiceAt(y: number, top: number, rowHeight: number, count: number): number | null`. Consumes `moveSelection` from `src/titleMenu.ts`.

- [ ] **Step 1: Failing tests** — append to `src/dialog.test.ts` (extend the import with `choiceAt, currentChoices, moveChoice, openChoices, pickChoice`):

```ts
describe("dialog choices", () => {
  const open = () => {
    const state = createDialog();
    openChoices(state, ["a", "b", "c"]);
    return state;
  };

  it("blocks movement and shows the options instead of a line", () => {
    const state = open();
    expect(isMovementBlocked(state)).toBe(true);
    expect(currentLine(state)).toBeNull();
    expect(currentChoices(state)).toEqual(["a", "b", "c"]);
    expect(state.selected).toBe(0);
  });

  it("moves the marker and wraps both ways", () => {
    const state = open();
    moveChoice(state, -1);
    expect(state.selected).toBe(2);
    moveChoice(state, 1);
    expect(state.selected).toBe(0);
  });

  it("is not closed by advancing", () => {
    const state = open();
    advanceDialog(state);
    expect(currentChoices(state)).toEqual(["a", "b", "c"]);
  });

  it("picks the marked option and unblocks", () => {
    const state = open();
    moveChoice(state, 1);
    expect(pickChoice(state)).toBe(1);
    expect(isMovementBlocked(state)).toBe(false);
    expect(currentChoices(state)).toBeNull();
  });

  it("picks a given option, ignoring out-of-range ones", () => {
    const state = open();
    expect(pickChoice(state, 5)).toBeNull();
    expect(isMovementBlocked(state)).toBe(true);
    expect(pickChoice(state, 2)).toBe(2);
  });

  it("picks nothing when no choice is open", () => {
    const state = createDialog();
    openDialog(state, ["line"]);
    expect(pickChoice(state)).toBeNull();
    expect(currentLine(state)).toBe("line");
  });

  it("drops the options when a dialog opens", () => {
    const state = open();
    openDialog(state, ["line"]);
    expect(currentChoices(state)).toBeNull();
    expect(currentLine(state)).toBe("line");
  });
});

describe("choiceAt", () => {
  it("maps a y position to an option row", () => {
    expect(choiceAt(100, 100, 12, 3)).toBe(0);
    expect(choiceAt(111.9, 100, 12, 3)).toBe(0);
    expect(choiceAt(112, 100, 12, 3)).toBe(1);
    expect(choiceAt(135, 100, 12, 3)).toBe(2);
    expect(choiceAt(99, 100, 12, 3)).toBeNull();
    expect(choiceAt(136, 100, 12, 3)).toBeNull();
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/dialog.test.ts` — Expected: FAIL (exports missing).

- [ ] **Step 3: Implement** — `src/dialog.ts`:

```ts
import { moveSelection } from "./titleMenu";

export type DialogState = {
  lines: string[];
  index: number;
  open: boolean;
  // Options to pick from instead of lines, or null.
  choices: string[] | null;
  selected: number;
};
```

`createDialog` returns `{ lines: [], index: 0, open: false, choices: null, selected: 0 }`; `openDialog` also sets `state.choices = null; state.selected = 0;` in both branches; `advanceDialog` starts with `if (!state.open || state.choices) { return; }`. Add:

```ts
export function openChoices(state: DialogState, options: readonly string[]): void {
  if (options.length === 0) {
    openDialog(state, []);
    return;
  }
  state.lines = [];
  state.index = 0;
  state.open = true;
  state.choices = [...options];
  state.selected = 0;
}

export function currentChoices(state: DialogState): readonly string[] | null {
  return state.open ? state.choices : null;
}

export function moveChoice(state: DialogState, delta: number): void {
  if (state.choices) {
    state.selected = moveSelection(state.selected, delta, state.choices.length);
  }
}

// Closes the options and returns the picked index (the marked one by default).
export function pickChoice(state: DialogState, index = state.selected): number | null {
  if (!state.open || !state.choices || index < 0 || index >= state.choices.length) {
    return null;
  }
  state.choices = null;
  state.selected = 0;
  state.open = false;
  return index;
}

// Which option row a tap at height y hits, for rows starting at top.
export function choiceAt(y: number, top: number, rowHeight: number, count: number): number | null {
  const row = Math.floor((y - top) / rowHeight);
  return row >= 0 && row < count ? row : null;
}
```

- [ ] **Step 4: Run** `npx vitest run src/dialog.test.ts` — Expected: PASS. Then `npx tsc --noEmit` — clean.

- [ ] **Step 5: Commit** `feat: choice menu in the dialog box`.

---

### Task 3: Talk rounds

**Files:** Modify `src/data/hunt.ts`; Create `src/talk.ts`, `src/talk.test.ts`.

**Interfaces — Produces:** `type TalkChoice = { shout: string; reply: string }`, `TALK_ROUNDS: readonly (readonly TalkChoice[])[]`, `FOUND_LINE` (data); `MAX_SHOUT_CHARS = 33`, `type TalkState = { round: number }`, `createTalk()`, `isTalkDone(state, rounds?)`, `talkChoices(state, rounds?): string[] | null`, `talkPick(state, index, rounds?): string[] | null` (talk.ts; `rounds` defaults to `TALK_ROUNDS`).

- [ ] **Step 1: Data** — append to `src/data/hunt.ts`:

```ts
export const FOUND_LINE = "There she is, fast asleep in the office!";

export type TalkChoice = { shout: string; reply: string };

// The talk once she is found: each round the crowd picks one shout and she
// answers it, a little more awake each round. Shouts fit one dialog line.
export const TALK_ROUNDS: readonly (readonly TalkChoice[])[] = [
  [
    { shout: "Budite se, na posao!", reply: "Mmm... five more minutes..." },
    { shout: "The press is outside!", reply: "Tell them I'm in a meeting... zzz" },
    { shout: "Cases are piling up!", reply: "Let them pile... piles are comfy..." },
  ],
  [
    { shout: "Two years, no answer!", reply: "Who is shouting? It's not even noon..." },
    { shout: "The citizens are waiting!", reply: "Waiting builds character... zzz" },
    { shout: "We brought coffee!", reply: "Coffee...? No... too early..." },
  ],
  [
    { shout: "We are not leaving!", reply: "Fine, fine... I'm getting up!" },
    { shout: "The whole country sees you!", reply: "The whole country? ...Even TV?!" },
    { shout: "Budite se, na posao!", reply: "Alright! I'm awake! I'm awake!" },
  ],
];
```

- [ ] **Step 2: Failing tests** — `src/talk.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TALK_ROUNDS, type TalkChoice } from "./data/hunt";
import { createTalk, isTalkDone, MAX_SHOUT_CHARS, talkChoices, talkPick } from "./talk";

const rounds: TalkChoice[][] = [
  [
    { shout: "a1", reply: "r-a1" },
    { shout: "b1", reply: "r-b1" },
  ],
  [
    { shout: "a2", reply: "r-a2" },
    { shout: "b2", reply: "r-b2" },
  ],
];

describe("talk", () => {
  it("offers the current round's shouts", () => {
    const talk = createTalk();
    expect(talkChoices(talk, rounds)).toEqual(["a1", "b1"]);
  });

  it("answers a pick with the shout and her reply, then moves on", () => {
    const talk = createTalk();
    expect(talkPick(talk, 1, rounds)).toEqual(["b1", "r-b1"]);
    expect(talkChoices(talk, rounds)).toEqual(["a2", "b2"]);
  });

  it("is done after the last round", () => {
    const talk = createTalk();
    talkPick(talk, 0, rounds);
    expect(isTalkDone(talk, rounds)).toBe(false);
    talkPick(talk, 0, rounds);
    expect(isTalkDone(talk, rounds)).toBe(true);
    expect(talkChoices(talk, rounds)).toBeNull();
    expect(talkPick(talk, 0, rounds)).toBeNull();
  });

  it("ignores a pick that is not on offer", () => {
    const talk = createTalk();
    expect(talkPick(talk, 2, rounds)).toBeNull();
    expect(talkPick(talk, -1, rounds)).toBeNull();
    expect(talk.round).toBe(0);
  });
});

describe("TALK_ROUNDS", () => {
  it("has 3 rounds of 3 choices", () => {
    expect(TALK_ROUNDS).toHaveLength(3);
    expect(TALK_ROUNDS.every((round) => round.length === 3)).toBe(true);
  });

  it("keeps every shout on one dialog line and every reply non-empty", () => {
    for (const choice of TALK_ROUNDS.flat()) {
      expect(choice.shout.length).toBeGreaterThan(0);
      expect(choice.shout.length).toBeLessThanOrEqual(MAX_SHOUT_CHARS);
      expect(choice.reply.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run** `npx vitest run src/talk.test.ts` — Expected: FAIL (no `./talk`).

- [ ] **Step 4: Implement** — `src/talk.ts`:

```ts
import { TALK_ROUNDS, type TalkChoice } from "./data/hunt";

// "> " plus the shout fits one 284-unit dialog line at 8 units per letter.
export const MAX_SHOUT_CHARS = 33;

type Rounds = readonly (readonly TalkChoice[])[];

export type TalkState = { round: number };

export function createTalk(): TalkState {
  return { round: 0 };
}

export function isTalkDone(state: TalkState, rounds: Rounds = TALK_ROUNDS): boolean {
  return state.round >= rounds.length;
}

export function talkChoices(state: TalkState, rounds: Rounds = TALK_ROUNDS): string[] | null {
  return isTalkDone(state, rounds) ? null : rounds[state.round].map((choice) => choice.shout);
}

// The crowd's shout and her reply for the picked line; null if not on offer.
export function talkPick(state: TalkState, index: number, rounds: Rounds = TALK_ROUNDS): string[] | null {
  const choice = isTalkDone(state, rounds) ? undefined : rounds[state.round][index];
  if (!choice) {
    return null;
  }
  state.round += 1;
  return [choice.shout, choice.reply];
}
```

- [ ] **Step 5: Run** `npx vitest run src/talk.test.ts` — Expected: PASS.

- [ ] **Step 6: Commit** `feat: three-round talk with Zaga`.

---

### Task 4: Map view talk API

**Files:** Modify `src/scenes/mapView.ts`, `src/scenes/overworld.ts`, `src/scenes/hunt.ts`.

**Interfaces — Consumes:** Task 2 choice functions. **Produces:**

```ts
export type MapTalk = {
  // Lines in the dialog box; shoutFirst puts the leader in the shout pose on
  // the first line; then runs after the last line closes.
  say(lines: readonly string[], options?: { shoutFirst?: boolean; then?: () => void }): void;
  // Options in the dialog box; then gets the picked index.
  ask(options: readonly string[], then: (index: number) => void): void;
};
export type MapViewHooks = {
  leaderSprite: string;
  hudText: () => string;
  officeMark: (id: string) => OfficeMark;
  // The leader stepped onto an office.
  onVisit: (id: string, talk: MapTalk) => void;
  onFrame?: (frame: LeaderFrame) => void;
};
```

`introLines`, `visitLines`, `onDialogEnd` are removed. No behaviour change for Wake the offices.

- [ ] **Step 1: mapView**
  1. Replace the hook types with the block above (keep `OfficeMark`, `LeaderFrame`). Import `choiceAt, currentChoices, moveChoice, openChoices, pickChoice` from `../dialog`. Add `const CHOICE_ROW = 12; // 8-unit text + 4 line spacing`.
  2. After `const shout = createShout();` add:
     ```ts
     // The line that shows the shout pose, and what runs when the open dialog
     // or choice closes.
     let shoutLine: string | null = null;
     let afterDialog: (() => void) | null = null;
     let afterChoice: ((index: number) => void) | null = null;
     ```
  3. Replace `refreshDialog`, `startVisit` and `next` with:
     ```ts
     function showBox(text: string): void {
       dialogBox.opacity = 1;
       dialogBox.outline.width = 1;
       dialogText.text = text;
     }

     function refreshDialog(): void {
       hud.text = hooks.hudText();
       const choices = currentChoices(dialog);
       if (choices) {
         showBox(choices.map((choice, i) => (i === dialog.selected ? `> ${choice}` : `  ${choice}`)).join("\n"));
         return;
       }
       const text = currentLine(dialog);
       if (text !== null) {
         showBox(text);
         return;
       }
       dialogBox.opacity = 0;
       dialogBox.outline.width = 0;
       dialogText.text = "";
       const then = afterDialog;
       afterDialog = null;
       then?.();
     }

     const talk: MapTalk = {
       say(lines, options = {}) {
         walkTarget = null;
         shoutLine = options.shoutFirst ? (lines[0] ?? null) : null;
         afterDialog = options.then ?? null;
         openDialog(dialog, lines);
         refreshDialog();
       },
       ask(options, then) {
         walkTarget = null;
         shoutLine = null;
         afterChoice = then;
         openChoices(dialog, options);
         refreshDialog();
       },
     };

     function startVisit(id: string): void {
       hooks.onVisit(id, talk);
     }

     // A tap advances dialog and also arrives as a touch; remember when, so the
     // tap that closes the last line does not also press a touch control.
     let lastAdvanceTime = -1;

     function choose(index: number): void {
       const picked = pickChoice(dialog, index);
       if (picked === null) {
         return;
       }
       lastAdvanceTime = k.time();
       const then = afterChoice;
       afterChoice = null;
       refreshDialog();
       then?.(picked);
     }

     function next(): void {
       if (!isMovementBlocked(dialog)) {
         return;
       }
       if (currentChoices(dialog)) {
         choose(dialog.selected);
         return;
       }
       lastAdvanceTime = k.time();
       advanceDialog(dialog);
       refreshDialog();
     }
     ```
     (Delete the old `lastAdvanceTime` declaration and comment that sat above `next`.)
  4. Replace `k.onClick(next);` with:
     ```ts
     k.onClick(() => {
       const choices = currentChoices(dialog);
       if (!choices) {
         next();
         return;
       }
       // A click or tap picks the option row under it; elsewhere does nothing.
       const row = choiceAt(toUnits(k.mousePos()).y, dialogText.pos.y, CHOICE_ROW, choices.length);
       if (row !== null) {
         choose(row);
       }
     });
     for (const [keys, delta] of [[["up", "w"], -1], [["down", "s"], 1]] as const) {
       for (const key of keys) {
         k.onKeyPress(key, () => {
           if (currentChoices(dialog)) {
             moveChoice(dialog, delta);
             refreshDialog();
           }
         });
       }
     }
     ```
     Move the `toUnits` const above this block if it is declared later.
  5. In `k.onUpdate`, replace `currentLine(dialog) === SHOUT_LINE` with `(shoutLine !== null && currentLine(dialog) === shoutLine)`.
  6. Replace the final `openDialog(dialog, hooks.introLines ?? []);` + `refreshDialog();` with `refreshDialog();`.
  7. `npx tsc --noEmit --noUnusedLocals` — fix leftovers only in mapView (overworld/hunt fail until Step 2).

- [ ] **Step 2: Overworld** — replace its `visitLines` and `onDialogEnd` with (add `import { withShout } from "../shout";`):

```ts
      onVisit: (id, talk) => {
        const office = getOffice(id);
        if (!office) {
          return;
        }
        visitOffice(session.score, id);
        talk.say(withShout(office.lines), {
          shoutFirst: true,
          then: () => {
            if (isReadyForEnding(session.score.visited, OFFICE_IDS)) {
              k.go("ending");
            }
          },
        });
      },
```

- [ ] **Step 3: Hunt (old rules, new hook)** — in `src/scenes/hunt.ts` remove `introLines` (the intro moves to the desk scene in Task 6) and replace `visitLines`/`onDialogEnd` with:

```ts
      onVisit: (id, talk) => {
        const visit = huntVisit(hunt, id);
        if (!visit) {
          return;
        }
        talk.say(withShout(visit.lines), {
          shoutFirst: true,
          then: () => {
            if (isAwake(hunt)) {
              session.hunt = huntResult(hunt);
              k.go("huntEnding");
            }
          },
        });
      },
```

(import `withShout`; drop the `HUNT_INTRO` import).

- [ ] **Step 4: Verify** — `npx tsc --noEmit --noUnusedLocals && npm test && npm run build`, e2e via the 5181 temp config; Expected: all pass. Manual (5180): Wake the offices — visit an office (shout pose on the shout line, reply, score +, check mark), revisit (no points). Find Zaga — an empty office gives a hint.

- [ ] **Step 5: Commit** `refactor: map view talk API with say and ask`.

---

### Task 5: Fixed crowd, found Zaga, talk on the map

**Files:** Modify `src/data/hunt.ts`, `src/hunt.ts`, `src/hunt.test.ts`, `src/crowd.ts`, `src/crowd.test.ts`, `src/session.ts`, `src/session.test.ts`, `src/scenes/hunt.ts`.

**Interfaces — Produces:** `FOLLOWERS = 2`; `HuntState = { positions; hidden: string; visits: number; searched: string[]; found: boolean }`; `huntVisit(state, id): HuntVisit | null` (found → `{ found: true, lines: [FOUND_LINE] }`, null once found); `huntResult(state): HuntResult`; `HuntResult = { visits: number }`. Removed: `START_FOLLOWERS`, `MAX_FOLLOWERS`, `WAKE_*`, `MUMBLES`, `FLEE_LINE`, `wakeGain`, `mumbleFor`, `isAwake`, `crowdSize`, `HuntState.rng/wake/followers/seen`.

- [ ] **Step 1: Failing tests**
  - `src/hunt.test.ts` — replace the whole file with:

```ts
import { describe, expect, it } from "vitest";
import { FOUND_LINE, MIN_HIDE_DISTANCE } from "./data/hunt";
import type { Point } from "./geo";
import { hintFor } from "./hint";
import { createHunt, huntResult, huntVisit, pickHideout } from "./hunt";
import { officePositions, spawnPoint } from "./officeLayout";

// Offices o0..o(n-1) on a line, 100 units apart, starting at the origin.
function line(n: number): Map<string, Point> {
  return new Map(Array.from({ length: n }, (_, i) => [`o${i}`, { x: i * 100, y: 0 }] as const));
}
const start: Point = { x: 0, y: 0 };
const first = () => 0;
const last = () => 0.999;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

describe("pickHideout", () => {
  it("picks only offices far enough away", () => {
    expect(pickHideout(line(10), start, null, first)).toBe("o3");
    expect(pickHideout(line(10), start, null, last)).toBe("o9");
  });

  it("falls back to any other office when none is far enough", () => {
    const positions = new Map([["a", start], ["b", { x: 10, y: 0 }]]);
    expect(pickHideout(positions, start, "a", first)).toBe("b");
  });
});

describe("createHunt", () => {
  it("starts unfound with no visits", () => {
    const hunt = createHunt(line(10), start, first);
    expect(hunt).toMatchObject({ hidden: "o3", visits: 0, searched: [], found: false });
  });

  it("hides her far from Beograd on the real map", () => {
    const positions = officePositions();
    for (let i = 0; i < 50; i++) {
      const hunt = createHunt(positions, spawnPoint(), Math.random);
      expect(distance(positions.get(hunt.hidden) as Point, spawnPoint())).toBeGreaterThanOrEqual(MIN_HIDE_DISTANCE);
    }
  });
});

describe("huntVisit", () => {
  it("gives a hint at an empty office and marks it searched once", () => {
    const hunt = createHunt(line(10), start, first);
    expect(huntVisit(hunt, "o0")).toEqual({ found: false, lines: [hintFor({ x: 0, y: 0 }, { x: 300, y: 0 })] });
    huntVisit(hunt, "o0");
    expect(hunt.visits).toBe(2);
    expect(hunt.searched).toEqual(["o0"]);
  });

  it("finds her at her office", () => {
    const hunt = createHunt(line(10), start, first);
    expect(huntVisit(hunt, "o3")).toEqual({ found: true, lines: [FOUND_LINE] });
    expect(hunt.found).toBe(true);
    expect(hunt.visits).toBe(1);
  });

  it("ignores every office once she is found", () => {
    const hunt = createHunt(line(10), start, first);
    huntVisit(hunt, "o3");
    expect(huntVisit(hunt, "o3")).toBeNull();
    expect(huntVisit(hunt, "o0")).toBeNull();
    expect(hunt.visits).toBe(1);
  });

  it("ignores unknown offices", () => {
    const hunt = createHunt(line(10), start, first);
    expect(huntVisit(hunt, "nowhere")).toBeNull();
    expect(hunt.visits).toBe(0);
  });
});

describe("huntResult", () => {
  it("reports the visits it took", () => {
    const hunt = createHunt(line(10), start, first);
    huntVisit(hunt, "o0");
    huntVisit(hunt, "o1");
    huntVisit(hunt, "o3");
    expect(huntResult(hunt)).toEqual({ visits: 3 });
  });
});
```

  - `src/session.test.ts`: in "hunt result", use `getSession().hunt = { visits: 9 };`.
  - `src/crowd.test.ts`: replace `MAX_FOLLOWERS` with `FOLLOWERS` (import and the "keeps only the path" test).

- [ ] **Step 2: Run** `npx vitest run src/hunt.test.ts src/crowd.test.ts src/session.test.ts` — Expected: FAIL (`FOUND_LINE`/`FOLLOWERS` have no export, hunt shape differs).

- [ ] **Step 3: Implement**
  - `src/data/hunt.ts`: delete `START_FOLLOWERS`, `MAX_FOLLOWERS`, `WAKE_BASE`, `WAKE_PER_FOLLOWER`, `WAKE_FULL`, `MUMBLES`, `FLEE_LINE` (and their comments); add after `HUNT_TITLE`:
    ```ts
    // The crowd: the leader and this many followers.
    export const FOLLOWERS = 2;
    ```
  - `src/crowd.ts`: import `FOLLOWERS` instead of `MAX_FOLLOWERS`; `KEEP_LENGTH = (FOLLOWERS + 1) * FOLLOWER_SPACING`.
  - `src/session.ts`: `export type HuntResult = { visits: number };`
  - `src/hunt.ts`: replace the whole file with:
    ```ts
    import { FOUND_LINE, MIN_HIDE_DISTANCE } from "./data/hunt";
    import type { Point } from "./geo";
    import { hintFor } from "./hint";
    import type { HuntResult } from "./session";

    // Random number in [0, 1); scenes pass Math.random, tests a fixed value.
    export type Rng = () => number;

    export type HuntState = {
      positions: ReadonlyMap<string, Point>;
      // The office she sleeps in.
      hidden: string;
      visits: number;
      // Empty offices searched ("?" marks).
      searched: string[];
      found: boolean;
    };

    export type HuntVisit = { found: boolean; lines: string[] };

    const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

    // A random office far enough from `from`, never `exclude`; any other office
    // when none is far enough.
    export function pickHideout(
      positions: ReadonlyMap<string, Point>,
      from: Point,
      exclude: string | null,
      rng: Rng,
    ): string {
      const others = [...positions.keys()].filter((id) => id !== exclude);
      const far = others.filter((id) => distance(positions.get(id) as Point, from) >= MIN_HIDE_DISTANCE);
      const pool = far.length > 0 ? far : others;
      return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
    }

    export function createHunt(positions: ReadonlyMap<string, Point>, start: Point, rng: Rng): HuntState {
      return { positions, hidden: pickHideout(positions, start, null, rng), visits: 0, searched: [], found: false };
    }

    // The crowd reaches an office: a hint, or she is found; null when nothing
    // happens (unknown office, or she was already found).
    export function huntVisit(state: HuntState, id: string): HuntVisit | null {
      const pos = state.positions.get(id);
      if (!pos || state.found) {
        return null;
      }
      state.visits += 1;
      if (id === state.hidden) {
        state.found = true;
        return { found: true, lines: [FOUND_LINE] };
      }
      if (!state.searched.includes(id)) {
        state.searched.push(id);
      }
      return { found: false, lines: [hintFor(pos, state.positions.get(state.hidden) as Point)] };
    }

    // What the ending shows.
    export function huntResult(state: HuntState): HuntResult {
      return { visits: state.visits };
    }
    ```

- [ ] **Step 4: Run** `npx vitest run` — Expected: PASS (tsc errors in the hunt scene are fixed next).

- [ ] **Step 5: Hunt scene** — replace `src/scenes/hunt.ts` with:

```ts
import { SPRITE_SCALE, SPRITES } from "../assets";
import { createTrail, followerPositions, pushTrail } from "../crowd";
import { FOLLOWERS, HUNT_TITLE, TALK_ROUNDS } from "../data/hunt";
import type { Point } from "../geo";
import { createHunt, huntResult, huntVisit } from "../hunt";
import { k } from "../kaplayContext";
import { officePositions, spawnPoint } from "../officeLayout";
import type { PrincessAnim } from "../princess";
import { getSession } from "../session";
import { withShout } from "../shout";
import { createTalk, talkChoices, talkPick } from "../talk";
import { createMapView, type MapTalk } from "./mapView";

// Shirt tints so the crowd looks mixed (the sprite's shirt is near-white).
const FOLLOWER_TINTS: readonly [number, number, number][] = [
  [255, 214, 214],
  [214, 232, 255],
];
// Small sideways offsets so followers on a straight path do not cover each other.
const SIDE_STEP = [3, -3];
// Sleeping Zaga stands beside her office; small z's float up from her head.
const ZAGA_OFFSET: Point = { x: 12, y: 6 };
const SNORE_EVERY = 0.7;
const SNORE_LIFE = 2;

// Find Zaga: three protesters search the offices for the sleeping princess,
// then talk her awake.
export function registerHuntScene(): void {
  k.scene("hunt", () => {
    const session = getSession();
    const start = spawnPoint();
    const positions = officePositions();
    const hunt = createHunt(positions, start, Math.random);
    const talk = createTalk();
    const trail = createTrail(start);
    const followers = FOLLOWER_TINTS.slice(0, FOLLOWERS).map((tint) =>
      k.add([
        k.sprite(SPRITES.protester, { anim: "idle" }),
        k.scale(SPRITE_SCALE),
        k.pos(start.x, start.y),
        k.anchor("bot"),
        k.color(...tint),
        k.z(9),
        { playing: "idle" as PrincessAnim },
      ]),
    );

    function showZaga(): void {
      const office = positions.get(hunt.hidden) as Point;
      const zaga = k.add([
        k.sprite(SPRITES.princess, { anim: "idle" }),
        k.scale(SPRITE_SCALE),
        k.pos(office.x + ZAGA_OFFSET.x, office.y + ZAGA_OFFSET.y),
        k.anchor("bot"),
        k.z(8),
      ]);
      k.loop(SNORE_EVERY, () => {
        const z = k.add([
          k.text("z", { size: 6 }),
          k.pos(zaga.pos.x + 4, zaga.pos.y - 24),
          k.anchor("center"),
          k.color(40, 40, 96),
          k.opacity(1),
          k.z(21),
          { age: 0 },
        ]);
        z.onUpdate(() => {
          z.age += k.dt();
          z.move(5, -10);
          z.opacity = Math.max(0, 1 - z.age / SNORE_LIFE);
          if (z.age >= SNORE_LIFE) {
            z.destroy();
          }
        });
      });
    }

    function nextRound(view: MapTalk): void {
      const choices = talkChoices(talk);
      if (!choices) {
        session.hunt = huntResult(hunt);
        k.go("huntEnding");
        return;
      }
      view.ask(choices, (index) => {
        view.say(talkPick(talk, index) ?? [], { shoutFirst: true, then: () => nextRound(view) });
      });
    }

    createMapView({
      leaderSprite: SPRITES.protester,
      hudText: () =>
        hunt.found
          ? `Round ${Math.min(talk.round + 1, TALK_ROUNDS.length)}/${TALK_ROUNDS.length}`
          : `${HUNT_TITLE}  Visits ${hunt.visits}`,
      officeMark: (id) => (hunt.searched.includes(id) ? "question" : null),
      onVisit: (id, view) => {
        const visit = huntVisit(hunt, id);
        if (!visit) {
          return;
        }
        if (!visit.found) {
          view.say(withShout(visit.lines), { shoutFirst: true });
          return;
        }
        showZaga();
        view.say(visit.lines, { then: () => nextRound(view) });
      },
      onFrame: (frame) => {
        pushTrail(trail, frame.pos);
        const spots = followerPositions(trail, frame.pos, followers.length);
        followers.forEach((follower, i) => {
          follower.pos = k.vec2(spots[i].x + SIDE_STEP[i % SIDE_STEP.length], spots[i].y);
          follower.flipX = frame.facing === "left";
          if (follower.playing !== frame.anim) {
            follower.playing = frame.anim;
            follower.play(frame.anim);
          }
        });
      },
    });
  });
}
```

  - `src/scenes/huntEnding.ts`: drop the crowd from the result line for now: `` `${result.visits} visits` `` (Task 6 replaces the scene).

- [ ] **Step 6: Verify** — `npx tsc --noEmit --noUnusedLocals && npm test && npm run build` + e2e (5181). Manual (5180): crowd is 3 and never grows; HUD `Find Zaga  Visits N`; follow the hints to her office; she appears with z's; 3 rounds of choices (keys, click on a row, click outside does nothing); after round 3 the (temporary) ending shows.

- [ ] **Step 7: Commit** `feat: fixed crowd of three and a three-round talk with Zaga`.

---

### Task 6: Desk scenes

**Files:** Create `src/deskWake.ts`, `src/deskWake.test.ts`, `src/scenes/desk.ts`, `src/scenes/huntIntro.ts`; Modify `src/scenes/huntEnding.ts`, `src/data/hunt.ts`, `src/data/story.ts` (`MODES` hunt scene → `huntIntro`), `src/main.ts`.

**Interfaces — Produces:** `WAKE_PHASES = ["asleep", "burst", "awake", "text"] as const`, `type WakePhase`, `WAKE_TIMES = { burst: 1.6, awake: 2.0, text: 3.0 }`, `wakePhase(t: number): WakePhase`, `phasesToEnter(reached: number, t: number): WakePhase[]`; `addSnore(): { burst(): void }`, `DESK_HEAD`; scene `huntIntro`.

- [ ] **Step 1: Failing tests** — `src/deskWake.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { phasesToEnter, wakePhase } from "./deskWake";

describe("wakePhase", () => {
  it("runs asleep, burst, awake, text at 1.6 s, 2.0 s, 3.0 s", () => {
    expect(wakePhase(0)).toBe("asleep");
    expect(wakePhase(1.59)).toBe("asleep");
    expect(wakePhase(1.6)).toBe("burst");
    expect(wakePhase(1.99)).toBe("burst");
    expect(wakePhase(2)).toBe("awake");
    expect(wakePhase(2.99)).toBe("awake");
    expect(wakePhase(3)).toBe("text");
    expect(wakePhase(60)).toBe("text");
  });
});

describe("phasesToEnter", () => {
  it("enters each new phase once", () => {
    expect(phasesToEnter(0, 1)).toEqual([]);
    expect(phasesToEnter(0, 1.7)).toEqual(["burst"]);
    expect(phasesToEnter(1, 1.7)).toEqual([]);
  });

  it("enters skipped phases in order", () => {
    expect(phasesToEnter(0, 10)).toEqual(["burst", "awake", "text"]);
    expect(phasesToEnter(2, 10)).toEqual(["text"]);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/deskWake.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement** — `src/deskWake.ts`:

```ts
// The ending's wake-up timeline at the desk, in seconds from the scene start.
export const WAKE_PHASES = ["asleep", "burst", "awake", "text"] as const;
export type WakePhase = (typeof WAKE_PHASES)[number];
export const WAKE_TIMES = { burst: 1.6, awake: 2.0, text: 3.0 };

export function wakePhase(t: number): WakePhase {
  if (t < WAKE_TIMES.burst) {
    return "asleep";
  }
  if (t < WAKE_TIMES.awake) {
    return "burst";
  }
  return t < WAKE_TIMES.text ? "awake" : "text";
}

// Phases after index `reached` up to the one at time t, in order, so a
// skipped frame never skips a phase's effect.
export function phasesToEnter(reached: number, t: number): WakePhase[] {
  return WAKE_PHASES.slice(reached + 1, WAKE_PHASES.indexOf(wakePhase(t)) + 1);
}
```

Run: `npx vitest run src/deskWake.test.ts` — Expected: PASS.

- [ ] **Step 4: Copy** — in `src/data/hunt.ts` replace `HUNT_INTRO` with:

```ts
export const HUNT_INTRO: readonly string[] = [
  "Somewhere in Serbia, in one of the offices, Zaga is fast asleep.",
  "Three of you go looking for her. Shout at the offices and follow the snoring.",
];
```

and replace `HUNT_ENDING_LINE` with:

```ts
export const HUNT_ENDING_LINE = "Zaga is awake!";
export const foundIn = (visits: number) => `Found in ${visits} visits`;
```

In `src/data/story.ts` `MODES`, change `{ scene: "hunt", ... }` to `{ scene: "huntIntro", label: "Find Zaga" }`.

- [ ] **Step 5: Desk helpers** — `src/scenes/desk.ts`:

```ts
import { SPRITE_SCALE } from "../assets";
import type { Point } from "../geo";
import { k } from "../kaplayContext";

// Top of her head in the desk pictures, in game units (320x180).
export const DESK_HEAD: Point = { x: 182, y: 36 };
const Z_EVERY = 0.5;
const Z_LIFE = 2.2;

export function addDesk(sprite: string) {
  return k.add([k.sprite(sprite), k.scale(SPRITE_SCALE), k.pos(0, 0), k.opacity(1)]);
}

// Z's rise from her head, drift up-right, grow and fade. burst() flings the
// ones in the air away and stops new ones.
export function addSnore(): { burst(): void } {
  let snoring = true;
  const zs: ReturnType<typeof spawn>[] = [];
  function spawn() {
    const z = k.add([
      k.text("Z", { size: 8 }),
      k.pos(DESK_HEAD.x + 10, DESK_HEAD.y - 2),
      k.anchor("center"),
      k.color(24, 26, 60),
      k.opacity(1),
      k.scale(1),
      { age: 0, velocity: k.vec2(8 + k.rand(-3, 3), -14) },
    ]);
    z.onUpdate(() => {
      z.age += k.dt();
      z.pos = z.pos.add(z.velocity.scale(k.dt()));
      z.scale = k.vec2(1 + z.age * 0.5);
      z.opacity = Math.max(0, 1 - z.age / Z_LIFE);
      if (z.opacity <= 0) {
        z.destroy();
      }
    });
    return z;
  }
  k.loop(Z_EVERY, () => {
    if (snoring) {
      zs.push(spawn());
    }
  });
  return {
    burst() {
      snoring = false;
      for (const z of zs) {
        z.velocity = k.vec2(k.rand(-120, 120), k.rand(-120, -40));
      }
    },
  };
}

// The text box used by the desk scenes (same place as the wake scene's).
export function addDeskBox(text: string) {
  k.add([k.rect(300, 48), k.pos(10, 122), k.color(12, 10, 20), k.outline(1, k.rgb(220, 200, 140))]);
  return k.add([k.text(text, { size: 8, width: 284, lineSpacing: 4 }), k.pos(18, 130)]);
}
```

- [ ] **Step 6: Intro scene** — `src/scenes/huntIntro.ts`:

```ts
import { SPRITES } from "../assets";
import { HUNT_INTRO } from "../data/hunt";
import { ADVANCE_KEYS, advanceDialog, createDialog, currentLine, openDialog } from "../dialog";
import { k, useGameUnits } from "../kaplayContext";
import { addDesk, addDeskBox, addSnore } from "./desk";

// Find Zaga opens at her desk: asleep, snoring, while the intro is read.
export function registerHuntIntroScene(): void {
  k.scene("huntIntro", () => {
    useGameUnits();
    const dialog = createDialog();
    openDialog(dialog, HUNT_INTRO);
    addDesk(SPRITES.deskAsleep);
    addSnore();
    const line = addDeskBox(currentLine(dialog) ?? "");

    function next(): void {
      advanceDialog(dialog);
      const text = currentLine(dialog);
      if (text === null) {
        k.go("hunt");
        return;
      }
      line.text = text;
    }

    for (const key of ADVANCE_KEYS) {
      k.onKeyPress(key, next);
    }
    k.onClick(next);
  });
}
```

- [ ] **Step 7: Ending scene** — replace `src/scenes/huntEnding.ts` with:

```ts
import { SPRITES } from "../assets";
import { foundIn, HUNT_ENDING_LINE } from "../data/hunt";
import { phasesToEnter, WAKE_PHASES, type WakePhase } from "../deskWake";
import { k, useGameUnits } from "../kaplayContext";
import { getSession } from "../session";
import { addDesk, addDeskBox, addSnore, DESK_HEAD } from "./desk";

// Find Zaga ends at her desk: the Z's burst, she wakes with a start, and
// the result shows.
export function registerHuntEndingScene(): void {
  k.scene("huntEnding", () => {
    useGameUnits();
    const result = getSession().hunt;
    if (!result) {
      // Only a finished hunt leads here; anything else goes back to the title.
      k.go("title");
      return;
    }
    const asleep = addDesk(SPRITES.deskAsleep);
    const snore = addSnore();
    const started = k.time();
    let reached = 0;
    let done = false;

    function enter(phase: WakePhase): void {
      if (phase === "burst") {
        snore.burst();
        k.shake(8);
      } else if (phase === "awake") {
        addDesk(SPRITES.deskAwake);
        asleep.destroy();
        k.add([
          k.text("!", { size: 16 }),
          k.pos(DESK_HEAD.x, DESK_HEAD.y - 14),
          k.anchor("center"),
          k.color(220, 40, 40),
        ]);
      } else if (phase === "text") {
        addDeskBox(
          [HUNT_ENDING_LINE, foundIn(result.visits), k.isTouchscreen() ? "Tap for title" : "Press Enter for title"].join(
            "\n",
          ),
        );
        done = true;
      }
    }

    k.onUpdate(() => {
      for (const phase of phasesToEnter(reached, k.time() - started)) {
        reached = WAKE_PHASES.indexOf(phase);
        enter(phase);
      }
    });
    const leave = () => {
      if (done) {
        k.go("title");
      }
    };
    k.onKeyPress("enter", leave);
    k.onClick(leave);
  });
}
```

Delete the now-unused `HUNT_TITLE`? No — the hunt HUD uses it; keep.

- [ ] **Step 8: Register** — `src/main.ts`: import `registerHuntIntroScene` from `./scenes/huntIntro` and call it before `registerHuntScene();`.

- [ ] **Step 9: Verify** — `npx tsc --noEmit --noUnusedLocals && npm test && npm run build`, e2e (5181; the smoke's two Space presses now go through the desk intro). Manual (5180): Find Zaga opens on the desk with rising Z's and the intro; the map follows; after the talk the ending runs asleep → burst + shake → awake frame + "!" → text; Enter before the text does nothing, after it returns to the title.

- [ ] **Step 10: Commit** `feat: desk intro and wake-up ending for Find Zaga`.

---

### Task 7: Docs

**Files:** `docs/game-design.md`, `docs/testing.md`.

- [ ] **Step 1:** In `docs/game-design.md` replace the **Find Zaga** bullet under "## Modes" with:

```markdown
- **Find Zaga** — opens at her desk: Zaga asleep behind the PC, Z's rising,
  intro text. Then three protesters (a leader and two followers in its
  trail) search the offices. An empty office shouts back a hint: compass
  direction and "very close / not far / far away", and gets a "?" mark.
  At her office she appears asleep on the map and a 3-round talk starts:
  each round pick one of 3 lines to shout (↑/↓ + Enter, or tap a line) and
  she answers it. Every pick works. After round 3 the desk scene shows her
  waking with a start, then "Found in N visits". No points, no fail state.
```

- [ ] **Step 2:** In `docs/testing.md` replace the **Hunt** and **Crowd** bullets' growth/meter wording and add:

```markdown
- **Hunt:** she hides at least `MIN_HIDE_DISTANCE` away (also on the real
  map from Beograd); empty offices hint and get "?" once; her office marks
  her found; every office touch after that is ignored; the result is the
  visit count.
- **Crowd:** followers stand a fixed path distance behind the leader, round
  corners, do not collapse when the leader stands still, wait at the oldest
  point on a short path; the trail keeps only what the last follower needs.
- **Dialog choices:** options block movement; the marker wraps; advancing
  does not close them; a pick returns its index and unblocks; out-of-range
  picks are ignored; a tap's row maps to an option.
- **Talk:** each round offers its shouts; a pick returns shout + reply and
  moves on; done after 3 rounds; 3 × 3 choices, shouts fit one line.
- **Desk wake:** phase times; skipped frames still enter every phase in order.
```

and add `talk, deskWake` to the colocated-tests list.

- [ ] **Step 3: Commit** `docs: Find Zaga talk and desk scenes`.
