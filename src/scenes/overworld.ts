import { SPRITE_SCALE, SPRITES } from "../assets";
import { CITIES } from "../data/cities";
import { maxScore, OFFICE_IDS, OFFICES, getOffice, type OfficeLevel } from "../data/offices";
import { NEIGHBOURS, SERBIA_RINGS } from "../data/serbia-geo";
import { SHOUT_LINE } from "../data/story";
import {
  ADVANCE_KEYS,
  advanceDialog,
  createDialog,
  currentLine,
  isMovementBlocked,
  openDialog,
} from "../dialog";
import { isInsideAny, mapBounds, project, projectRing, tryMove, type Point } from "../geo";
import {
  createJoystick,
  isInsideCircle,
  joystickInput,
  JOYSTICK_RADIUS,
  knobOffset,
  moveJoystick,
  pressJoystick,
  releaseJoystick,
} from "../joystick";
import { addScreenLayer, hasTouched, k, screenFit } from "../kaplayContext";
import { MAP_COLORS, MAP_DETAIL, type RGB } from "../mapCanvas";
import { createPinch, pinchDown, pinchMove, pinchUp } from "../pinch";
import { layoutOffices, MARKER_SIZE, spawnPoint, touchedOffice, visitToStart } from "../officeLayout";
import type { ScreenFit } from "../screen";
import { createTap, tapDown, tapMove, tapUp } from "../tap";
import { walkStep } from "../walkTo";
import { faceFromInput, pickAnim, type Facing, type PrincessAnim } from "../princess";
import { isReadyForEnding } from "../progress";
import { visitOffice } from "../score";
import { getSession } from "../session";
import { createShout, isShouting, startShout, tickShout, withShout } from "../shout";
import { clampCamera, scrollZoom, ZOOM_START, zoomIn, zoomOut } from "../zoom";

const SPEED = 80;
const SHOUT_KEY = "e";
// Touch controls, in screen game units, anchored to the screen's corners.
const KNOB_RADIUS = 9;
const SHOUT_BUTTON_RADIUS = 16;
const ZOOM_BUTTON_RADIUS = 11;
const DIALOG_WIDTH = 300;
const DIALOG_HEIGHT = 48;

function controlLayout(fit: ScreenFit) {
  return {
    stick: { x: 40, y: fit.h - 40 },
    shout: { x: fit.w - 36, y: fit.h - 36 },
    zoomOut: { x: fit.w - 54, y: fit.h - 76 },
    zoomIn: { x: fit.w - 18, y: fit.h - 76 },
  };
}
// Feet sit at the sprite's bottom; the camera looks at her middle.
const BODY_CENTER = 12;
// Show city names from this zoom up; office names only near her when close.
const CITY_LABEL_ZOOM = 0.2;
const OFFICE_LABEL_ZOOM = 0.6;
const OFFICE_LABEL_DISTANCE = 60;
// Extra game units around the view in which markers and labels are still drawn.
const CULL_MARGIN = 60;

const INK = MAP_COLORS.ink;
const ROOF: RGB = [176, 62, 48];
const CHECK: RGB = [40, 150, 70];
const LEVEL_COLORS: Record<OfficeLevel, RGB> = {
  OJT: [156, 156, 166],
  VJT: [72, 120, 204],
  AJT: [62, 162, 92],
  PJT: [142, 82, 192],
  VRHOVNO: [232, 182, 40],
};

const rgb = (c: RGB) => k.rgb(c[0], c[1], c[2]);
const vec = (p: Point) => k.vec2(p.x, p.y);

