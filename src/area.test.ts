import { describe, expect, it } from "vitest";
import { AREA_REPEAT_SECONDS, createAreaWatch, vjtAreaAt, watchArea } from "./area";
import { CITIES } from "./data/cities";
import { OJT_AREAS } from "./data/jurisdiction";
import { getOffice } from "./data/offices";
import { project, type Point } from "./geo";

const seats = new Map<string, Point>(
  Object.keys(OJT_AREAS).map((id) => [id, project(CITIES[getOffice(id)!.city])]),
);
const at = (city: string) => vjtAreaAt(project(CITIES[city]), seats);

describe("vjtAreaAt", () => {
  it("finds the real VJT for towns away from borders", () => {
    expect(at("Ruma")).toBe("vjt-u-sremskoj-mitrovici");
    expect(at("Loznica")).toBe("vjt-u-sapcu");
    expect(at("Ub")).toBe("vjt-u-valjevu");
    expect(at("Niš")).toBe("vjt-u-nisu");
  });

  it("returns null with no seats", () => {
    expect(vjtAreaAt({ x: 0, y: 0 }, new Map())).toBeNull();
  });
});

describe("watchArea", () => {
  it("reports an area only when it changes", () => {
    const state = createAreaWatch();
    expect(watchArea(state, "a", 0)).toBe("a");
    expect(watchArea(state, "a", 1)).toBeNull();
    expect(watchArea(state, "b", 2)).toBe("b");
    expect(watchArea(state, "b", 3)).toBeNull();
  });

  it("does not name an area again soon when zig-zagging across a border", () => {
    const state = createAreaWatch();
    watchArea(state, "a", 0);
    watchArea(state, "b", 1);
    expect(watchArea(state, "a", 2)).toBeNull();
    expect(watchArea(state, "b", 3)).toBeNull();
    expect(state.current).toBe("b");
  });

  it("names an area again after AREA_REPEAT_SECONDS", () => {
    const state = createAreaWatch();
    watchArea(state, "a", 0);
    watchArea(state, "b", 1);
    expect(watchArea(state, "a", AREA_REPEAT_SECONDS)).toBe("a");
  });
});
