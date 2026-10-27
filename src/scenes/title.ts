import { SPRITE_SCALE, SPRITES } from "../assets";
import { TITLE } from "../data/story";
import { GAME_WIDTH, k, useGameUnits } from "../kaplayContext";
import { resetSession } from "../session";

export function registerTitleScene(): void {
  k.scene("title", () => {
    useGameUnits();
    k.add([
      k.text(TITLE, { size: 16 }),
      k.pos(GAME_WIDTH / 2, 20),
      k.anchor("center"),
    ]);
    k.add([
      k.sprite(SPRITES.princessPortrait),
      k.scale(SPRITE_SCALE),
      k.pos(GAME_WIDTH / 2, 34),
      k.anchor("top"),
    ]);
    k.add([
      k.text(k.isTouchscreen() ? "Tap to wake" : "Press Enter to wake", { size: 8 }),
      k.pos(GAME_WIDTH / 2, 166),
      k.anchor("center"),
      k.color(250, 220, 140),
    ]);

    const start = () => {
      resetSession();
      k.go("wake");
    };
    k.onKeyPress("enter", start);
    k.onClick(start);
  });
}
