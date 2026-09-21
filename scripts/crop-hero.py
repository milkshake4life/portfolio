#!/usr/bin/env python3
"""Trim a transparent hero PNG by fractional insets, keeping its alpha.

Used to cut editor chrome (Figma selection frames, labels) off an export
without touching the screenshot content inside.

Usage:
  python3 scripts/crop-hero.py SOURCE DEST --inset LEFT TOP RIGHT BOTTOM

Insets are fractions of the alpha-trimmed content box, e.g.
  --inset 0.033 0.058 0.026 0.038
"""

import argparse
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("dest")
    parser.add_argument(
        "--inset",
        nargs=4,
        type=float,
        metavar=("LEFT", "TOP", "RIGHT", "BOTTOM"),
        required=True,
    )
    args = parser.parse_args()

    hero = Image.open(args.source).convert("RGBA")
    box = hero.getchannel("A").getbbox()
    if box:
        hero = hero.crop(box)

    left, top, right, bottom = args.inset
    hero = hero.crop(
        (
            round(left * hero.width),
            round(top * hero.height),
            round((1 - right) * hero.width),
            round((1 - bottom) * hero.height),
        )
    )

    dest = Path(args.dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    hero.save(dest)
    print(f"{dest}  {hero.width}x{hero.height}")


if __name__ == "__main__":
    main()
