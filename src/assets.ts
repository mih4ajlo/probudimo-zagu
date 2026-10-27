import pixelFontUrl from "@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2?url";
import pixelFontExtUrl from "@fontsource/press-start-2p/files/press-start-2p-latin-ext-400-normal.woff2?url";
import { FONT, k, RENDER_SCALE } from "./kaplayContext";
import { paintMap } from "./mapCanvas";

// Sprites are generated from assets/ by scripts/make-sprites.py into public/sprites/.
export const SPRITES = {
  princess: "princess",
  princessPortrait: "princess-portrait",
  wake: "wake",
  // Painted at startup from the map data, not a file (see mapCanvas.ts).
  map: "serbia-map",
} as const;

// Sprites are made at RENDER_SCALE detail (DETAIL in scripts/make-sprites.py);
// draw them at this scale to get game-unit size with full detail.
export const SPRITE_SCALE = 1 / RENDER_SCALE;

// Frames in sprites/princess.png, left to right (SHEET_FRAMES in make-sprites.py).
// The art faces right; flipX makes her face left.
const PRINCESS_FRAMES = { idle: 0, stepLeft: 1, stepRight: 2, shout: 3, shoutHigh: 4 };

export function loadAssets(): void {
  // Press Start 2P is drawn on an 8px grid: load at 8 and only use multiples of 8
  // (or 4 in world space, which the x4 render turns into 16 real pixels).
  k.loadFont(FONT, pixelFontUrl, { size: 8, filter: "nearest" });
  // č ć š ž đ live in the latin-ext file. Added after loadFont with a limited
  // unicode-range in the same family, so the browser uses it for those letters.
  const latinExt = new FontFace(FONT, `url(${pixelFontExtUrl})`, { unicodeRange: "U+0100-024F" });
  document.fonts.add(latinExt);
  k.load(latinExt.load());
  k.loadSprite(SPRITES.princess, `sprites/${SPRITES.princess}.png`, {
    sliceX: Object.keys(PRINCESS_FRAMES).length,
    anims: {
      idle: PRINCESS_FRAMES.idle,
      walk: {
        frames: [PRINCESS_FRAMES.stepLeft, PRINCESS_FRAMES.idle, PRINCESS_FRAMES.stepRight, PRINCESS_FRAMES.idle],
        speed: 8,
        loop: true,
      },
      shout: { from: PRINCESS_FRAMES.shout, to: PRINCESS_FRAMES.shoutHigh, speed: 5, loop: true },
    },
  });
  k.loadSprite(SPRITES.princessPortrait, `sprites/${SPRITES.princessPortrait}.png`);
  k.loadSprite(SPRITES.wake, `sprites/${SPRITES.wake}.png`);
  k.loadSprite(SPRITES.map, paintMap());
}
