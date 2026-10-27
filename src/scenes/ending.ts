import { k } from "../kaplayContext";

export function registerEndingScene(): void {
  k.scene("ending", () => {
    k.add([k.text("Ending stub", { size: 12 }), k.pos(16, 16)]);
  });
}
