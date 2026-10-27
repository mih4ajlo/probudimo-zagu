import pixelFontUrl from "@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2?url";
import { FONT, k } from "./kaplayContext";

// Sprites are generated from assets/ by scripts/make-sprites.py into public/sprites/.
export const SPRITES = {
  princess: "princess",
  princessPortrait: "princess-portrait",
  wake: "wake",
} as const;

export function loadAssets(): void {
  // Press Start 2P is drawn on an 8px grid: load at 8 and only use multiples of 8.
  k.loadFont(FONT, pixelFontUrl, { size: 8, filter: "nearest" });
  for (const name of Object.values(SPRITES)) {
    k.loadSprite(name, `sprites/${name}.png`);
  }
}
