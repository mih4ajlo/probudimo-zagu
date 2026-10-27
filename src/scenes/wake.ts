import { k } from "../kaplayContext";

export function registerWakeScene(): void {
  k.scene("wake", () => {
    k.add([k.text("Wake stub", { size: 12 }), k.pos(16, 16)]);
  });
}
