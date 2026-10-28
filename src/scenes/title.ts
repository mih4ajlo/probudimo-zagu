import { SPRITE_SCALE, SPRITES } from "../assets";
import { MODES, TITLE } from "../data/story";
import { GAME_WIDTH, k, useGameUnits } from "../kaplayContext";
import { resetSession } from "../session";
import { moveSelection } from "../titleMenu";

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
    // Mode menu: up/down + Enter, or tap / click a mode.
    let selected = 0;
    const options = MODES.map((mode, i) => {
      const button = k.add([
        k.rect(200, 13),
        k.pos(GAME_WIDTH / 2, 148 + i * 15),
        k.anchor("center"),
        k.opacity(0),
        k.area(),
      ]);
      const label = button.add([k.text(mode.label, { size: 8 }), k.anchor("center"), k.color(250, 220, 140)]);
      button.onClick(() => start(i));
      return label;
    });
    const refresh = () => {
      options.forEach((label, i) => {
        label.text = i === selected ? `> ${MODES[i].label} <` : MODES[i].label;
        label.color = i === selected ? k.rgb(250, 220, 140) : k.rgb(150, 140, 120);
      });
    };
    const start = (i: number) => {
      resetSession();
      k.go(MODES[i].scene);
    };
    for (const [keys, delta] of [[["up", "w"], -1], [["down", "s"], 1]] as const) {
      for (const key of keys) {
        k.onKeyPress(key, () => {
          selected = moveSelection(selected, delta, MODES.length);
          refresh();
        });
      }
    }
    k.onKeyPress("enter", () => start(selected));
    refresh();
  });
}
