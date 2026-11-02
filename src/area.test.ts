import { describe, expect, it } from "vitest";
import { vjtAreaAt, watchArea } from "./area";
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
    const state = { current: null };
    expect(watchArea(state, "a")).toBe("a");
    expect(watchArea(state, "a")).toBeNull();
    expect(watchArea(state, "b")).toBe("b");
    expect(watchArea(state, "a")).toBe("a");
    expect(watchArea(state, "a")).toBeNull();
  });
});
