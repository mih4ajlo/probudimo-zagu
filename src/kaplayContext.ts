import kaplay from "kaplay";

// Scenes lay out in a 320x180 grid of game units. The canvas renders
// RENDER_SCALE real pixels per unit so 4x-detail sprites stay sharp.
export const TILE = 16;
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;
export const RENDER_SCALE = 4;

// Pixel font loaded in assets.ts; used as the default for every k.text().
export const FONT = "pixel";

const root = document.querySelector("#game") ?? undefined;

export const k = kaplay({
  width: GAME_WIDTH * RENDER_SCALE,
  height: GAME_HEIGHT * RENDER_SCALE,
  letterbox: true,
  crisp: true,
  pixelDensity: 1,
  global: false,
  font: FONT,
  background: [20, 16, 32],
  root: root instanceof HTMLElement ? root : undefined,
});

// Zoom the camera so scene objects use game units. Call at the start of a scene.
export function useGameUnits(): void {
  k.camScale(RENDER_SCALE);
  k.camPos(GAME_WIDTH / 2, GAME_HEIGHT / 2);
}

// A screen-fixed layer in game units, for HUD and dialog over a moving camera.
export function addScreenLayer() {
  return k.add([k.pos(0, 0), k.scale(RENDER_SCALE), k.fixed()]);
}

// Touch controls show only once the player has touched the screen, so a
// touchscreen laptop driven by keyboard keeps the desktop look.
let touched = false;
window.addEventListener("touchstart", () => (touched = true), { passive: true, once: true });

export function hasTouched(): boolean {
  return touched;
}
