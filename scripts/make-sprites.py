"""Turn the source art in assets/ into small game sprites in public/sprites/.

Run: python scripts/make-sprites.py
Needs Pillow. Re-run after changing anything in assets/.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
OUT = ROOT / "public" / "sprites"

PLAYER_HEIGHT = 24  # overworld sprite, ~1.5 tiles tall
PORTRAIT_HEIGHT = 96  # title screen
SCREEN = (320, 180)  # game resolution


def cut_out_character(path: Path) -> Image.Image:
    """Flood-fill the flat background from the corners and crop to the figure."""
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    for corner in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(image, corner, (0, 0, 0, 0), thresh=40)
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
    return image.resize(SCREEN, Image.Resampling.BOX)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    princess = cut_out_character(ASSETS / "zaga_glavno.jfif")
    shrink(princess, PLAYER_HEIGHT).save(OUT / "princess.png")
    shrink(princess, PORTRAIT_HEIGHT).save(OUT / "princess-portrait.png")
    wake_background(ASSETS / "usnula_zaga.jfif").save(OUT / "wake.png")


if __name__ == "__main__":
    main()
