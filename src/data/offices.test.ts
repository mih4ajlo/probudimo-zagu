import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { LEVEL_POINTS, OFFICES, OFFICE_IDS, getOffice, maxScore, type OfficeLevel } from "./offices";
import { REPLIES } from "./replies";

describe("OFFICES", () => {
  it("has all 60 offices from the CSV with unique ids", () => {
    expect(OFFICES).toHaveLength(60);
    expect(new Set(OFFICE_IDS).size).toBe(60);
  });

  it("has 27 OJT, 25 VJT, 4 AJT, 3 PJT and 1 VRHOVNO", () => {
    const count = (level: OfficeLevel) => OFFICES.filter((o) => o.level === level).length;
    expect([count("OJT"), count("VJT"), count("AJT"), count("PJT"), count("VRHOVNO")]).toEqual([27, 25, 4, 3, 1]);
  });

  it("gives each office its level's points and a max score of 1060", () => {
    for (const office of OFFICES) {
      expect(office.points).toBe(LEVEL_POINTS[office.level]);
    }
    expect(maxScore()).toBe(1060);
  });

  it("fixes the CSV's broken Š and Ž in city names", () => {
    const cities = new Set(OFFICES.map((o) => o.city));
    expect(cities.has("Šabac")).toBe(true);
    expect(cities.has("Požarevac")).toBe(true);
    expect([...cities].some((c) => c.startsWith("š") || c.includes("Pošar"))).toBe(false);
  });

  it("knows the coordinates of every office's city", () => {
    for (const office of OFFICES) {
      expect(CITIES[office.city], office.city).toBeDefined();
    }
  });

  it("gives every office a reply line that names it", () => {
    for (const office of OFFICES) {
      expect(office.lines.length).toBeGreaterThan(0);
      expect(office.lines[0].startsWith(office.name)).toBe(true);
    }
    for (const level of Object.keys(LEVEL_POINTS) as OfficeLevel[]) {
      expect(REPLIES[level].length).toBeGreaterThan(0);
    }
  });

  it("looks offices up by id", () => {
    expect(getOffice("vrhovno-javno-tuzilastvo")?.level).toBe("VRHOVNO");
    expect(getOffice("nope")).toBeUndefined();
  });
});
