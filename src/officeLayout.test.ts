import { describe, expect, it } from "vitest";
import { CITIES } from "./data/cities";
import { OFFICES } from "./data/offices";
import { SERBIA_RINGS } from "./data/serbia-geo";
import { isInsideAny, project, projectRing, type Point } from "./geo";
import {
  MARKER_GAP,
  MARKER_SIZE,
  MAX_RING_RADIUS,
  TOUCH_RADIUS,
  WALK_GAP,
  layoutOffices,
  ringRadius,
  spawnPoint,
  touchedOffice,
  visitToStart,
} from "./officeLayout";

const city: Point = { x: 100, y: 100 };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const serbia = SERBIA_RINGS.map(projectRing);

describe("layoutOffices", () => {
  it("puts a city's only office on the city point", () => {
    const positions = layoutOffices([{ id: "a", city: "X" }], () => city);
    expect(positions.get("a")).toEqual(city);
  });

  it("rings many offices around their city without overlap", () => {
    const offices = Array.from({ length: 9 }, (_, i) => ({ id: `o${i}`, city: "X" }));
    const points = [...layoutOffices(offices, () => city).values()];
    for (const p of points) {
      expect(distance(p, city)).toBeLessThanOrEqual(MAX_RING_RADIUS);
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(distance(points[i], points[j])).toBeGreaterThanOrEqual(MARKER_SIZE + MARKER_GAP);
      }
    }
  });

  it("leaves a walkable gap between neighbouring offices' touch zones", () => {
    const offices = Array.from({ length: 9 }, (_, i) => ({ id: `o${i}`, city: "X" }));
    const points = [...layoutOffices(offices, () => city).values()];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(distance(points[i], points[j])).toBeGreaterThanOrEqual(2 * TOUCH_RADIUS + WALK_GAP - 1e-9);
      }
    }
  });

  it("never makes a ring wider than MAX_RING_RADIUS", () => {
    expect(ringRadius(40)).toBe(MAX_RING_RADIUS);
  });

  it("keeps every real office within MAX_RING_RADIUS of its city", () => {
    const positions = layoutOffices(OFFICES, (name) => project(CITIES[name]));
    for (const office of OFFICES) {
      const p = positions.get(office.id) as Point;
      expect(distance(p, project(CITIES[office.city])), office.id).toBeLessThanOrEqual(MAX_RING_RADIUS);
    }
  });

  it("places every real office on land", () => {
    const positions = layoutOffices(OFFICES, (name) => project(CITIES[name]));
    expect(positions.size).toBe(OFFICES.length);
    for (const [id, p] of positions) {
      expect(isInsideAny(p, serbia), id).toBe(true);
    }
  });
});

describe("touchedOffice", () => {
  const positions = new Map<string, Point>([
    ["near", { x: 0, y: 0 }],
    ["far", { x: 50, y: 0 }],
  ]);

  it("returns the office whose marker the feet touch", () => {
    expect(touchedOffice({ x: TOUCH_RADIUS - 1, y: 0 }, positions)).toBe("near");
  });

  it("returns null when no marker is in reach", () => {
    expect(touchedOffice({ x: 25, y: 0 }, positions)).toBeNull();
  });
});

describe("visitToStart", () => {
  it("starts a visit when stepping onto a new office", () => {
    expect(visitToStart("a", null, false)).toBe("a");
    expect(visitToStart("b", "a", false)).toBe("b");
  });

  it("does not restart while still standing on the same office", () => {
    expect(visitToStart("a", "a", false)).toBeNull();
  });

  it("does not start a visit while a dialog is open", () => {
    expect(visitToStart("b", "a", true)).toBeNull();
  });

  it("does nothing when not touching an office", () => {
    expect(visitToStart(null, "a", false)).toBeNull();
  });
});

describe("spawnPoint", () => {
  it("starts the princess on land near Beograd, not on an office", () => {
    const spawn = spawnPoint();
    expect(isInsideAny(spawn, serbia)).toBe(true);
    expect(distance(spawn, project(CITIES.Beograd))).toBeLessThan(80);
    const positions = layoutOffices(OFFICES, (name) => project(CITIES[name]));
    expect(touchedOffice(spawn, positions)).toBeNull();
  });
});
