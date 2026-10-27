import { TITLE } from "../data/story";
import { k } from "../kaplayContext";
import { resetSession } from "../session";

export function registerTitleScene(): void {
  k.scene("title", () => {
    k.add([
      k.text(TITLE, { size: 16 }),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
    ]);
    k.add([
      k.text("Press Enter to wake", { size: 10 }),
      k.pos(k.width() / 2, 96),
      k.anchor("center"),
    ]);

    k.onKeyPress("enter", () => {
      resetSession();
      k.go("wake");
    });
  });
}
