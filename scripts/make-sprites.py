"""Turn the source art in assets/ into small game sprites in public/sprites/.

Run: python scripts/make-sprites.py
Needs Pillow. Re-run after changing anything in assets/.
"""
from pathlib import Path

import colorsys

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
OUT = ROOT / "public" / "sprites"

# The game lays out in 320x180 units and renders RENDER_SCALE pixels per unit
# (src/kaplayContext.ts). Sprites are made at that detail and drawn at
# 1/DETAIL scale (SPRITE_SCALE in src/assets.ts). Keep DETAIL == RENDER_SCALE.
DETAIL = 4
PLAYER_HEIGHT = 24 * DETAIL  # overworld sprite, ~1.5 tiles tall
PORTRAIT_HEIGHT = 96 * DETAIL  # title screen
SCREEN = (320 * DETAIL, 180 * DETAIL)


def cut_out_character(path: Path) -> Image.Image:
    """Flood-fill the flat background from the corners and crop to the figure."""
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    for corner in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(image, corner, (0, 0, 0, 0), thresh=40)
    # Shrink the mask a few pixels to drop the light JPEG fringe around the figure.
    image.putalpha(image.getchannel("A").filter(ImageFilter.MinFilter(5)))
    return image.crop(image.getbbox())


def shrink(image: Image.Image, height: int) -> Image.Image:
    """Downscale with box averaging, then snap alpha so edges stay crisp."""
    width = round(image.width * height / image.height)
    small = image.resize((width, height), Image.Resampling.BOX)
    alpha = small.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    small.putalpha(alpha)
    return small


# Baked-in HUD text in usnula_zaga.jfif, as fractions of (left, top, right, bottom).
WAKE_TEXT_BOXES = [(0.0, 0.0, 0.25, 0.18), (0.74, 0.0, 1.0, 0.10)]


def wake_background(path: Path) -> Image.Image:
    """Paint over the baked-in HUD text with the wall below it, fit to screen."""
    image = Image.open(path).convert("RGB")
    width, height = image.size
    for left, top, right, bottom in WAKE_TEXT_BOXES:
        box = (round(left * width), round(top * height), round(right * width), round(bottom * height))
        below = image.crop((box[0], box[3], box[2], box[3] + 1))
        patch = below.resize((box[2] - box[0], box[3] - box[1]))
        patch = patch.filter(ImageFilter.GaussianBlur(6))
        image.paste(patch, box[:2])
    target_width = round(height * SCREEN[0] / SCREEN[1])
    offset = (width - target_width) // 2
    image = image.crop((offset, 0, offset + target_width, height))
    return dress_wake(image.resize(SCREEN, Image.Resampling.BOX))


# Wake-scene touch-ups so the sleeper matches the princess sprite. Coordinates
# are pixels in the final SCREEN-sized image (1280x720).
HAIR_BOX = (620, 65, 870, 275)
NECKLACE_BOX = (622, 268, 765, 374)
SHIRT = [(606, 316), (630, 324), (700, 325), (732, 316), (760, 303), (778, 297), (697, 432)]
COLLARS = [[(603, 312), (642, 330), (614, 350)], [(778, 296), (744, 318), (790, 322)]]
LAPELS = [
    [(590, 322), (606, 316), (697, 432), (688, 448)],
    [(778, 297), (794, 302), (706, 446), (697, 432)],
]
BUTTONS = [(697, 352), (697, 377), (697, 402)]
MEDAL = (748, 368)
WHITE, SHIRT_SHADE = (236, 236, 242), (196, 198, 210)
LAPEL, JACKET_EDGE = (44, 44, 58), (10, 10, 16)


def is_hair_blue(rgb: tuple[int, int, int]) -> bool:
    hue, sat, val = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    return 0.53 <= hue <= 0.66 and sat > 0.35 and val > 0.3


def is_necklace_grey(rgb: tuple[int, int, int]) -> bool:
    _, sat, val = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    return sat < 0.25 and 0.27 < val < 0.65


def is_shirt_dark(rgb: tuple[int, int, int]) -> bool:
    return max(rgb) < 60


