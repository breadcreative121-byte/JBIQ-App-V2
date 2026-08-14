#!/usr/bin/env python3
"""Generate placeholder app icon + splash from JDS tokens.
primary50 = #6d17ce. The mark is the JDS four-petal sparkle (white).
Swap in a Jio-approved asset later. Run: python3 scripts/gen-assets.py
"""
import os
from PIL import Image, ImageDraw

PURPLE = (0x6D, 0x17, 0xCE, 255)
WHITE = (255, 255, 255, 255)
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(HERE, "assets")


def sparkle(size, bg, fg, scale=0.62):
    img = Image.new("RGBA", (size, size), bg)
    d = ImageDraw.Draw(img)
    c = size / 2
    off = size * 0.105 * scale / 0.62
    r = size * 0.135 * scale / 0.62
    for dx in (-off, off):
        for dy in (-off, off):
            cx, cy = c + dx, c + dy
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fg)
    return img


def main():
    # Full-bleed icon: white sparkle on purple.
    sparkle(1024, PURPLE, WHITE).save(os.path.join(ASSETS, "icon.png"))
    # Splash mark: white sparkle on transparent (plugin centers it on purple).
    sparkle(1024, (0, 0, 0, 0), WHITE).save(os.path.join(ASSETS, "splash-icon.png"))
    print("Wrote assets/icon.png and assets/splash-icon.png")


if __name__ == "__main__":
    main()
