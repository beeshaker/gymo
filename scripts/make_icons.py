"""Generate PWA icons into public/icons/: a tilted dumbbell rising over progress bars."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
SS = 4  # supersampling for smooth edges

BG_TOP = (28, 34, 18)
BG_BOTTOM = (11, 12, 16)
LIME = (198, 242, 78)
LIME_DEEP = (122, 170, 30)
INK = (12, 14, 10)


def gradient(size: int) -> Image.Image:
    """Diagonal dark gradient with a soft lime glow behind the mark."""
    g = Image.linear_gradient("L").resize((size, size))
    bg = Image.composite(Image.new("RGB", (size, size), BG_BOTTOM), Image.new("RGB", (size, size), BG_TOP), g)
    glow = Image.new("L", (size, size), 0)
    ImageDraw.Draw(glow).ellipse([size * 0.18, size * 0.2, size * 0.86, size * 0.88], fill=110)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.14))
    return Image.composite(Image.new("RGB", (size, size), (70, 96, 20)), bg, glow)


def dumbbell(size: int) -> Image.Image:
    """Horizontal dumbbell on a transparent layer, `size` wide."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    u = size / 20
    cy = size / 2
    rad = u * 0.9
    d.rounded_rectangle([4 * u, cy - 0.75 * u, 16 * u, cy + 0.75 * u], rad * 0.6, LIME)
    for x0, w, h, col in [(1.2, 1.6, 5.2, LIME_DEEP), (3.0, 2.4, 9.0, LIME)]:
        for left in (x0 * u, (20 - x0 - w) * u):
            d.rounded_rectangle([left, cy - h / 2 * u, left + w * u, cy + h / 2 * u], rad, col)
    return layer


def icon(size: int, scale: float, rounded: bool) -> Image.Image:
    S = size * SS
    img = gradient(S).convert("RGBA")
    d = ImageDraw.Draw(img)
    c = S / 2
    span = S * scale  # content box

    # Progress bars, bottom-left to right, rising.
    bw = span * 0.17
    gap = span * 0.07
    base = c + span * 0.42
    x = c - span * 0.5 + span * 0.06
    for h, col in zip((0.26, 0.42, 0.6), ((58, 78, 24), (104, 142, 34), LIME)):
        d.rounded_rectangle([x, base - span * h, x + bw, base], bw * 0.28, col)
        x += bw + gap

    # Dumbbell tilted upward, with a dark outline for separation from the bars.
    db = dumbbell(int(span * 1.02)).rotate(32, resample=Image.BICUBIC, expand=True)
    shadow = Image.new("RGBA", db.size, (0, 0, 0, 0))
    shadow.paste(INK, mask=db.split()[3].filter(ImageFilter.MaxFilter(int(S * 0.02) | 1)))
    ox = int(c - db.width / 2 + span * 0.04)
    oy = int(c - db.height / 2 - span * 0.1)
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(S * 0.006)), (ox, oy))
    img.alpha_composite(db, (ox, oy))

    if rounded:
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], S * 0.22, 255)
        img.putalpha(mask)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    out.mkdir(parents=True, exist_ok=True)
    icon(192, 0.78, True).save(out / "icon-192.png")
    icon(512, 0.78, True).save(out / "icon-512.png")
    # Maskable: full-bleed background, content inside the 80% safe zone.
    icon(512, 0.62, False).convert("RGB").save(out / "icon-maskable-512.png")
    icon(180, 0.66, False).convert("RGB").save(out / "apple-touch-icon.png")
    print("icons written to", out)
