import { SPRITE_SCALE, SPRITES } from "../assets";
import { LORDS, type LordId } from "../data/lords";
import { SHOUT_LINE } from "../data/story";
import {
  ADVANCE_KEYS,
  advanceDialog,
  createDialog,
  currentLine,
  isMovementBlocked,
  openDialog,
} from "../dialog";
import {
  createJoystick,
  isInsideCircle,
  joystickInput,
  JOYSTICK_RADIUS,
  knobOffset,
  moveJoystick,
  pressJoystick,
  releaseJoystick,
  type Point,
} from "../joystick";
import { addScreenLayer, GAME_WIDTH, hasTouched, k, RENDER_SCALE, TILE } from "../kaplayContext";
import { faceFromInput, pickAnim, type Facing, type PrincessAnim } from "../princess";
import { isReadyForEnding } from "../progress";
import { getSession } from "../session";
import { visitLord } from "../score";
import { createShout, isShouting, startShout, tickShout, withShout } from "../shout";

const SPEED = 80;
const SHOUT_KEY = "e";
// Feet collision box, in game units.
const FEET = 12;
// Touch controls, in screen game units.
const STICK_CENTER = { x: 40, y: 140 };
const KNOB_RADIUS = 9;
const SHOUT_BUTTON = { x: 284, y: 144 };
const SHOUT_BUTTON_RADIUS = 16;

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
    k.camScale(RENDER_SCALE);
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

    // pos is at her feet; she collides with the feet only, so her head and
    // raised arms can overlap the row above.
    const player = k.add([
      k.sprite(SPRITES.princess, { anim: "idle" }),
      k.scale(SPRITE_SCALE),
      k.pos(spawnCol * TILE + TILE / 2, (spawnRow + 1) * TILE - 2),
      k.anchor("bot"),
      k.area({ shape: new k.Rect(k.vec2(0, 0), FEET / SPRITE_SCALE, FEET / SPRITE_SCALE) }),
      k.body(),
      "player",
    ]);
    const shout = createShout();
    let facing: Facing = "right";
    let anim: PrincessAnim = "idle";

    const bubble = k.add([
      k.rect(SHOUT_LINE.length * 4 + 8, 10, { radius: 2 }),
      k.pos(0, 0),
      k.anchor("bot"),
      k.color(250, 246, 230),
      k.outline(0.5, k.rgb(12, 10, 20)),
      k.opacity(0),
      k.z(10),
    ]);
    const bubbleText = bubble.add([
      k.text(SHOUT_LINE, { size: 4 }),
      k.pos(0, -3),
      k.anchor("center"),
      k.color(12, 10, 20),
      k.opacity(0),
    ]);

    const ui = addScreenLayer();
    ui.add([k.rect(GAME_WIDTH, 16), k.pos(0, 0), k.color(12, 10, 20), k.opacity(0.85)]);
    const hud = ui.add([k.text(hudText(), { size: 8 }), k.pos(8, 4)]);

    const dialogBox = ui.add([
      k.rect(300, 48),
      k.pos(10, 122),
      k.color(12, 10, 20),
      k.outline(1, k.rgb(220, 200, 140)),
      k.opacity(0),
    ]);

    const dialogText = ui.add([
      k.text("", { size: 8, width: 284, lineSpacing: 4 }),
      k.pos(18, 130),
    ]);

    const stick = createJoystick(STICK_CENTER);
    const stickRing = ui.add([
      k.circle(JOYSTICK_RADIUS),
      k.pos(STICK_CENTER.x, STICK_CENTER.y),
      k.anchor("center"),
      k.color(250, 246, 230),
      k.opacity(0),
    ]);
    const stickKnob = ui.add([
      k.circle(KNOB_RADIUS),
      k.pos(STICK_CENTER.x, STICK_CENTER.y),
      k.anchor("center"),
      k.color(250, 246, 230),
      k.opacity(0),
    ]);
    const shoutButton = ui.add([
      k.circle(SHOUT_BUTTON_RADIUS),
      k.pos(SHOUT_BUTTON.x, SHOUT_BUTTON.y),
      k.anchor("center"),
      k.color(220, 200, 140),
      k.opacity(0),
    ]);
    const shoutButtonText = ui.add([
      k.text("!", { size: 16 }),
      k.pos(SHOUT_BUTTON.x + 1, SHOUT_BUTTON.y + 1),
      k.anchor("center"),
      k.color(12, 10, 20),
      k.opacity(0),
    ]);

    function hudText(): string {
      return `Score ${session.score.total}  Lords ${session.score.visited.length}/${lordIds.length}`;
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
      openDialog(dialog, withShout(lord.lines));
      refreshDialog();
    });

    // A tap advances dialog and also arrives as a touch; remember when, so the
    // tap that closes the last line does not also press a touch control.
    let lastAdvanceTime = -1;

    function next(): void {
      if (!isMovementBlocked(dialog)) {
        return;
      }
      lastAdvanceTime = k.time();
      advanceDialog(dialog);
      refreshDialog();
    }

    for (const key of ADVANCE_KEYS) {
      k.onKeyPress(key, next);
    }
    k.onClick(next);

    k.onKeyPress(SHOUT_KEY, () => {
      if (!isMovementBlocked(dialog)) {
        startShout(shout);
      }
    });

    // Touch positions arrive in canvas pixels; controls live in game units.
    const toUnits = (pos: Point): Point => ({ x: pos.x / RENDER_SCALE, y: pos.y / RENDER_SCALE });

    k.onTouchStart((pos, touch) => {
      if (isMovementBlocked(dialog) || k.time() === lastAdvanceTime) {
        return;
      }
      const point = toUnits(pos);
      if (isInsideCircle(point, SHOUT_BUTTON, SHOUT_BUTTON_RADIUS)) {
        startShout(shout);
        return;
      }
      pressJoystick(stick, touch.identifier, point);
    });
    k.onTouchMove((pos, touch) => moveJoystick(stick, touch.identifier, toUnits(pos)));
    k.onTouchEnd((_pos, touch) => releaseJoystick(stick, touch.identifier));

    refreshDialog();

    k.onUpdate(() => {
      tickShout(shout, k.dt());
      let dx = 0;
      let dy = 0;
      if (!isMovementBlocked(dialog) && !isShouting(shout)) {
        const left = k.isKeyDown("left") || k.isKeyDown("a");
        const right = k.isKeyDown("right") || k.isKeyDown("d");
        const up = k.isKeyDown("up") || k.isKeyDown("w");
        const down = k.isKeyDown("down") || k.isKeyDown("s");
        const touchInput = joystickInput(stick);
        dx = touchInput.dx || Number(right) - Number(left);
        dy = touchInput.dy || Number(down) - Number(up);
        player.move(dx * SPEED, dy * SPEED);
      }

      facing = faceFromInput(dx, facing);
      player.flipX = facing === "left";
      const shouting = isShouting(shout) || currentLine(dialog) === SHOUT_LINE;
      const nextAnim = pickAnim({ moving: dx !== 0 || dy !== 0, shouting });
      if (nextAnim !== anim) {
        anim = nextAnim;
        player.play(anim);
      }

      const showBubble = isShouting(shout) ? 1 : 0;
      bubble.opacity = showBubble;
      bubble.outline.width = showBubble * 0.5;
      bubbleText.opacity = showBubble;
      bubble.pos = player.pos.sub(0, 27);
      k.camPos(player.pos.sub(0, FEET));

      const showControls = hasTouched() && !isMovementBlocked(dialog);
      const knob = knobOffset(stick);
      stickKnob.pos = k.vec2(STICK_CENTER.x + knob.x, STICK_CENTER.y + knob.y);
      stickRing.opacity = showControls ? 0.25 : 0;
      stickKnob.opacity = showControls ? 0.6 : 0;
      shoutButton.opacity = showControls ? (isShouting(shout) ? 0.9 : 0.6) : 0;
      shoutButtonText.opacity = showControls ? 1 : 0;
    });
  });
}
