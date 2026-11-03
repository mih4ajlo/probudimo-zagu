import { SPRITES } from "../assets";
import { foundIn, HUNT_ENDING_LINE } from "../data/hunt";
import { backToTitle } from "../data/story";
import { checkedLine } from "../data/trail";
import { phasesToEnter, WAKE_PHASES, type WakePhase } from "../deskWake";
import { k, useGameUnits } from "../kaplayContext";
import { getSession } from "../session";
import { addDesk, addDeskBox, addSnore, DESK_HEAD } from "./desk";

// Find Zaga ends at her desk: the Z's burst, she wakes with a start, and
// the result shows: visits and her check of the file trail.
export function registerHuntEndingScene(): void {
  k.scene("huntEnding", () => {
    useGameUnits();
    const result = getSession().hunt;
    if (!result) {
      // Only a finished hunt leads here; anything else goes back to the title.
      k.go("title");
      return;
    }
    const { visits, right, total } = result;
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
          [
            HUNT_ENDING_LINE,
            foundIn(visits),
            checkedLine(right, total),
            backToTitle(k.isTouchscreen()),
          ].join("\n"),
          4,
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
