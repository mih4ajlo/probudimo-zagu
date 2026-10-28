import { HUNT_ENDING_LINE, HUNT_TITLE } from "../data/hunt";
import { GAME_WIDTH, k, useGameUnits } from "../kaplayContext";
import { getSession } from "../session";

export function registerHuntEndingScene(): void {
  k.scene("huntEnding", () => {
    useGameUnits();
    const result = getSession().hunt ?? { visits: 0, crowd: 0 };
    k.add([k.text(HUNT_TITLE, { size: 16 }), k.pos(GAME_WIDTH / 2, 28), k.anchor("center")]);
    k.add([k.text(HUNT_ENDING_LINE, { size: 16 }), k.pos(GAME_WIDTH / 2, 76), k.anchor("center")]);
    k.add([
      k.text(`${result.visits} visits, ${result.crowd} protesters`, { size: 8 }),
      k.pos(GAME_WIDTH / 2, 108),
      k.anchor("center"),
    ]);
    k.add([
      k.text(k.isTouchscreen() ? "Tap for title" : "Press Enter for title", { size: 8 }),
      k.pos(GAME_WIDTH / 2, 160),
      k.color(250, 220, 140),
      k.anchor("center"),
    ]);
    k.onKeyPress("enter", () => k.go("title"));
    k.onClick(() => k.go("title"));
  });
}
