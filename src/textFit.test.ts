import { describe, expect, it } from "vitest";
import { wrappedRows } from "./textFit";

describe("wrappedRows", () => {
  it("wraps like Kaplay: a full row cannot also hold the space after it", () => {
    // Kaplay put "zatvora." on row 2 here (measured with k.formatText at width 284).
    const text =
      "OJT goni dela do 10 godina zatvora. Teža dela, i neka sa posebne liste (mito, nasilje na javnom skupu), goni VJT. Tužilaštvo prati sud.";
    expect(wrappedRows(text)).toBe(5);
  });

  it("lets the last word fill the row", () => {
    expect(wrappedRows("a".repeat(30) + " bbbb")).toBe(1);
  });
});
