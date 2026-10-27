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
