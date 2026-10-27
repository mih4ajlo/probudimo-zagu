// The canvas fills the window. Game units scale so at least the 320x180
// design area always fits; a wider or taller screen shows more around it.
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

export type ScreenFit = {
  // Canvas pixels per game unit.
  scale: number;
  // Visible screen size in game units (never smaller than the design area).
  w: number;
  h: number;
};

export function fitScreen(pixelsWide: number, pixelsHigh: number): ScreenFit {
  const scale = Math.min(pixelsWide / GAME_WIDTH, pixelsHigh / GAME_HEIGHT);
  return { scale, w: pixelsWide / scale, h: pixelsHigh / scale };
}
