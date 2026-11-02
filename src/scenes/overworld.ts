import { vjtAreaAt, watchArea, type AreaWatch } from "../area";
import { SPRITES } from "../assets";
import { answerCase, carriedCase, caseMark, casesResolved, tickCases, visitForCases } from "../cases";
import { carryHud, expiredLine } from "../data/cases";
import { SPLASH } from "../data/facts";
import { areaLine, OJT_AREAS } from "../data/jurisdiction";
import { getOffice, OFFICE_IDS } from "../data/offices";
import { wakeHud } from "../data/story";
import { createFacts, nextFact } from "../facts";
import type { Point } from "../geo";
import { k } from "../kaplayContext";
import { officePositions } from "../officeLayout";
import { grantCase, visitOffice, wakeMaxScore } from "../score";
import { getSession } from "../session";
import { withShout } from "../shout";
import { createMapView, type MapTalk } from "./mapView";

// Wake the offices: Zaga visits offices; first visits score points.
// Case files ride along: offices bounce them until the right demand.
// The round ends when every case is at work or expired. The narrator names
// each VJT area she enters and fills long walks with facts; the first bounce
// of each kind gets a splash once per game.
export function registerOverworldScene(): void {
  k.scene("overworld", () => {
    const session = getSession();
    const cases = session.cases;
    const positions = officePositions();
    const seats = new Map<string, Point>(Object.keys(OJT_AREAS).map((id) => [id, positions.get(id) as Point]));
    const area: AreaWatch = { current: null };
    const facts = createFacts();

    function checkEnding(): void {
      if (casesResolved(cases)) {
        k.go("ending");
      }
    }

    function demand(talk: MapTalk, demands: readonly string[]): void {
      talk.ask(demands, (index) => {
        const answer = answerCase(cases, index);
        if (!answer) {
          checkEnding();
          return;
        }
        if (answer.kind === "working") {
          grantCase(session.score, answer.caseId);
        }
        talk.say(answer.lines, { then: checkEnding });
      });
    }

    // Set once the map view exists; frames only run after that.
    let talkRef: MapTalk | null = null;
    talkRef = createMapView({
      leaderSprite: SPRITES.princess,
      hudText: () => {
        const hud = wakeHud(session.score.total, wakeMaxScore(), session.score.visited.length, OFFICE_IDS.length);
        const carried = carriedCase(cases);
        return carried ? `${hud}\n${carryHud(carried.file.title, carried.file.chain[carried.hop])}` : hud;
      },
      officeMark: (id) => (session.score.visited.includes(id) ? "check" : null),
      caseMark: (id) => caseMark(cases, id),
      carriedDust: () => carriedCase(cases)?.dust ?? null,
      onVisit: (id, talk) => {
        const office = getOffice(id);
        if (!office) {
          return;
        }
        visitOffice(session.score, id);
        const visit = visitForCases(cases, id);
        const lines = [...withShout(office.lines)];
        if (visit.kind === "pickup" || visit.kind === "bounce" || visit.kind === "busy") {
          lines.push(visit.line);
        } else if (visit.kind === "ask") {
          lines.push(visit.ask);
        }
        const teach =
          (visit.kind === "pickup" || visit.kind === "bounce") && !session.taught.includes(visit.reason)
            ? visit.reason
            : null;
        if (teach) {
          session.taught.push(teach);
        }
        talk.say(lines, {
          shoutFirst: true,
          then: () => {
            if (visit.kind === "ask") {
              demand(talk, visit.demands);
            } else if (teach) {
              talk.splash(SPLASH[teach], checkEnding);
            } else {
              checkEnding();
            }
          },
        });
      },
      onFrame: (frame) => {
        const entered = watchArea(area, vjtAreaAt(frame.pos, seats));
        if (entered) {
          talkRef?.narrate(areaLine(entered));
        } else if (frame.idleFact) {
          talkRef?.narrate(nextFact(facts).text);
        }
        const expired = tickCases(cases, frame.blocked ? 0 : k.dt());
        if (expired.length > 0) {
          talkRef?.say(expired.map((entry) => expiredLine(entry.file.title)), { then: checkEnding });
        }
      },
    });
  });
}
