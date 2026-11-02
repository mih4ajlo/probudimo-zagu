import { describe, expect, it } from "vitest";
import { wrappedRows } from "../textFit";
import { OJT_AREAS, TOK_ID, VJT_AJT, areaLine, legalHop } from "./jurisdiction";
import { OFFICES, getOffice } from "./offices";

const ids = (level: string) => OFFICES.filter((o) => o.level === level).map((o) => o.id);

describe("jurisdiction", () => {
  it("maps all 58 OJT to an existing VJT", () => {
    expect(Object.keys(OJT_AREAS).sort()).toEqual(ids("OJT").sort());
    expect(Object.keys(OJT_AREAS)).toHaveLength(58);
    for (const [ojt, area] of Object.entries(OJT_AREAS)) {
      expect(getOffice(area.vjt)?.level, ojt).toBe("VJT");
    }
  });

  it("gives every VJT an OJT and an AJT", () => {
    expect(Object.keys(VJT_AJT).sort()).toEqual(ids("VJT").sort());
    for (const [vjt, ajt] of Object.entries(VJT_AJT)) {
      expect(getOffice(ajt)?.level, vjt).toBe("AJT");
      expect(Object.values(OJT_AREAS).some((a) => a.vjt === vjt), vjt).toBe(true);
    }
  });

  it("matches the law's AJT sizes", () => {
    const size = (ajt: string) => Object.values(VJT_AJT).filter((a) => a === ajt).length;
    expect([size("ajt-u-beogradu"), size("ajt-u-novom-sadu"), size("ajt-u-kragujevcu"), size("ajt-u-nisu")]).toEqual([
      4, 6, 8, 7,
    ]);
  });

  it("puts VJT Šabac under AJT Novi Sad", () => {
    expect(VJT_AJT["vjt-u-sapcu"]).toBe("ajt-u-novom-sadu");
  });

  it("never gives a municipality to two OJT", () => {
    const all = Object.values(OJT_AREAS).flatMap((a) => a.municipalities);
    expect(new Set(all).size).toBe(all.length);
  });

  it("lists municipalities for every OJT", () => {
    for (const [ojt, area] of Object.entries(OJT_AREAS)) {
      expect(area.municipalities.length, ojt).toBeGreaterThan(0);
      for (const m of area.municipalities) {
        expect(m, ojt).toBe(m.trim());
        expect(m.length, ojt).toBeGreaterThan(0);
      }
    }
  });

  it("allows only real hops", () => {
    expect(legalHop("ojt-u-novom-sadu", "vjt-u-novom-sadu", "level")).toBe(true);
    expect(legalHop("vjt-u-novom-sadu", "ojt-u-novom-sadu", "level")).toBe(true);
    expect(legalHop("ojt-u-rumi", "vjt-u-novom-sadu", "level")).toBe(false);
    expect(legalHop("vjt-u-novom-sadu", TOK_ID, "tok")).toBe(true);
    expect(legalHop(TOK_ID, "prvo-ojt-u-beogradu", "tok")).toBe(true);
    expect(legalHop("vjt-u-novom-sadu", "vjt-u-beogradu", "tok")).toBe(false);
    expect(legalHop("vjt-u-novom-sadu", "vjt-u-beogradu", "area")).toBe(true);
    expect(legalHop("vjt-u-beogradu", "vjt-u-beogradu", "area")).toBe(false);
    expect(legalHop("ojt-u-nisu", "vjt-u-beogradu", "area")).toBe(false);
  });

  it("names the area and its appeals office", () => {
    expect(areaLine("vjt-u-sapcu")).toBe("Područje VJT u Šapcu; žalbe: AJT u Novom Sadu.");
  });

  it("keeps every area line to two rows", () => {
    for (const vjt of Object.keys(VJT_AJT)) {
      expect(wrappedRows(areaLine(vjt)), vjt).toBeLessThanOrEqual(2);
    }
  });
});
