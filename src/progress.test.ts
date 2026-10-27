import { describe, expect, it } from "vitest";
import { OFFICE_IDS } from "./data/offices";
import { isReadyForEnding } from "./progress";

describe("isReadyForEnding", () => {
  it("is false while one office is still asleep", () => {
    expect(isReadyForEnding(OFFICE_IDS.slice(1), OFFICE_IDS)).toBe(false);
  });

  it("is true once every office is visited", () => {
    expect(isReadyForEnding(OFFICE_IDS, OFFICE_IDS)).toBe(true);
  });

  it("ignores extra visited ids", () => {
    expect(isReadyForEnding([...OFFICE_IDS, "dragon"], OFFICE_IDS)).toBe(true);
  });
});
