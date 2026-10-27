import pixelFontUrl from "@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2?url";
import { FONT, k, RENDER_SCALE } from "./kaplayContext";

// Sprites are generated from assets/ by scripts/make-sprites.py into public/sprites/.
export const SPRITES = {
  princess: "princess",
  princessPortrait: "princess-portrait",
  wake: "wake",
} as const;

// Sprites are made at RENDER_SCALE detail (DETAIL in scripts/make-sprites.py);
// draw them at this scale to get game-unit size with full detail.
export const SPRITE_SCALE = 1 / RENDER_SCALE;

export function loadAssets(): void {
  // Press Start 2P is drawn on an 8px grid: load at 8 and only use multiples of 8.
  k.loadFont(FONT, pixelFontUrl, { size: 8, filter: "nearest" });
  for (const name of Object.values(SPRITES)) {
    k.loadSprite(name, `sprites/${name}.png`);
  }
}
