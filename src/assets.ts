import pixelFontUrl from "@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2?url";
import pixelFontExtUrl from "@fontsource/press-start-2p/files/press-start-2p-latin-ext-400-normal.woff2?url";
import { FONT, k, RENDER_SCALE } from "./kaplayContext";
import { MAP_DETAILS, paintMap, type MapDetail } from "./mapCanvas";

// Sprites are generated from assets/ by scripts/make-sprites.py into public/sprites/.
export const SPRITES = {
  princess: "princess",
  protester: "protester",
  princessPortrait: "princess-portrait",
  wake: "wake",
} as const;

// Map sprites are painted at startup from the map data, one per detail level.
export function mapSprite(detail: MapDetail): string {
  return `serbia-map-${detail}`;
}

// Sprites are made at RENDER_SCALE detail (DETAIL in scripts/make-sprites.py);
// draw them at this scale to get game-unit size with full detail.
export const SPRITE_SCALE = 1 / RENDER_SCALE;

// Frames in sprites/princess.png and sprites/protester.png, left to right
// (SHEET_FRAMES in make-sprites.py). The art faces right; flipX makes them face left.
const CHARACTER_FRAMES = { idle: 0, stepLeft: 1, stepRight: 2, shout: 3, shoutHigh: 4 };

function loadCharacter(name: string): void {
  k.loadSprite(name, `sprites/${name}.png`, {
    sliceX: Object.keys(CHARACTER_FRAMES).length,
    anims: {
      idle: CHARACTER_FRAMES.idle,
      walk: {
        frames: [CHARACTER_FRAMES.stepLeft, CHARACTER_FRAMES.idle, CHARACTER_FRAMES.stepRight, CHARACTER_FRAMES.idle],
        speed: 8,
        loop: true,
      },
      shout: { from: CHARACTER_FRAMES.shout, to: CHARACTER_FRAMES.shoutHigh, speed: 5, loop: true },
    },
  });
}

export function loadAssets(): void {
  // Press Start 2P is drawn on an 8px grid: load at 8 and only use multiples of 8
  // (or 4 in world space, which the x4 render turns into 16 real pixels).
  k.loadFont(FONT, pixelFontUrl, { size: 8, filter: "nearest" });
  // č ć š ž đ live in the latin-ext file. Added after loadFont with a limited
  // unicode-range in the same family, so the browser uses it for those letters.
  const latinExt = new FontFace(FONT, `url(${pixelFontExtUrl})`, { unicodeRange: "U+0100-024F" });
  document.fonts.add(latinExt);
  k.load(latinExt.load());
  loadCharacter(SPRITES.princess);
  loadCharacter(SPRITES.protester);
  k.loadSprite(SPRITES.princessPortrait, `sprites/${SPRITES.princessPortrait}.png`);
  k.loadSprite(SPRITES.wake, `sprites/${SPRITES.wake}.png`);
  for (const detail of MAP_DETAILS) {
    k.loadSprite(mapSprite(detail), paintMap(detail));
  }
}
