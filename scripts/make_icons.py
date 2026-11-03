"""Generate PWA icons (a simple dumbbell mark) into public/icons/."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
BG = (15, 17, 21)
FG = (198, 242, 78)


def draw(size: int, pad: float) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    s = size * (1 - 2 * pad)
    o = size * pad
    u = s / 16  # grid unit
    cy = o + s / 2
    r = u * 0.6
    # bar
    d.rounded_rectangle([o + 3 * u, cy - 0.7 * u, o + 13 * u, cy + 0.7 * u], r, FG)
    # plates (outer small, inner big) on each side
    for x0, w, h in [(1.5, 1.5, 5), (3.2, 2, 9)]:
        for left in (o + x0 * u, o + (16 - x0 - w) * u):
            d.rounded_rectangle([left, cy - h / 2 * u, left + w * u, cy + h / 2 * u], r, FG)
    return img


OUT.mkdir(parents=True, exist_ok=True)
draw(192, 0.12).save(OUT / "icon-192.png")
draw(512, 0.12).save(OUT / "icon-512.png")
draw(512, 0.22).save(OUT / "icon-maskable-512.png")
print("icons written to", OUT)
