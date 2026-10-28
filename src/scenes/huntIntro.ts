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
