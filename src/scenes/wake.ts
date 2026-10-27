import { WAKE_LINES } from "../data/story";
import {
  ADVANCE_KEYS,
  advanceDialog,
  createDialog,
  currentLine,
  openDialog,
} from "../dialog";
import { k } from "../kaplayContext";

export function registerWakeScene(): void {
  k.scene("wake", () => {
    const dialog = createDialog();
    openDialog(dialog, WAKE_LINES);

    k.add([
      k.rect(300, 48),
      k.pos(10, 122),
      k.color(12, 10, 20),
      k.outline(1, k.rgb(220, 200, 140)),
    ]);

    const line = k.add([
      k.text(currentLine(dialog) ?? "", { size: 8, width: 280 }),
      k.pos(18, 130),
    ]);

    function next(): void {
      advanceDialog(dialog);
      const text = currentLine(dialog);
      if (text === null) {
        k.go("overworld");
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
