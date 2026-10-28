import { SPRITE_SCALE, SPRITES } from "../assets";
import { createTrail, followerPositions, pushTrail } from "../crowd";
import { HUNT_INTRO } from "../data/hunt";
import { createHunt, crowdSize, huntVisit, isAwake } from "../hunt";
import { k } from "../kaplayContext";
import { officePositions, spawnPoint } from "../officeLayout";
import type { PrincessAnim } from "../princess";
import { getSession } from "../session";
import { createMapView } from "./mapView";

// Shirt tints so the crowd looks mixed (the sprite's shirt is near-white).
const FOLLOWER_TINTS: readonly [number, number, number][] = [
  [255, 214, 214],
  [214, 232, 255],
  [220, 255, 214],
  [255, 244, 200],
  [236, 220, 255],
  [255, 230, 200],
];
// Small sideways offsets so followers on a straight path do not cover each other.
const SIDE_STEP = [3, -3, 2, -2, 4, -4];

// Find Zaga: a protest crowd searches the offices for the sleeping princess.
export function registerHuntScene(): void {
  k.scene("hunt", () => {
    const session = getSession();
    const start = spawnPoint();
    const hunt = createHunt(officePositions(), start, Math.random);
    const trail = createTrail(start);

    const addFollower = (index: number) =>
      k.add([
        k.sprite(SPRITES.protester, { anim: "idle" }),
        k.scale(SPRITE_SCALE),
        k.pos(start.x, start.y),
        k.anchor("bot"),
        k.color(...FOLLOWER_TINTS[index % FOLLOWER_TINTS.length]),
        k.z(9),
        { playing: "idle" as PrincessAnim },
      ]);
    const followers: ReturnType<typeof addFollower>[] = [];

    createMapView({
      leaderSprite: SPRITES.protester,
      introLines: HUNT_INTRO,
      hudText: () => `Awake ${hunt.wake}%  Crowd ${crowdSize(hunt)}  Visits ${hunt.visits}`,
      officeMark: (id) => (hunt.searched.includes(id) ? "question" : null),
      visitLines: (id) => huntVisit(hunt, id)?.lines ?? null,
      onDialogEnd: () => {
        if (isAwake(hunt)) {
          session.hunt = { visits: hunt.visits, crowd: crowdSize(hunt) };
          k.go("huntEnding");
        }
      },
      onFrame: (frame) => {
        pushTrail(trail, frame.pos);
        while (followers.length < hunt.followers) {
          followers.push(addFollower(followers.length));
        }
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
