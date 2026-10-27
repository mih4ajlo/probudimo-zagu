import kaplay from "kaplay";
import { fitScreen, GAME_HEIGHT, GAME_WIDTH, type ScreenFit } from "./screen";

// Scenes lay out in a 320x180 grid of game units; the canvas fills the
// window and shows more around that grid on other aspect ratios (screen.ts).
// Sprites are drawn at RENDER_SCALE detail per unit so they stay sharp.
export const TILE = 16;
export { GAME_HEIGHT, GAME_WIDTH };
export const RENDER_SCALE = 4;

// Pixel font loaded in assets.ts; used as the default for every k.text().
export const FONT = "pixel";

const root = document.querySelector("#game") ?? undefined;

// No width/height: the canvas fills #game and follows window resizes.
export const k = kaplay({
  crisp: true,
  pixelDensity: Math.min(window.devicePixelRatio || 1, 2),
  global: false,
  font: FONT,
  background: [20, 16, 32],
  root: root instanceof HTMLElement ? root : undefined,
});

export function screenFit(): ScreenFit {
  return fitScreen(k.width(), k.height());
}

// Keep the camera on the 320x180 design area, centered on screen. Call at the
// start of a scene.
export function useGameUnits(): void {
  const apply = () => {
    k.camScale(screenFit().scale);
    k.camPos(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  };
  apply();
  k.onUpdate(apply);
}

// A screen-fixed layer in game units, for HUD and dialog over a moving camera.
// Its origin is the screen's top-left; screenFit() gives its size.
export function addScreenLayer() {
  const layer = k.add([k.pos(0, 0), k.scale(screenFit().scale), k.fixed()]);
  k.onUpdate(() => {
    layer.scale = k.vec2(screenFit().scale);
  });
  return layer;
}

// Touch controls show only once the player has touched the screen, so a
// touchscreen laptop driven by keyboard keeps the desktop look.
let touched = false;
window.addEventListener("touchstart", () => (touched = true), { passive: true, once: true });

export function hasTouched(): boolean {
  return touched;
}
