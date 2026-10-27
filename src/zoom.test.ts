import { describe, expect, it } from "vitest";
import type { Bounds } from "./geo";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, clampCamera, clampZoom, scrollZoom, zoomIn, zoomOut } from "./zoom";

const bounds: Bounds = { x: 0, y: 0, w: 1000, h: 800 };

describe("zoom", () => {
  it("steps by a fixed factor", () => {
    expect(zoomIn(0.4)).toBeCloseTo(0.4 * ZOOM_STEP);
    expect(zoomOut(0.4)).toBeCloseTo(0.4 / ZOOM_STEP);
  });

  it("never goes past its limits", () => {
    expect(zoomIn(ZOOM_MAX)).toBe(ZOOM_MAX);
    expect(zoomOut(ZOOM_MIN)).toBe(ZOOM_MIN);
    expect(clampZoom(5)).toBe(ZOOM_MAX);
    expect(clampZoom(0)).toBe(ZOOM_MIN);
  });
});

describe("clampCamera", () => {
  it("follows the target when the view fits inside the map", () => {
    expect(clampCamera({ x: 500, y: 400 }, { w: 200, h: 100 }, bounds)).toEqual({ x: 500, y: 400 });
  });

  it("stops at the map edges", () => {
    expect(clampCamera({ x: 10, y: 790 }, { w: 200, h: 100 }, bounds)).toEqual({ x: 100, y: 750 });
  });

  it("centers on the map when the view is bigger than it", () => {
    expect(clampCamera({ x: 10, y: 10 }, { w: 3000, h: 2000 }, bounds)).toEqual({ x: 500, y: 400 });
  });
});

describe("scrollZoom", () => {
  it("ignores scroll events with no vertical movement", () => {
    expect(scrollZoom({ zoom: 0.5, pending: 0 }, 0)).toEqual({ zoom: 0.5, pending: 0 });
  });

  it("collects small trackpad deltas before stepping", () => {
    let state = { zoom: 0.5, pending: 0 };
    state = scrollZoom(state, -40);
    expect(state.zoom).toBe(0.5);
    state = scrollZoom(state, -40);
    state = scrollZoom(state, -40);
    expect(state.zoom).toBeCloseTo(0.5 * ZOOM_STEP);
  });

  it("steps at most once per event, however big the delta", () => {
    expect(scrollZoom({ zoom: 0.5, pending: 0 }, 5000).zoom).toBeCloseTo(0.5 / ZOOM_STEP);
  });
});
