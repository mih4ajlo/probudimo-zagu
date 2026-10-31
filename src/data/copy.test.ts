import { describe, expect, it } from "vitest";
import { foundIn, huntHud } from "./hunt";
import { backToTitle, MODES, scoreLine, wakeHud } from "./story";

describe("on-screen copy", () => {
  it("shows the Find Zaga HUD and result in Serbian", () => {
    expect(huntHud(2, 3, 7)).toBe("Runda 2/3  Posete 7");
    expect(foundIn(9)).toBe("Broj poseta: 9");
  });

  it("shows the Wake the offices HUD and score in Serbian", () => {
    expect(wakeHud(120, 1650, 4, 58)).toBe("Poeni 120/1650  Tužilaštva 4/58");
    expect(scoreLine(120, 1650)).toBe("Poeni 120 / 1650");
  });

  it("tells keys and touch how to get back to the menu", () => {
    expect(backToTitle(false)).toBe("Enter za meni");
    expect(backToTitle(true)).toBe("Dodirni za meni");
  });

  it("fits each mode name in the title button with its > < marks", () => {
    // 200-unit button, 8 units per letter.
    for (const mode of MODES) {
      expect(`> ${mode.label} <`.length * 8).toBeLessThanOrEqual(200);
    }
  });
});
