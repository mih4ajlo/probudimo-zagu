import { describe, expect, it } from "vitest";
import { visitLord } from "./score";
import { getSession, resetSession } from "./session";

describe("session", () => {
  it("keeps score across scene hops until reset", () => {
    resetSession();
    visitLord(getSession().score, "north");
    expect(getSession().score.total).toBe(10);
  });

  it("starts a fresh score of 0 on reset", () => {
    resetSession();
    visitLord(getSession().score, "west");
    resetSession();
    expect(getSession().score).toEqual({ total: 0, visited: [] });
  });
});
