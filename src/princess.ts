export type Facing = "left" | "right";
export type PrincessAnim = "idle" | "walk" | "shout";

export function faceFromInput(dx: number, current: Facing): Facing {
  if (dx < 0) {
    return "left";
  }
  if (dx > 0) {
    return "right";
  }
  return current;
}

export function pickAnim(state: { moving: boolean; shouting: boolean }): PrincessAnim {
  if (state.shouting) {
    return "shout";
  }
  return state.moving ? "walk" : "idle";
}

// Where the shout bubble and the camera sit for a character this many game
// units tall (feet at the bottom): the bubble just above the top of the
// sprite, the camera on its middle.
export function characterLayout(height: number): { bubbleLift: number; bodyCenter: number } {
  return { bubbleLift: height + 2.5, bodyCenter: height / 2 };
}
