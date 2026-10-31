import { caseReport } from "../cases";
import { nextPage, reportPage } from "../data/cases";
import { backToTitle, ENDING_LINES, scoreLine, TITLE } from "../data/story";
import { GAME_WIDTH, k, useGameUnits } from "../kaplayContext";
import { wakeMaxScore } from "../score";
import { getSession } from "../session";

// The score page, then one page per case file; the last page leads to the title.
export function registerEndingScene(): void {
  k.scene("ending", () => {
    useGameUnits();
    const session = getSession();
    const reports = caseReport(session.cases);
    const pageCount = 1 + reports.length;
    let page = 0;

    const title = k.add([k.text(TITLE, { size: 16 }), k.pos(GAME_WIDTH / 2, 28), k.anchor("center")]);
    const body = k.add([
      k.text("", { size: 8, width: 296, align: "center", lineSpacing: 6 }),
      k.pos(GAME_WIDTH / 2, 72),
      k.anchor("center"),
    ]);
    const score = k.add([
      k.text(scoreLine(session.score.total, wakeMaxScore()), { size: 16 }),
      k.pos(GAME_WIDTH / 2, 120),
      k.anchor("center"),
    ]);
    const hint = k.add([k.text("", { size: 8 }), k.pos(GAME_WIDTH / 2, 160), k.color(250, 220, 140), k.anchor("center")]);

    function show(): void {
      const first = page === 0;
      title.hidden = !first;
      score.hidden = !first;
      if (first) {
        body.text = ENDING_LINES.join("\n");
        body.pos = k.vec2(GAME_WIDTH / 2, 72);
      } else {
        const r = reports[page - 1];
        body.text = reportPage(r.title, r.result, r.reality, r.asOf);
        body.pos = k.vec2(GAME_WIDTH / 2, 80);
      }
      const touch = k.isTouchscreen();
      hint.text = page === pageCount - 1 ? backToTitle(touch) : nextPage(touch);
    }

    function advance(): void {
      page += 1;
      if (page >= pageCount) {
        k.go("title");
        return;
      }
      show();
    }

    show();
    k.onKeyPress("enter", advance);
    k.onClick(advance);
  });
}
