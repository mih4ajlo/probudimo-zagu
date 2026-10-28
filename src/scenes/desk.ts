import { SPRITE_SCALE } from "../assets";
import type { Point } from "../geo";
import { k } from "../kaplayContext";

// Top of her head in the desk pictures, in game units (320x180).
export const DESK_HEAD: Point = { x: 182, y: 36 };
const Z_EVERY = 0.9;
const Z_LIFE = 2.2;

export function addDesk(sprite: string) {
  return k.add([k.sprite(sprite), k.scale(SPRITE_SCALE), k.pos(0, 0), k.opacity(1)]);
}

// Z's rise from her head, drift up-right, grow and fade. burst() flings the
// ones in the air away and stops new ones.
export function addSnore(): { burst(): void } {
  let snoring = true;
  const zs: ReturnType<typeof spawn>[] = [];
  function spawn() {
    const z = k.add([
      k.text("Z", { size: 8 }),
      k.pos(DESK_HEAD.x + 14, DESK_HEAD.y - 4),
      k.anchor("center"),
      k.color(24, 26, 60),
      k.opacity(1),
      // Above both desk pictures, so the burst stays visible after she wakes.
      k.z(1),
      k.scale(1),
      { age: 0, velocity: k.vec2(14 + k.rand(-4, 4), -24) },
    ]);
    z.onUpdate(() => {
      z.age += k.dt();
      z.pos = z.pos.add(z.velocity.scale(k.dt()));
      z.scale = k.vec2(1 + z.age * 0.5);
      z.opacity = Math.max(0, 1 - z.age / Z_LIFE);
      if (z.opacity <= 0) {
        z.destroy();
      }
    });
    return z;
  }
  k.loop(Z_EVERY, () => {
    if (snoring) {
      zs.push(spawn());
    }
  });
  return {
    burst() {
      snoring = false;
      for (const z of zs) {
        z.velocity = k.vec2(k.rand(-120, 120), k.rand(-120, -40));
      }
    },
  };
}

// The text box used by the desk scenes (same place as the wake scene's).
export function addDeskBox(text: string) {
  k.add([k.rect(300, 48), k.pos(10, 122), k.color(12, 10, 20), k.outline(1, k.rgb(220, 200, 140))]);
  return k.add([k.text(text, { size: 8, width: 284, lineSpacing: 4 }), k.pos(18, 130)]);
}
