import { ENDING_LINES, TITLE } from "../data/story";
import { maxScore } from "../data/lords";
import { GAME_WIDTH, k, useGameUnits } from "../kaplayContext";
import { getSession } from "../session";

export function registerEndingScene(): void {
  k.scene("ending", () => {
    useGameUnits();
    const session = getSession();
    k.add([
      k.text(TITLE, { size: 16 }),
      k.pos(GAME_WIDTH / 2, 28),
      k.anchor("center"),
    ]);
    k.add([
      k.text(ENDING_LINES.join("\n"), { size: 8, width: 296, align: "center", lineSpacing: 6 }),
      k.pos(GAME_WIDTH / 2, 72),
      k.anchor("center"),
    ]);
    k.add([
      k.text(`Score ${session.score.total} / ${maxScore()}`, { size: 16 }),
      k.pos(GAME_WIDTH / 2, 120),
      k.anchor("center"),
    ]);
    k.add([
      k.text("Press Enter for title", { size: 8 }),
      k.pos(GAME_WIDTH / 2, 160),
      k.color(250, 220, 140),
      k.anchor("center"),
    ]);
    k.onKeyPress("enter", () => k.go("title"));
  });
}
