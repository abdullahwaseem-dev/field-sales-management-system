#!/usr/bin/env python3
"""Combines the Flutter golden renders into one review image per combination (home | hero states |
components) for the design-system page, and copies the individual renders into docs/.
Run after `flutter test --update-goldens` (or use `npm run screenshots:mobile`)."""
import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GOLDENS = ROOT / "apps/mobile/test/goldens"
PAGE = ROOT / "apps/portal/public/ds/mobile"
DOCS = ROOT / "docs/design-system/screenshots/mobile"

css = (ROOT / "packages/tokens/dist/tokens.css").read_text()
canvas = re.findall(r"--zona-color-canvas: (#[0-9A-Fa-f]{6});", css)  # [light, dark]
rgb = lambda h: tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))

PAGE.mkdir(parents=True, exist_ok=True)
DOCS.mkdir(parents=True, exist_ok=True)
for f in GOLDENS.glob("*.png"):
    shutil.copy(f, DOCS / f.name)

for combo in ["en-light", "en-dark", "ar-light", "ar-dark"]:
    shots = [Image.open(GOLDENS / f"{n}-{combo}.png").convert("RGB") for n in ["home", "hero-states", "components"]]
    gap = 48
    out = Image.new("RGB", (sum(s.width for s in shots) + gap * 2, max(s.height for s in shots)), rgb(canvas[0 if "light" in combo else 1]))
    x = 0
    for s in shots:
        out.paste(s, (x, 0))
        x += s.width + gap
    out.save(PAGE / f"{combo}.png", optimize=True)
print(f"✔ mobile screenshots composed ({len(list(GOLDENS.glob('*.png')))} renders → 4 review images)")