def dress_wake(image: Image.Image) -> Image.Image:
    px = image.load()

    # Blue hair -> golden yellow, keeping the original shading.
    for x in range(HAIR_BOX[0], HAIR_BOX[2]):
        for y in range(HAIR_BOX[1], HAIR_BOX[3]):
            if is_hair_blue(px[x, y]):
                val = colorsys.rgb_to_hsv(*(c / 255 for c in px[x, y]))[2]
                rgb = colorsys.hsv_to_rgb(0.12, 0.58, min(1.0, val * 1.15))
                px[x, y] = tuple(round(c * 255) for c in rgb)

    # Necklace pixels (grown by 1px to catch the soft edge of the chain).
    grey = {
        (x, y)
        for x in range(NECKLACE_BOX[0], NECKLACE_BOX[2])
        for y in range(NECKLACE_BOX[1], NECKLACE_BOX[3])
        if is_necklace_grey(px[x, y])
    }
    holes = {(x + dx, y + dy) for x, y in grey for dx in (-1, 0, 1) for dy in (-1, 0, 1)}

    # Formal shirt, collar and jacket lapels, painted only over the dark top
    # (and the necklace on it) so the chin and neck stay as drawn.
    paint = Image.new("RGB", image.size)
    mask = Image.new("L", image.size, 0)
    draw_paint, draw_mask = ImageDraw.Draw(paint), ImageDraw.Draw(mask)
    for lapel in LAPELS:
        draw_paint.polygon(lapel, fill=LAPEL, outline=JACKET_EDGE)
        draw_mask.polygon(lapel, fill=255, outline=255)
    draw_paint.polygon(SHIRT, fill=WHITE)
    draw_mask.polygon(SHIRT, fill=255)
    draw_paint.line([(697, 330), (697, 428)], fill=SHIRT_SHADE, width=3)
    for bx, by in BUTTONS:
        draw_paint.ellipse((bx - 3, by - 3, bx + 3, by + 3), fill=SHIRT_SHADE)
    for collar in COLLARS:
        draw_paint.polygon(collar, fill=WHITE, outline=SHIRT_SHADE)
        draw_mask.polygon(collar, fill=255, outline=255)
    mpx = mask.load()
    for x in range(image.width):
        for y in range(260, 460):
            if not mpx[x, y]:
                continue
            if is_shirt_dark(px[x, y]) or (x, y) in holes:
                holes.discard((x, y))
            else:
                mpx[x, y] = 0
    image.paste(paint, (0, 0), mask)

    # Remaining necklace (on skin or plain shirt): fill from non-necklace neighbours.
    while holes:
        filled = {}
        for x, y in holes:
            around = [
                px[x + dx, y + dy]
                for dx in (-1, 0, 1)
                for dy in (-1, 0, 1)
                if (x + dx, y + dy) not in holes
            ]
            if around:
                filled[(x, y)] = tuple(sum(c[i] for c in around) // len(around) for i in range(3))
        if not filled:
            break
        for point, rgb in filled.items():
            px[point] = rgb
        holes -= filled.keys()

    # Medal on her left lapel: red ribbon, gold disc.
    draw = ImageDraw.Draw(image)
    mx, my = MEDAL
    draw.rectangle((mx - 7, my - 22, mx + 7, my - 8), fill=(170, 30, 40), outline=JACKET_EDGE)
    draw.rectangle((mx - 2, my - 22, mx + 2, my - 8), fill=(40, 70, 160))
    draw.ellipse((mx - 9, my - 9, mx + 9, my + 9), fill=(222, 178, 52), outline=(120, 80, 20), width=2)
    draw.ellipse((mx - 4, my - 4, mx + 1, my + 1), fill=(252, 228, 140))
    return image


# Princess sheet. The cut-out faces right; the game mirrors it for left.
# Coordinates are pixels in the cut-out scaled to SHEET_WORK_HEIGHT tall.
SHEET_WORK_HEIGHT = 384
SHEET_PAD_X, SHEET_PAD_TOP = 56, 8
LEG_TOP, LEG_X = 305, (50, 198)
LEG_SPLIT_X = 120
LEG_OVERLAP = 14
LEFT_ARM = [(10, 150), (45, 150), (58, 170), (58, 285), (56, 316), (14, 316), (4, 290), (0, 240), (0, 180)]
RIGHT_ARM = [(185, 150), (215, 155), (228, 200), (228, 280), (225, 311), (197, 311), (190, 285), (186, 220)]
LEFT_SHOULDER, RIGHT_SHOULDER = (35, 162), (196, 165)
MOUTH = (147, 122, 166, 139)
# Frame order must match PRINCESS_FRAMES in src/assets.ts.
SHEET_FRAMES = ["idle", "step-left", "step-right", "shout-1", "shout-2"]


def region(image: Image.Image, polygon: list[tuple[int, int]] | None = None, box=None) -> Image.Image:
    """Copy only the pixels inside a polygon or box; everything else transparent."""
    mask = Image.new("L", image.size, 0)
    if polygon:
        ImageDraw.Draw(mask).polygon(polygon, fill=255)
    if box:
        ImageDraw.Draw(mask).rectangle(box, fill=255)
    out = Image.new("RGBA", image.size, (0, 0, 0, 0))
    out.paste(image, (0, 0), Image.composite(image.getchannel("A"), mask, mask))
    return out


def without(image: Image.Image, *parts: Image.Image) -> Image.Image:
    """Clear the pixels that belong to any of the given parts."""
    out = image.copy()
    alpha = out.getchannel("A")
    for part in parts:
        alpha = Image.composite(Image.new("L", image.size, 0), alpha, part.getchannel("A"))
    out.putalpha(alpha)
    return out


def princess_frames(princess: Image.Image) -> list[Image.Image]:
    width = round(princess.width * SHEET_WORK_HEIGHT / princess.height)
    body = princess.resize((width, SHEET_WORK_HEIGHT), Image.Resampling.BOX)
    cell = (width + 2 * SHEET_PAD_X, SHEET_WORK_HEIGHT + SHEET_PAD_TOP)

    def frame(*layers: tuple[Image.Image, int, int]) -> Image.Image:
        out = Image.new("RGBA", cell, (0, 0, 0, 0))
        for layer, dx, dy in layers:
            out.alpha_composite(layer, (SHEET_PAD_X + dx, SHEET_PAD_TOP + dy))
        return out

    upper = without(
        body,
        region(body, box=(LEG_X[0], LEG_TOP, LEG_X[1], SHEET_WORK_HEIGHT)),
    )
    # Legs reach up under the jacket so moving them never opens a gap at the hips.
    leg_left = region(body, box=(LEG_X[0], LEG_TOP - LEG_OVERLAP, LEG_SPLIT_X - 1, SHEET_WORK_HEIGHT))
    leg_right = region(body, box=(LEG_SPLIT_X, LEG_TOP - LEG_OVERLAP, LEG_X[1], SHEET_WORK_HEIGHT))
    # A lifted leg is shorter: shift it up under the jacket; the body bobs up too.
    step_left = frame((leg_right, 0, 0), (leg_left, -4, -18), (upper, 0, -4))
    step_right = frame((leg_left, 0, 0), (leg_right, 4, -18), (upper, 0, -4))

    arm_left = region(body, polygon=LEFT_ARM)
    arm_right = region(body, polygon=RIGHT_ARM)
    shouting = without(body, arm_left, arm_right)
    ImageDraw.Draw(shouting).ellipse(MOUTH, fill=(92, 22, 34), outline=(52, 14, 20), width=2)

    def raise_arm(arm: Image.Image, shoulder: tuple[int, int], angle: float) -> Image.Image:
        # Rotate on a padded canvas so the raised arm is not clipped at the edges.
        padded = Image.new("RGBA", (body.width + 2 * SHEET_PAD_X, body.height), (0, 0, 0, 0))
        padded.paste(arm, (SHEET_PAD_X, 0))
        center = (shoulder[0] + SHEET_PAD_X, shoulder[1])
        return padded.rotate(angle, resample=Image.Resampling.NEAREST, center=center)

    def arms_up(spread: int, lift: int) -> Image.Image:
        # From hanging down to raised up, tilted `spread` degrees outward. The
        # far (right) sleeve is mostly hidden in this 3/4 view, so it is the
        # near arm mirrored onto the right shoulder, drawn behind the body.
        left = raise_arm(arm_left, LEFT_SHOULDER, -(180 - spread))
        right = left.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        mirrored_shoulder_x = right.width - 1 - (LEFT_SHOULDER[0] + SHEET_PAD_X)
        right_dx = RIGHT_SHOULDER[0] + SHEET_PAD_X - mirrored_shoulder_x
        right_dy = RIGHT_SHOULDER[1] - LEFT_SHOULDER[1]
        return frame(
            (right, right_dx - SHEET_PAD_X, right_dy - lift),
            (shouting, 0, -lift),
            (left, -SHEET_PAD_X, -lift),
        )

    return [frame((body, 0, 0)), step_left, step_right, arms_up(30, 0), arms_up(18, 8)]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    princess = cut_out_character(ASSETS / "zaga.jfif")
    frames = [shrink(f, f.height * PLAYER_HEIGHT // SHEET_WORK_HEIGHT) for f in princess_frames(princess)]
    sheet = Image.new("RGBA", (frames[0].width * len(frames), frames[0].height), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (index * frames[0].width, 0))
    sheet.save(OUT / "princess.png")
    shrink(princess, PORTRAIT_HEIGHT).save(OUT / "princess-portrait.png")
    wake_background(ASSETS / "usnula_zaga.jfif").save(OUT / "wake.png")


if __name__ == "__main__":
    main()
