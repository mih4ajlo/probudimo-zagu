import { describe, expect, it } from "vitest";
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
    expect(getSession().score).toEqual({ total: 0, visited: [] });
  });
});

describe("hunt result", () => {
  it("is cleared on reset", () => {
    resetSession();
    getSession().hunt = { visits: 9, crowd: 7 };
    resetSession();
    expect(getSession().hunt).toBeNull();
  });
});
