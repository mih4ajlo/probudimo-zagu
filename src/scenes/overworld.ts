import { k } from "../kaplayContext";

export function registerOverworldScene(): void {
  k.scene("overworld", () => {
    k.add([k.text("Overworld stub", { size: 12 }), k.pos(16, 16)]);
  });
}
