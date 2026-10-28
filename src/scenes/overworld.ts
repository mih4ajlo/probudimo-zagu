import { SPRITES } from "../assets";
import { getOffice, maxScore, OFFICE_IDS } from "../data/offices";
import { k } from "../kaplayContext";
import { isReadyForEnding } from "../progress";
import { visitOffice } from "../score";
import { getSession } from "../session";
import { createMapView } from "./mapView";

// Wake the offices: Zaga visits every office; first visits score points.
export function registerOverworldScene(): void {
  k.scene("overworld", () => {
    const session = getSession();
    createMapView({
      leaderSprite: SPRITES.princess,
      hudText: () =>
        `Score ${session.score.total}/${maxScore()}  Offices ${session.score.visited.length}/${OFFICE_IDS.length}`,
      officeMark: (id) => (session.score.visited.includes(id) ? "check" : null),
      visitLines: (id) => {
        const office = getOffice(id);
        if (!office) {
          return null;
        }
        visitOffice(session.score, id);
        return office.lines;
      },
      onDialogEnd: () => {
        if (isReadyForEnding(session.score.visited, OFFICE_IDS)) {
          k.go("ending");
        }
      },
    });
  });
}
