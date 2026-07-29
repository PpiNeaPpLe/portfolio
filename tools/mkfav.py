"""Generate portfolio favicon candidates. Renders large, downsamples with LANCZOS."""
from PIL import Image, ImageDraw, ImageFont

TTC = "/System/Library/Fonts/HelveticaNeue.ttc"
BOLD, COND_BLACK = 1, 9

ACCENT_TOP = (251, 146, 60)     # #fb923c
ACCENT_BOT = (240, 115, 22)     # #f07316
INK = (16, 12, 8)
S = 1024


def tile(radius_frac=0.22):
    """Rounded square with a soft vertical brand gradient."""
    grad = Image.new("RGB", (1, S))
    for y in range(S):
        t = y / (S - 1)
        grad.putpixel((0, y), tuple(
            round(ACCENT_TOP[c] + (ACCENT_BOT[c] - ACCENT_TOP[c]) * t) for c in range(3)
        ))
    grad = grad.resize((S, S))

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, S - 1, S - 1], radius=int(S * radius_frac), fill=255
    )
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    img.paste(grad, (0, 0), mask)
    return img


def draw_text(img, text, face, size_frac, dy_frac=0.0, tracking=0):
    font = ImageFont.truetype(TTC, int(S * size_frac), index=face)
    d = ImageDraw.Draw(img)

    if tracking and len(text) > 1:
        widths = [d.textbbox((0, 0), ch, font=font)[2] - d.textbbox((0, 0), ch, font=font)[0]
                  for ch in text]
        total = sum(widths) + tracking * (len(text) - 1)
        bb = d.textbbox((0, 0), text, font=font)
        x = (S - total) / 2
        y = (S - (bb[3] - bb[1])) / 2 - bb[1] + S * dy_frac
        for ch, w in zip(text, widths):
            cb = d.textbbox((0, 0), ch, font=font)
            d.text((x - cb[0], y), ch, font=font, fill=INK)
            x += w + tracking
    else:
        bb = d.textbbox((0, 0), text, font=font)
        d.text(((S - (bb[2] - bb[0])) / 2 - bb[0],
                (S - (bb[3] - bb[1])) / 2 - bb[1] + S * dy_frac),
               text, font=font, fill=INK)
    return img


def candidates():
    a = draw_text(tile(), "JH", COND_BLACK, 0.62, dy_frac=-0.01, tracking=-14)
    b = draw_text(tile(), "JH", BOLD, 0.50, dy_frac=-0.01, tracking=-30)
    c = draw_text(tile(), "J", BOLD, 0.72, dy_frac=-0.02)
    d = draw_text(tile(), "J", COND_BLACK, 0.80, dy_frac=-0.02)
    return {"a_jh_condblack": a, "b_jh_bold": b, "c_j_bold": c, "d_j_condblack": d}


def contact_sheet(cands, sizes=(16, 32, 48), zoom=6):
    """One row per candidate: each size downsampled then blown up nearest-neighbour."""
    pad, label_w = 12, 0
    cell = max(sizes) * zoom
    W = label_w + len(sizes) * (cell + pad) + pad
    H = len(cands) * (cell + pad) + pad
    sheet = Image.new("RGB", (W, H), (30, 30, 34))
    for r, (name, img) in enumerate(cands.items()):
        for c, s in enumerate(sizes):
            small = img.resize((s, s), Image.LANCZOS)
            big = small.resize((s * zoom, s * zoom), Image.NEAREST)
            flat = Image.new("RGB", big.size, (250, 250, 250))
            flat.paste(big, (0, 0), big)
            sheet.paste(flat, (label_w + pad + c * (cell + pad), pad + r * (cell + pad)))
    return sheet


if __name__ == "__main__":
    cs = candidates()
    for name, img in cs.items():
        img.resize((256, 256), Image.LANCZOS).save(f"cand-{name}-256.png")
    contact_sheet(cs).save("contact-sheet.png")
    print("wrote", ", ".join(cs))
