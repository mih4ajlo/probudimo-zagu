import { SPRITE_SCALE, SPRITES } from "../assets";
import { createTrail, followerPositions, pushTrail } from "../crowd";
import { FOLLOWERS, SLEEPWALK_LINE, SLEEPWALK_SPEED, TALK_ROUNDS } from "../data/hunt";
import { SERBIA_RINGS } from "../data/serbia-geo";
import { isInsideAny, lineOnLand, projectRing, type Point } from "../geo";
import { createHunt, huntFlee, huntResult, huntRound, huntVisit } from "../hunt";
import { k } from "../kaplayContext";
import { officePositions, spawnPoint } from "../officeLayout";
import type { PrincessAnim } from "../princess";
import { getSession } from "../session";
import { withShout } from "../shout";
import { createTalk, isTalkDone, talkChoices, talkPick } from "../talk";
import { walkStep } from "../walkTo";
import { createMapView, type MapTalk } from "./mapView";

// Shirt tints so the crowd looks mixed (the sprite's shirt is near-white).
const FOLLOWER_TINTS: readonly [number, number, number][] = [
  [255, 214, 214],
  [214, 232, 255],
];
// Small sideways offsets so followers on a straight path do not cover each other.
const SIDE_STEP = [3, -3];
// Zaga sleeps beside her office; small z's float up from her head.
const ZAGA_OFFSET: Point = { x: 12, y: 6 };
const SNORE_EVERY = 0.7;
const SNORE_LIFE = 2;

// Find Zaga: three protesters search the offices for the sleeping princess and
// talk her awake over three rounds; between rounds she sleepwalks away.
export function registerHuntScene(): void {
  k.scene("hunt", () => {
    const session = getSession();
    const start = spawnPoint();
    const positions = officePositions();
    const serbia = SERBIA_RINGS.map(projectRing);
    const canWalk = (from: Point, to: Point) => lineOnLand(from, to, (p) => isInsideAny(p, serbia));
    const hunt = createHunt(positions, start, Math.random, canWalk);
    const talk = createTalk();
    const trail = createTrail(start);
    const followers = FOLLOWER_TINTS.slice(0, FOLLOWERS).map((tint) =>
      k.add([
        k.sprite(SPRITES.protester, { anim: "idle" }),
        k.scale(SPRITE_SCALE),
        k.pos(start.x, start.y),
        k.anchor("bot"),
        k.color(...tint),
        k.z(9),
        { playing: "idle" as PrincessAnim },
      ]),
    );

    // Hidden until the first find; then asleep at her office or sleepwalking.
    const zaga = k.add([
      k.sprite(SPRITES.princess, { anim: "idle" }),
      k.scale(SPRITE_SCALE),
      k.pos(0, 0),
      k.anchor("bot"),
      k.opacity(0),
      k.z(8),
    ]);
    let walkTo: Point | null = null;
    const spot = (office: Point) => ({ x: office.x + ZAGA_OFFSET.x, y: office.y + ZAGA_OFFSET.y });

    function placeZaga(office: Point): void {
      walkTo = null;
      const p = spot(office);
      zaga.pos = k.vec2(p.x, p.y);
      zaga.opacity = 1;
      zaga.flipX = false;
      zaga.play("idle");
    }

    zaga.onUpdate(() => {
      if (!walkTo) {
        return;
      }
      const step = walkStep({ x: zaga.pos.x, y: zaga.pos.y }, walkTo, SLEEPWALK_SPEED * k.dt(), () => true);
      zaga.pos = k.vec2(step.pos.x, step.pos.y);
      if (step.dx !== 0) {
        zaga.flipX = step.dx < 0;
      }
      if (step.done) {
        walkTo = null;
        zaga.play("idle");
      }
    });
    k.loop(SNORE_EVERY, () => {
      if (zaga.opacity === 0) {
        return;
      }
      const z = k.add([
        k.text("z", { size: 6 }),
        k.pos(zaga.pos.x + 4, zaga.pos.y - 24),
        k.anchor("center"),
        k.color(40, 40, 96),
        k.opacity(1),
        k.z(21),
        { age: 0 },
      ]);
      z.onUpdate(() => {
        z.age += k.dt();
        z.move(5, -10);
        z.opacity = Math.max(0, 1 - z.age / SNORE_LIFE);
        if (z.age >= SNORE_LIFE) {
          z.destroy();
        }
      });
    });

    function sleepwalk(): void {
      const { to } = huntFlee(hunt);
      walkTo = spot(to);
      zaga.play("walk");
    }

    function talkRound(view: MapTalk): void {
      const choices = talkChoices(talk);
      if (!choices) {
        return;
      }
      view.ask(choices, (index) => {
        view.say(talkPick(talk, index) ?? [], {
          shoutFirst: true,
          then: () => {
            if (isTalkDone(talk)) {
              session.hunt = huntResult(hunt);
              k.go("huntEnding");
              return;
            }
            view.say([SLEEPWALK_LINE], { then: sleepwalk });
          },
        });
      });
    }

    createMapView({
      leaderSprite: SPRITES.protester,
      hudText: () => `Round ${huntRound(hunt)}/${TALK_ROUNDS.length}  Visits ${hunt.visits}`,
      officeMark: (id) => (hunt.searched.includes(id) ? "question" : null),
      onVisit: (id, view) => {
        const visit = huntVisit(hunt, id);
        if (!visit) {
          return;
        }
        if (!visit.found) {
          view.say(withShout(visit.lines), { shoutFirst: true });
          return;
        }
        // Caught, even if she had not arrived yet.
        placeZaga(positions.get(id) as Point);
        view.say(visit.lines, { then: () => talkRound(view) });
      },
      onFrame: (frame) => {
        pushTrail(trail, frame.pos);
        const spots = followerPositions(trail, frame.pos, followers.length);
        followers.forEach((follower, i) => {
          follower.pos = k.vec2(spots[i].x + SIDE_STEP[i % SIDE_STEP.length], spots[i].y);
          follower.flipX = frame.facing === "left";
          if (follower.playing !== frame.anim) {
            follower.playing = frame.anim;
            follower.play(frame.anim);
          }
        });
      },
    });
  });
}
