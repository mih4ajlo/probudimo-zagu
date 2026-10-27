import { SPRITES } from "../assets";
import { TITLE } from "../data/story";
import { k } from "../kaplayContext";
import { resetSession } from "../session";

export function registerTitleScene(): void {
  k.scene("title", () => {
    k.add([
      k.text(TITLE, { size: 16 }),
      k.pos(k.width() / 2, 20),
      k.anchor("center"),
    ]);
    k.add([
      k.sprite(SPRITES.princessPortrait),
      k.pos(k.width() / 2, 34),
      k.anchor("top"),
    ]);
    k.add([
      k.text("Press Enter to wake", { size: 8 }),
      k.pos(k.width() / 2, 166),
      k.anchor("center"),
      k.color(250, 220, 140),
    ]);

    k.onKeyPress("enter", () => {
      resetSession();
      k.go("wake");
    });
  });
}
