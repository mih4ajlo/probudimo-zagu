import { ENDING_LINES, TITLE } from "../data/story";
import { maxScore } from "../data/lords";
import { k } from "../kaplayContext";
import { getSession } from "../session";

export function registerEndingScene(): void {
  k.scene("ending", () => {
    const session = getSession();
    k.add([
      k.text(TITLE, { size: 14 }),
      k.pos(k.width() / 2, 28),
      k.anchor("center"),
    ]);
    k.add([
      k.text(ENDING_LINES.join("\n"), { size: 8, width: 280, align: "center" }),
      k.pos(k.width() / 2, 72),
      k.anchor("center"),
    ]);
    k.add([
      k.text(`Score ${session.score.total} / ${maxScore()}`, { size: 10 }),
      k.pos(k.width() / 2, 120),
      k.anchor("center"),
    ]);
    k.add([
      k.text("Press Enter for title", { size: 8 }),
      k.pos(k.width() / 2, 150),
      k.anchor("center"),
    ]);
    k.onKeyPress("enter", () => k.go("title"));
  });
}
