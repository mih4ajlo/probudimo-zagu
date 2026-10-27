import { NEIGHBOURS, RIVERS, SERBIA_RINGS } from "./data/serbia-geo";
import { mapBounds, projectRing, type Point } from "./geo";

// The static map layers are painted once per detail level (pixels per game
// unit) and drawn as a sprite at 1/detail scale. Smaller levels act as
// hand-made mipmaps so lines do not shimmer when zoomed far out.
export const MAP_DETAILS = [0.5, 1, 2] as const;
export type MapDetail = (typeof MAP_DETAILS)[number];

// The least detail that still has a texture pixel for every screen pixel.
export function pickMapDetail(screenPixelsPerUnit: number): MapDetail {
  return MAP_DETAILS.find((detail) => detail >= screenPixelsPerUnit) ?? MAP_DETAILS[MAP_DETAILS.length - 1];
}

export type RGB = readonly [number, number, number];

export const MAP_COLORS = {
  paper: [236, 226, 198],
  neighbour: [214, 204, 180],
  neighbourEdge: [150, 138, 116],
  land: [248, 212, 136],
  ink: [58, 38, 28],
  river: [86, 156, 216],
} as const satisfies Record<string, RGB>;

// Stroke widths in game units (they scale with zoom, like the map).
const SERBIA_OUTLINE = 3.5;
const NEIGHBOUR_OUTLINE = 1.2;
const SHADOW_OFFSET: Point = { x: 5, y: 6 };
const RIVER_SCALE = 0.6;

const css = ([r, g, b]: RGB, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

function tracePath(ctx: CanvasRenderingContext2D, points: readonly Point[], close: boolean): void {
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  if (close) {
    ctx.closePath();
  }
}

// Paper, neighbours, Serbia (shadow, fill, outline) and rivers.
export function paintMap(detail: MapDetail): HTMLCanvasElement {
  const bounds = mapBounds();
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bounds.w * detail);
  canvas.height = Math.ceil(bounds.h * detail);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.scale(detail, detail);
  ctx.translate(-bounds.x, -bounds.y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.fillStyle = css(MAP_COLORS.paper);
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

  for (const neighbour of NEIGHBOURS) {
    for (const ring of neighbour.rings) {
      tracePath(ctx, projectRing(ring), true);
      ctx.fillStyle = css(MAP_COLORS.neighbour);
      ctx.fill();
      ctx.strokeStyle = css(MAP_COLORS.neighbourEdge);
      ctx.lineWidth = NEIGHBOUR_OUTLINE;
      ctx.stroke();
    }
  }

  const serbia = SERBIA_RINGS.map(projectRing);
  ctx.save();
  ctx.translate(SHADOW_OFFSET.x, SHADOW_OFFSET.y);
  for (const ring of serbia) {
    tracePath(ctx, ring, true);
    ctx.fillStyle = css(MAP_COLORS.ink, 0.25);
    ctx.fill();
  }
  ctx.restore();
  for (const ring of serbia) {
    tracePath(ctx, ring, true);
    ctx.fillStyle = css(MAP_COLORS.land);
    ctx.fill();
  }

  ctx.strokeStyle = css(MAP_COLORS.river);
  for (const river of RIVERS) {
    tracePath(ctx, projectRing(river.path), false);
    ctx.lineWidth = river.width * RIVER_SCALE;
    ctx.stroke();
  }

  // Outline last so rivers do not cover the border.
  ctx.strokeStyle = css(MAP_COLORS.ink);
  ctx.lineWidth = SERBIA_OUTLINE;
  for (const ring of serbia) {
    tracePath(ctx, ring, true);
    ctx.stroke();
  }
  return canvas;
}
