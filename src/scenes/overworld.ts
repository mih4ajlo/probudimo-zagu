import { SPRITES } from "../assets";
import { getOffice, maxScore, OFFICE_IDS } from "../data/offices";
import { wakeHud } from "../data/story";
import { k } from "../kaplayContext";
import { isReadyForEnding } from "../progress";
import { visitOffice } from "../score";
import { getSession } from "../session";
import { withShout } from "../shout";
import { createMapView } from "./mapView";

// Wake the offices: Zaga visits every office; first visits score points.
export function registerOverworldScene(): void {
  k.scene("overworld", () => {
    const session = getSession();
    createMapView({
      leaderSprite: SPRITES.princess,
      hudText: () => wakeHud(session.score.total, maxScore(), session.score.visited.length, OFFICE_IDS.length),
      officeMark: (id) => (session.score.visited.includes(id) ? "check" : null),
      onVisit: (id, talk) => {
        const office = getOffice(id);
        if (!office) {
          return;
        }
        visitOffice(session.score, id);
        talk.say(withShout(office.lines), {
          shoutFirst: true,
          then: () => {
            if (isReadyForEnding(session.score.visited, OFFICE_IDS)) {
              k.go("ending");
            }
          },
        });
      },
    });
  });
}
