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

// Most canvas pixels drawn per frame. 2x density on a large high-DPI screen
// draws 4x the pixels and halves the frame rate on integrated GPUs.
export const MAX_CANVAS_PIXELS = 1_500_000;

// Framebuffer pixels per CSS pixel: as sharp as the screen allows (up to 2x)
// within MAX_CANVAS_PIXELS, but never below 1 unless the screen itself is.
export function pixelDensityFor(devicePixelRatio: number, cssWidth: number, cssHeight: number): number {
  const withinBudget = Math.sqrt(MAX_CANVAS_PIXELS / (cssWidth * cssHeight));
  const density = Math.min(devicePixelRatio, 2, withinBudget);
  return Math.max(density, Math.min(devicePixelRatio, 1));
}
