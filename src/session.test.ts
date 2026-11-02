import { describe, expect, it } from "vitest";
import { carriedCase, visitForCases } from "./cases";
import { visitOffice } from "./score";
import { getSession, resetSession } from "./session";

describe("session", () => {
  it("keeps score across scene hops until reset", () => {
    resetSession();
    visitOffice(getSession().score, "ojt-u-novom-sadu");
    expect(getSession().score.total).toBe(10);
  });

  it("starts a fresh score of 0 on reset", () => {
    resetSession();
    visitOffice(getSession().score, "vrhovno-javno-tuzilastvo");
    resetSession();
    expect(getSession().score).toEqual({ total: 0, visited: [], cases: [] });
  });
});

describe("hunt result", () => {
  it("is cleared on reset", () => {
    resetSession();
    getSession().hunt = { visits: 9 };
    resetSession();
    expect(getSession().hunt).toBeNull();
  });
});

describe("cases", () => {
  it("starts fresh cases on reset", () => {
    resetSession();
    visitForCases(getSession().cases, "vjt-u-beogradu");
    expect(carriedCase(getSession().cases)).not.toBeNull();
    resetSession();
    const cases = getSession().cases;
    expect(carriedCase(cases)).toBeNull();
    for (const entry of cases.entries) {
      expect(entry.status).toBe("waiting");
      expect(entry.dust).toBe(entry.file.startDust);
    }
  });
});

describe("teaching", () => {
  it("starts a new game with nothing taught", () => {
    resetSession();
    getSession().taught.push("level");
    expect(getSession().taught).toEqual(["level"]);
    resetSession();
    expect(getSession().taught).toEqual([]);
  });
});