export function registerOverworldScene(): void {
  k.scene("overworld", () => {
    const session = getSession();
    const dialog = createDialog();
    const shout = createShout();
    const bounds = mapBounds();
    let zoom = ZOOM_START;
    let facing: Facing = "right";
    let anim: PrincessAnim = "idle";
    let lastTouched: string | null = null;
    // Where a tap sent her, until she arrives or can get no closer.
    let walkTarget: Point | null = null;
    // Part of the map on screen; only markers and labels inside it are drawn.
    let view = { x: 0, y: 0, w: 0, h: 0 };
    const onScreen = (p: Point) =>
      p.x > view.x - CULL_MARGIN && p.x < view.x + view.w + CULL_MARGIN &&
      p.y > view.y - CULL_MARGIN && p.y < view.y + view.h + CULL_MARGIN;

    const serbia = SERBIA_RINGS.map(projectRing);
    const neighbours = NEIGHBOURS.map((n) => ({ name: n.name, label: vec(project(n.label)) }));
    const cityPoint = (name: string) => project(CITIES[name]);
    const officePos = layoutOffices(OFFICES, cityPoint);
    const cities = [...new Set(OFFICES.map((o) => o.city))].map((name) => ({ name, pos: vec(cityPoint(name)) }));

    // Screen pixels → game units at the current zoom, for outlines and labels.
    // Tuned at 4 canvas pixels per unit, so they keep their look on any screen.
    const px = (n: number) => n / (zoom * 4);

    function label(text: string, pos: ReturnType<typeof k.vec2>, sizePx: number, color: RGB): void {
      k.drawText({ text, pos, size: px(sizePx), anchor: "center", color: rgb(color) });
    }

    function drawOffice(id: string, level: OfficeLevel): void {
      const p = vec(officePos.get(id) as Point);
      const s = MARKER_SIZE;
      k.drawRect({
        pos: p,
        width: s,
        height: s * 0.7,
        anchor: "center",
        color: rgb(LEVEL_COLORS[level]),
        outline: { width: px(1.5), color: rgb(INK) },
      });
      k.drawTriangle({
        p1: p.add(-s * 0.65, -s * 0.35),
        p2: p.add(s * 0.65, -s * 0.35),
        p3: p.add(0, -s * 0.9),
        color: rgb(ROOF),
        outline: { width: px(1.5), color: rgb(INK) },
      });
      if (session.score.visited.includes(id)) {
        k.drawLines({ pts: [p.add(-3, 0), p.add(-1, 2.5), p.add(3.5, -2.5)], width: px(3), color: rgb(CHECK) });
      }
    }

    // Only the office nearest to her feet gets its name, so rings do not clutter.
    function nearestOffice(feet: Point): { name: string; pos: Point } | null {
      let best: { name: string; pos: Point } | null = null;
      let bestDistance = OFFICE_LABEL_DISTANCE;
      for (const office of OFFICES) {
        const pos = officePos.get(office.id) as Point;
        const d = Math.hypot(feet.x - pos.x, feet.y - pos.y);
        if (d < bestDistance) {
          best = { name: office.name, pos };
          bestDistance = d;
        }
      }
      return best;
    }

    k.add([
      k.z(0),
      {
        draw() {
          const feet = { x: player.pos.x, y: player.pos.y };
          // Paper, countries, rivers and outline: painted once (mapCanvas.ts).
          k.drawSprite({ sprite: SPRITES.map, pos: k.vec2(bounds.x, bounds.y), scale: 1 / MAP_DETAIL });
          for (const n of neighbours) {
            label(n.name, n.label, 10, MAP_COLORS.neighbourEdge);
          }
          for (const c of cities) {
            if (!onScreen(c.pos)) {
              continue;
            }
            k.drawCircle({ pos: c.pos, radius: px(4), color: rgb(INK) });
            if (zoom >= CITY_LABEL_ZOOM) {
              label(c.name, c.pos.add(0, px(14)), 8, INK);
            }
          }
          for (const office of OFFICES) {
            if (onScreen(officePos.get(office.id) as Point)) {
              drawOffice(office.id, office.level);
            }
          }
          if (walkTarget) {
            const t = vec(walkTarget);
            const r = px(5);
            k.drawLines({ pts: [t.add(-r, -r), t.add(r, r)], width: px(2.5), color: rgb(ROOF) });
            k.drawLines({ pts: [t.add(-r, r), t.add(r, -r)], width: px(2.5), color: rgb(ROOF) });
          }
          const nearest = zoom >= OFFICE_LABEL_ZOOM ? nearestOffice(feet) : null;
          if (nearest) {
            // Above the roof: she approaches from below and would cover a label under it.
            label(nearest.name, vec(nearest.pos).add(0, -MARKER_SIZE * 1.6), 8, INK);
          }
        },
      },
    ]);

    const spawn = spawnPoint();
    const player = k.add([
      k.sprite(SPRITES.princess, { anim: "idle" }),
      k.scale(SPRITE_SCALE),
      k.pos(spawn.x, spawn.y),
      k.anchor("bot"),
      k.z(10),
      "player",
    ]);

    const bubble = k.add([
      k.rect(SHOUT_LINE.length * 4 + 8, 10, { radius: 2 }),
      k.pos(0, 0),
      k.anchor("bot"),
      k.scale(1),
      k.color(250, 246, 230),
      k.outline(0.5, k.rgb(12, 10, 20)),
      k.opacity(0),
      k.z(20),
    ]);
    const bubbleText = bubble.add([
      k.text(SHOUT_LINE, { size: 4 }),
      k.pos(0, -3),
      k.anchor("center"),
      k.color(12, 10, 20),
      k.opacity(0),
    ]);

    const ui = addScreenLayer();
    const hudBar = ui.add([k.rect(screenFit().w, 16), k.pos(0, 0), k.color(12, 10, 20), k.opacity(0.85)]);
    const hud = ui.add([k.text(hudText(), { size: 8 }), k.pos(8, 4)]);
    const dialogBox = ui.add([
      k.rect(DIALOG_WIDTH, DIALOG_HEIGHT),
      k.pos(0, 0),
      k.color(12, 10, 20),
      k.outline(1, k.rgb(220, 200, 140)),
      k.opacity(0),
    ]);
    const dialogText = ui.add([k.text("", { size: 8, width: DIALOG_WIDTH - 16, lineSpacing: 4 }), k.pos(0, 0)]);

    // Touch controls: joystick, shout button, zoom buttons. Hidden until the
    // first touch, and while a dialog is open.
    let layout = controlLayout(screenFit());
    const stick = createJoystick(layout.stick);
    const pinch = createPinch();
    const tap = createTap();
    function touchButton(center: Point, radius: number, glyph: string, color: RGB) {
      const button = ui.add([
        k.circle(radius),
        k.pos(center.x, center.y),
        k.anchor("center"),
        k.color(...color),
        k.opacity(0),
      ]);
      const text = ui.add([
        k.text(glyph, { size: 16 }),
        k.pos(center.x + 1, center.y + 1),
        k.anchor("center"),
        k.color(12, 10, 20),
        k.opacity(0),
      ]);
      return { button, text };
    }
    const stickRing = ui.add([
      k.circle(JOYSTICK_RADIUS),
      k.pos(layout.stick.x, layout.stick.y),
      k.anchor("center"),
      k.color(250, 246, 230),
      k.opacity(0),
    ]);
    const stickKnob = ui.add([
      k.circle(KNOB_RADIUS),
      k.pos(layout.stick.x, layout.stick.y),
      k.anchor("center"),
      k.color(250, 246, 230),
      k.opacity(0),
    ]);
    const shoutButton = touchButton(layout.shout, SHOUT_BUTTON_RADIUS, "!", [220, 200, 140]);
    const zoomOutButton = touchButton(layout.zoomOut, ZOOM_BUTTON_RADIUS, "-", [250, 246, 230]);
    const zoomInButton = touchButton(layout.zoomIn, ZOOM_BUTTON_RADIUS, "+", [250, 246, 230]);
    const zoomButtons = [zoomOutButton, zoomInButton];

    function placeButton(button: ReturnType<typeof touchButton>, center: Point): void {
      button.button.pos = vec(center);
      button.text.pos = k.vec2(center.x + 1, center.y + 1);
    }

    // Follow the screen size: phones rotate and address bars come and go.
    function placeUi(fit: ScreenFit): void {
      layout = controlLayout(fit);
      stick.center = layout.stick;
      if (stick.touchId === null) {
        stick.finger = layout.stick;
      }
      stickRing.pos = vec(layout.stick);
      placeButton(shoutButton, layout.shout);
      placeButton(zoomOutButton, layout.zoomOut);
      placeButton(zoomInButton, layout.zoomIn);
      hudBar.width = fit.w;
      const box = { x: (fit.w - DIALOG_WIDTH) / 2, y: fit.h - DIALOG_HEIGHT - 10 };
      dialogBox.pos = vec(box);
      dialogText.pos = k.vec2(box.x + 8, box.y + 8);
    }
    placeUi(screenFit());

    function hudText(): string {
      return `Score ${session.score.total}/${maxScore()}  Offices ${session.score.visited.length}/${OFFICE_IDS.length}`;
    }

    function refreshDialog(): void {
      const text = currentLine(dialog);
      if (text === null) {
        dialogBox.opacity = 0;
        dialogBox.outline.width = 0;
        dialogText.text = "";
        if (isReadyForEnding(session.score.visited, OFFICE_IDS)) {
          k.go("ending");
        }
        return;
      }
      dialogBox.opacity = 1;
      dialogBox.outline.width = 1;
      dialogText.text = text;
    }

    function startVisit(id: string): void {
      const office = getOffice(id);
      if (!office) {
        return;
      }
      walkTarget = null;
      visitOffice(session.score, id);
      hud.text = hudText();
      openDialog(dialog, withShout(office.lines));
      refreshDialog();
    }

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
    let scrollPending = 0;
    k.onScroll((delta) => {
      const next = scrollZoom({ zoom, pending: scrollPending }, delta.y);
      zoom = next.zoom;
      scrollPending = next.pending;
    });
    for (const key of ["=", "+"] as const) {
      k.onKeyPress(key, () => {
        zoom = zoomIn(zoom);
      });
    }
    k.onKeyPress("-", () => {
      zoom = zoomOut(zoom);
    });

    // Touch positions arrive in canvas pixels; controls live in game units.
    const toUnits = (pos: Point): Point => {
      const scale = screenFit().scale;
      return { x: pos.x / scale, y: pos.y / scale };
    };

    k.onTouchStart((pos, touch) => {
      if (isMovementBlocked(dialog) || k.time() === lastAdvanceTime) {
        return;
      }
      const point = toUnits(pos);
      if (isInsideCircle(point, layout.shout, SHOUT_BUTTON_RADIUS)) {
        startShout(shout);
      } else if (isInsideCircle(point, layout.zoomIn, ZOOM_BUTTON_RADIUS)) {
        zoom = zoomIn(zoom);
      } else if (isInsideCircle(point, layout.zoomOut, ZOOM_BUTTON_RADIUS)) {
        zoom = zoomOut(zoom);
      } else if (!pressJoystick(stick, touch.identifier, point)) {
        // Any other finger on the map is a tap to walk, or pinch-zooms with a
        // second one.
        tapDown(tap, touch.identifier, point, k.time());
        pinchDown(pinch, touch.identifier, point, zoom);
      }
    });
    k.onTouchMove((pos, touch) => {
      const point = toUnits(pos);
      moveJoystick(stick, touch.identifier, point);
      tapMove(tap, touch.identifier, point);
      const pinched = pinchMove(pinch, touch.identifier, point);
      if (pinched !== null) {
        zoom = pinched;
      }
    });
    k.onTouchEnd((pos, touch) => {
      releaseJoystick(stick, touch.identifier);
      pinchUp(pinch, touch.identifier);
      const tapped = tapUp(tap, touch.identifier, toUnits(pos), k.time());
      if (tapped && !isMovementBlocked(dialog)) {
        const world = k.toWorld(k.vec2(pos.x, pos.y));
        walkTarget = { x: world.x, y: world.y };
      }
    });

    k.onUpdate(() => {
      tickShout(shout, k.dt());
      let dx = 0;
      let dy = 0;
      if (!isMovementBlocked(dialog) && !isShouting(shout)) {
        const touchInput = joystickInput(stick);
        dx = touchInput.dx || Number(k.isKeyDown("right") || k.isKeyDown("d")) - Number(k.isKeyDown("left") || k.isKeyDown("a"));
        dy = touchInput.dy || Number(k.isKeyDown("down") || k.isKeyDown("s")) - Number(k.isKeyDown("up") || k.isKeyDown("w"));
        const from = { x: player.pos.x, y: player.pos.y };
        const canStand = (p: Point) => isInsideAny(p, serbia);
        if (dx !== 0 || dy !== 0) {
          // Keys or joystick take over from a tap.
          walkTarget = null;
          const step = (SPEED * k.dt()) / Math.hypot(dx, dy);
          player.pos = vec(tryMove(from, { x: dx * step, y: dy * step }, canStand));
        } else if (walkTarget) {
          const walked = walkStep(from, walkTarget, SPEED * k.dt(), canStand);
          player.pos = vec(walked.pos);
          dx = Math.sign(walked.dx);
          // Any movement counts as walking, for the animation.
          dy = walked.pos.y === from.y ? 0 : 1;
          if (walked.done) {
            walkTarget = null;
          }
        }
      }

      facing = faceFromInput(dx, facing);
      player.flipX = facing === "left";
      const shouting = isShouting(shout) || currentLine(dialog) === SHOUT_LINE;
      const nextAnim = pickAnim({ moving: dx !== 0 || dy !== 0, shouting });
      if (nextAnim !== anim) {
        anim = nextAnim;
        player.play(anim);
      }

      const touched = touchedOffice({ x: player.pos.x, y: player.pos.y }, officePos);
      const blocked = isMovementBlocked(dialog);
      const visit = visitToStart(touched, lastTouched, blocked);
      if (!blocked) {
        lastTouched = touched;
      }
      if (visit) {
        startVisit(visit);
      }

      const showBubble = isShouting(shout) ? 1 : 0;
      bubble.opacity = showBubble;
      bubble.outline.width = showBubble * 0.5;
      bubbleText.opacity = showBubble;
      bubble.scale = k.vec2(1 / zoom);
      bubble.pos = player.pos.sub(0, 27);

      const fit = screenFit();
      placeUi(fit);
      k.camScale(fit.scale * zoom);
      const size = { w: fit.w / zoom, h: fit.h / zoom };
      const cam = clampCamera({ x: player.pos.x, y: player.pos.y - BODY_CENTER }, size, bounds);
      k.camPos(cam.x, cam.y);
      view = { x: cam.x - size.w / 2, y: cam.y - size.h / 2, w: size.w, h: size.h };

      const showControls = hasTouched() && !isMovementBlocked(dialog);
      const knob = knobOffset(stick);
      stickKnob.pos = k.vec2(layout.stick.x + knob.x, layout.stick.y + knob.y);
      stickRing.opacity = showControls ? 0.25 : 0;
      stickKnob.opacity = showControls ? 0.6 : 0;
      shoutButton.button.opacity = showControls ? (isShouting(shout) ? 0.9 : 0.6) : 0;
      shoutButton.text.opacity = showControls ? 1 : 0;
      for (const zoomButton of zoomButtons) {
        zoomButton.button.opacity = showControls ? 0.45 : 0;
        zoomButton.text.opacity = showControls ? 1 : 0;
      }
    });

    refreshDialog();
  });
}
