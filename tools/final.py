"""Build the final favicon set for the portfolio."""
import os
from PIL import Image
from mkfav import tile, draw_text, COND_BLACK

# Repo root, one level up from tools/.
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, "")

# Browser tab / .ico: rounded tile, sits on light and dark tab bars alike.
mark = draw_text(tile(0.22), "JH", COND_BLACK, 0.58, dy_frac=-0.01, tracking=-14)

# iOS masks the touch icon itself, so ship it square and full-bleed.
touch = draw_text(tile(0.0), "JH", COND_BLACK, 0.52, dy_frac=-0.01, tracking=-14)

sizes = [16, 32, 48, 64, 128, 256]
mark.resize((256, 256), Image.LANCZOS).save(
    OUT + "favicon.ico",
    format="ICO",
    sizes=[(s, s) for s in sizes],
)
mark.resize((32, 32), Image.LANCZOS).save(OUT + "favicon-32.png")
mark.resize((192, 192), Image.LANCZOS).save(OUT + "icon-192.png")
touch.convert("RGB").resize((180, 180), Image.LANCZOS).save(OUT + "apple-touch-icon.png")

# Preview strip at real tab sizes.
zoom = 8
strip = Image.new("RGB", (3 * 16 * zoom + 40, 16 * zoom + 20), (250, 250, 250))
for i, s in enumerate((16, 32, 48)):
    small = mark.resize((s, s), Image.LANCZOS)
    big = small.resize((16 * zoom, 16 * zoom), Image.NEAREST)
    strip.paste(big, (10 + i * (16 * zoom + 10), 10), big)
strip.save("final-preview.png")
print("ok")
