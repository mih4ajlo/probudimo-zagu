import { LORDS, type LordId } from "../data/lords";
import {
  ADVANCE_KEYS,
  advanceDialog,
  createDialog,
  currentLine,
  isMovementBlocked,
  openDialog,
} from "../dialog";
import { k, TILE } from "../kaplayContext";
import { isReadyForEnding } from "../progress";
import { getSession } from "../session";
import { visitLord } from "../score";

const SPEED = 80;

// Walls `#`, floor `.`, player spawn `@`, lords use each `lord.marker`.
const MAP = [
  "####################",
  "#..................#",
  "#..N...............#",
  "#..................#",
  "#........@.........#",
  "#..................#",
  "#...............E..#",
  "#..................#",
  "#..W...............#",
  "####################",
];

type LordTile = { lordId: LordId };

export function registerOverworldScene(): void {
  k.scene("overworld", () => {
    const session = getSession();
    const dialog = createDialog();
    const lordIds = LORDS.map((lord) => lord.id);

    const floor = () => [k.rect(TILE, TILE), k.color(48, 72, 48)];
    const lordTiles = Object.fromEntries(
      LORDS.map((lord) => [
        lord.marker,
        () => [
          k.rect(TILE, TILE),
          k.color(180, 140, 40),
          k.area(),
          k.body({ isStatic: true }),
          "lord",
          { lordId: lord.id } satisfies LordTile,
        ],
      ]),
    );

    k.addLevel(MAP, {
      tileWidth: TILE,
      tileHeight: TILE,
      tiles: {
        "#": () => [
          k.rect(TILE, TILE),
          k.color(40, 32, 56),
          k.area(),
          k.body({ isStatic: true }),
        ],
        ".": floor,
        "@": floor,
        ...lordTiles,
      },
    });

    const spawnRow = MAP.findIndex((row) => row.includes("@"));
    const spawnCol = MAP[spawnRow].indexOf("@");

    const player = k.add([
      k.rect(TILE - 2, TILE - 2),
      k.color(220, 180, 210),
      k.pos(spawnCol * TILE + TILE / 2, spawnRow * TILE + TILE / 2),
      k.anchor("center"),
      k.area(),
      k.body(),
      "player",
    ]);

    const hud = k.add([k.text(hudText(), { size: 8 }), k.pos(8, 8), k.fixed()]);

    const dialogBox = k.add([
      k.rect(300, 48),
      k.pos(10, 122),
      k.color(12, 10, 20),
      k.outline(1, k.rgb(220, 200, 140)),
      k.fixed(),
      k.opacity(0),
    ]);

    const dialogText = k.add([
      k.text("", { size: 8, width: 280 }),
      k.pos(18, 130),
      k.fixed(),
    ]);

    function hudText(): string {
      return `Score ${session.score.total}   Lords ${session.score.visited.length}/${lordIds.length}`;
    }

    function refreshDialog(): void {
      const text = currentLine(dialog);
      if (text === null) {
        dialogBox.opacity = 0;
        dialogBox.outline.width = 0;
        dialogText.text = "";
        if (isReadyForEnding(session.score.visited, lordIds)) {
          k.go("ending");
        }
        return;
      }
      dialogBox.opacity = 1;
      dialogBox.outline.width = 1;
      dialogText.text = text;
    }

    k.onCollide("player", "lord", (_player, other) => {
      if (isMovementBlocked(dialog)) {
        return;
      }
      const lord = LORDS.find((item) => item.id === (other as unknown as LordTile).lordId);
      if (!lord) {
        return;
      }
      visitLord(session.score, lord.id);
      hud.text = hudText();
      openDialog(dialog, lord.lines);
      refreshDialog();
    });

    function next(): void {
      if (!isMovementBlocked(dialog)) {
        return;
      }
      advanceDialog(dialog);
      refreshDialog();
    }

    for (const key of ADVANCE_KEYS) {
      k.onKeyPress(key, next);
    }
    k.onClick(next);

    refreshDialog();

    k.onUpdate(() => {
      if (!isMovementBlocked(dialog)) {
        const left = k.isKeyDown("left") || k.isKeyDown("a");
        const right = k.isKeyDown("right") || k.isKeyDown("d");
        const up = k.isKeyDown("up") || k.isKeyDown("w");
        const down = k.isKeyDown("down") || k.isKeyDown("s");
        const x = (Number(right) - Number(left)) * SPEED;
        const y = (Number(down) - Number(up)) * SPEED;
        player.move(x, y);
      }
      k.camPos(player.pos);
    });
  });
}
