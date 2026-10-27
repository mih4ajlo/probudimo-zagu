import { describe, expect, it } from "vitest";
import { LORDS } from "./data/lords";
import { isReadyForEnding } from "./progress";

const ids = LORDS.map((lord) => lord.id);

describe("isReadyForEnding", () => {
  it("is false while one lord is still unvisited", () => {
    expect(isReadyForEnding(["north", "east"], ids)).toBe(false);
  });

  it("is true once every lord is visited", () => {
    expect(isReadyForEnding(ids, ids)).toBe(true);
  });

  it("ignores extra visited ids", () => {
    expect(isReadyForEnding([...ids, "dragon"], ids)).toBe(true);
  });
});
