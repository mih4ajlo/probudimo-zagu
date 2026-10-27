import kaplay from "kaplay";

export const TILE = 16;
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

const root = document.querySelector("#game") ?? undefined;

export const k = kaplay({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  letterbox: true,
  crisp: true,
  pixelDensity: 1,
  global: false,
  background: [20, 16, 32],
  root: root instanceof HTMLElement ? root : undefined,
});
