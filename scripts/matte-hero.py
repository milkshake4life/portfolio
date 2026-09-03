#!/usr/bin/env python3
"""Cut a phone mockup out of its flat dark backdrop and frame it like the Scope hero.

Usage:
  python3 scripts/matte-hero.py SOURCE DEST [--threshold N] [--canvas WxH] [--inset N]

The backdrop is removed by flood-filling inward from the image border, so dark
pixels that live *inside* the phones (dark app screens, black bezels) are kept.
A global "near-black is transparent" key would punch holes through them instead.
"""

import argparse
from collections import deque
from PIL import Image, ImageFilter

# Scope's hero: 831x864 canvas with the phones inset 12px on every side.
CANVAS = (831, 864)
INSET = 12
# Backdrop pixels are near-black; phone bezels sit well above this.
THRESHOLD = 30
# Scope uses a hard cut (no mid-alpha). Feathered edges get
# palette-quantized by next/image into a visible grey plate.
FEATHER = 0


def background_mask(rgb, threshold):
    """Border-connected near-black pixels."""
    w, h = rgb.size
    px = rgb.load()
    is_dark = bytearray(w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            r, g, b = px[x, y][:3]
            if r <= threshold and g <= threshold and b <= threshold:
                is_dark[row + x] = 1

    seen = bytearray(w * h)
    queue = deque()

    def seed(x, y):
        i = y * w + x
        if is_dark[i] and not seen[i]:
            seen[i] = 1
            queue.append(i)

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while queue:
        i = queue.popleft()
        x = i % w
        if x > 0 and is_dark[i - 1] and not seen[i - 1]:
            seen[i - 1] = 1
            queue.append(i - 1)
        if x < w - 1 and is_dark[i + 1] and not seen[i + 1]:
            seen[i + 1] = 1
            queue.append(i + 1)
        if i >= w and is_dark[i - w] and not seen[i - w]:
            seen[i - w] = 1
            queue.append(i - w)
        if i + w < w * h and is_dark[i + w] and not seen[i + w]:
            seen[i + w] = 1
            queue.append(i + w)

    return seen


def matte(src, threshold, feather):
    rgb = Image.new("RGB", src.size, (0, 0, 0))
    rgb.paste(src.convert("RGB"), (0, 0), src.getchannel("A") if "A" in src.getbands() else None)

    bg = background_mask(rgb, threshold)
    alpha = Image.frombytes(
        "L", src.size, bytes(0 if flag else 255 for flag in bg)
    )
    if feather:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def frame(img, canvas, inset):
    """Trim to the phones, then centre them in the Scope-sized canvas."""
    box = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        img = img.crop(box)

    limit = (canvas[0] - inset * 2, canvas[1] - inset * 2)
    scale = min(limit[0] / img.width, limit[1] / img.height)
    size = (max(1, round(img.width * scale)), max(1, round(img.height * scale)))
    img = img.resize(size, Image.LANCZOS)
    # LANCZOS introduces mid-alpha; snap to a Scope-style hard cut.
    alpha = img.getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    img.putalpha(alpha)

    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    out.paste(img, ((canvas[0] - size[0]) // 2, (canvas[1] - size[1]) // 2), img)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("dest")
    ap.add_argument("--threshold", type=int, default=THRESHOLD)
    ap.add_argument("--canvas", default=f"{CANVAS[0]}x{CANVAS[1]}")
    ap.add_argument("--inset", type=int, default=INSET)
    ap.add_argument("--feather", type=float, default=FEATHER)
    args = ap.parse_args()

    canvas = tuple(int(n) for n in args.canvas.lower().split("x"))
    src = Image.open(args.source)
    out = frame(matte(src, args.threshold, args.feather), canvas, args.inset)
    out.save(args.dest)
    print(f"{args.source} -> {args.dest} {out.size}")


if __name__ == "__main__":
    main()
