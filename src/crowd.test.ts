import { describe, expect, it } from "vitest";
import { FOLLOWERS } from "./data/hunt";
import { createTrail, FOLLOWER_SPACING, followerPositions, pushTrail, TRAIL_STEP } from "./crowd";

describe("followerPositions", () => {
  it("puts followers a fixed path distance behind the leader", () => {
    const trail = createTrail({ x: 0, y: 0 });
    for (let x = 1; x <= 100; x++) {
      pushTrail(trail, { x, y: 0 });
    }
    const spots = followerPositions(trail, { x: 100, y: 0 }, 3);
    expect(spots.map((p) => p.x)).toEqual([91, 82, 73].map((x) => expect.closeTo(x, 5)));
    expect(spots.every((p) => p.y === 0)).toBe(true);
  });

  it("follows the path around a corner", () => {
    const trail = createTrail({ x: 0, y: 0 });
    for (let x = 1; x <= 20; x++) {
      pushTrail(trail, { x, y: 0 });
    }
    for (let y = 1; y <= 20; y++) {
      pushTrail(trail, { x: 20, y });
    }
    const [one, , three] = followerPositions(trail, { x: 20, y: 20 }, 3);
    expect(one.x).toBeCloseTo(20);
    expect(one.y).toBeCloseTo(20 - FOLLOWER_SPACING);
    expect(three.x).toBeCloseTo(20 - (3 * FOLLOWER_SPACING - 20));
    expect(three.y).toBeCloseTo(0);
  });

  it("does not collapse onto a leader who stands still", () => {
    const trail = createTrail({ x: 0, y: 0 });
    for (let x = 1; x <= 100; x++) {
      pushTrail(trail, { x, y: 0 });
    }
    const before = followerPositions(trail, { x: 100, y: 0 }, 3);
    for (let i = 0; i < 50; i++) {
      pushTrail(trail, { x: 100, y: 0 });
    }
    expect(followerPositions(trail, { x: 100, y: 0 }, 3)).toEqual(before);
  });

  it("waits at the oldest point while the path is still short", () => {
    const trail = createTrail({ x: 0, y: 0 });
    pushTrail(trail, { x: 5, y: 0 });
    expect(followerPositions(trail, { x: 5, y: 0 }, 2)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it("keeps only the path the last follower needs", () => {
    const trail = createTrail({ x: 0, y: 0 });
    for (let x = 1; x <= 1000; x++) {
      pushTrail(trail, { x, y: 0 });
    }
    expect(trail.points.length).toBeLessThan(((FOLLOWERS + 2) * FOLLOWER_SPACING) / TRAIL_STEP + 2);
    const spots = followerPositions(trail, { x: 1000, y: 0 }, FOLLOWERS);
    expect(spots[FOLLOWERS - 1].x).toBeCloseTo(1000 - FOLLOWERS * FOLLOWER_SPACING);
  });
});
