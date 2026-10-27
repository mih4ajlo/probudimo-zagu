import type { Bounds, Point } from "./geo";

// 1 = today's close view; ZOOM_MIN shows all of Serbia.
export const ZOOM_MIN = 0.09;
export const ZOOM_MAX = 1;
export const ZOOM_START = 0.5;
export const ZOOM_STEP = 1.25;

export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

export function zoomIn(zoom: number): number {
  return clampZoom(zoom * ZOOM_STEP);
}

export function zoomOut(zoom: number): number {
  return clampZoom(zoom / ZOOM_STEP);
}

function clampAxis(target: number, half: number, min: number, size: number): number {
  if (size <= half * 2) {
    return min + size / 2;
  }
  return Math.min(Math.max(target, min + half), min + size - half);
}

// Camera center that follows the target but never shows past the map edges.
export function clampCamera(center: Point, view: { w: number; h: number }, bounds: Bounds): Point {
  return {
    x: clampAxis(center.x, view.w / 2, bounds.x, bounds.w),
    y: clampAxis(center.y, view.h / 2, bounds.y, bounds.h),
  };
}

// Wheel/trackpad delta that adds up to one zoom step.
export const SCROLL_PER_STEP = 100;

export type ScrollZoom = { zoom: number; pending: number };

// Trackpads send many small deltas and big mice one large one: add deltas up and
// take at most one step per event, so a single gesture does not jump the range.
export function scrollZoom(state: ScrollZoom, deltaY: number): ScrollZoom {
  const pending = state.pending + deltaY;
  if (pending <= -SCROLL_PER_STEP) {
    return { zoom: zoomIn(state.zoom), pending: 0 };
  }
  if (pending >= SCROLL_PER_STEP) {
    return { zoom: zoomOut(state.zoom), pending: 0 };
  }
  return { zoom: state.zoom, pending };
}
