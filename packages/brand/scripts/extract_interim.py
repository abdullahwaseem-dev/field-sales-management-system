#!/usr/bin/env python3
"""
INTERIM brand assets, extracted from the guidelines sheet (logo.png) at native resolution.

Why this exists: the vector masters have not been supplied yet (see ../README.md). Until they are,
we isolate each logo variant from the sheet WITHOUT redrawing, recoloring, stretching, cropping into
the artwork, or upscaling:

  * Flat marks on the white page (wordmarks, lockup, bare Z) are separated from the page by
    "colour-to-alpha" against the two brand inks only (navy + orange): every pixel keeps one of the
    logo's own inks and gets the coverage it had on the page, so edges stay anti-aliased.
  * The reverse (dark-background) versions reproduce the sheet's own "REVERSE VERSION": navy ink
    becomes white, the orange dot stays orange. Geometry is untouched.
  * Container icons (rounded square / circle) keep every interior pixel as-is; only the page outside
    the container is made transparent.
  * Every asset records max_css_width = native_width / 2, i.e. the largest size it can be shown on a
    2x screen without upscaling. Favicons are produced by DOWNscaling only.

Run:  python3 packages/brand/scripts/extract_interim.py
"""
from __future__ import annotations

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SHEET = ROOT / "logo.png"
OUT = ROOT / "packages" / "brand" / "interim"

# Inks measured from the artwork (median of solid fills across all variants on the sheet).
NAVY = np.array([0x07, 0x19, 0x3C]) / 255.0
ORANGE = np.array([0xFD, 0x58, 0x13]) / 255.0
WHITE = np.array([1.0, 1.0, 1.0])

# Regions on the 1448x1086 sheet that contain exactly one variant (plus page margin, no labels).
FLAT = {
    "zona-wordmark": ((40, 195, 530, 325), "Primary wordmark (Latin)"),
    "zona-wordmark-ar": ((600, 180, 910, 350), "Arabic wordmark"),
    "zona-lockup": ((985, 215, 1410, 315), "Bilingual lockup"),
    "zona-mark": ((55, 485, 180, 610), "Brand mark (bare Z)"),
}
CONTAINED = {
    "zona-icon-square": ((250, 490, 370, 618), "Brand icon, rounded square"),
    "zona-icon-circle": ((395, 490, 512, 618), "Brand icon, circle"),
}


def load() -> np.ndarray:
    return np.asarray(Image.open(SHEET).convert("RGB")).astype(np.float64) / 255.0


def page_colour(a: np.ndarray) -> np.ndarray:
    return np.median(a[60:90, 700:800].reshape(-1, 3), axis=0)


def ink_alpha(px: np.ndarray, bg: np.ndarray, ink: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Least-squares coverage of `ink` over `bg` for every pixel, and the reconstruction error."""
    d = bg - ink
    alpha = np.clip(((bg - px) * d).sum(axis=-1) / float((d * d).sum()), 0.0, 1.0)
    recon = alpha[..., None] * ink + (1 - alpha[..., None]) * bg
    return alpha, np.linalg.norm(px - recon, axis=-1)


def tidy(alpha: np.ndarray) -> np.ndarray:
    alpha = alpha.copy()
    alpha[alpha < 0.03] = 0.0
    alpha[alpha > 0.97] = 1.0
    return alpha


def trim(rgba: np.ndarray, pad: int = 2) -> np.ndarray:
    ys, xs = np.where(rgba[..., 3] > 0)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, rgba.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, rgba.shape[1])
    return rgba[y0:y1, x0:x1]


def save(name: str, rgba: np.ndarray, purpose: str, manifest: list) -> None:
    img = Image.fromarray(np.round(rgba * 255).astype(np.uint8))
    img.save(OUT / f"{name}.png", optimize=True)
    manifest.append({
        "file": f"{name}.png",
        "purpose": purpose,
        "width": img.width,
        "height": img.height,
        "max_css_width": img.width // 2,
        "interim": True,
    })


def extract_flat(a: np.ndarray, bg: np.ndarray, box) -> tuple[np.ndarray, np.ndarray]:
    x0, y0, x1, y1 = box
    px = a[y0:y1, x0:x1]
    an, en = ink_alpha(px, bg, NAVY)
    ao, eo = ink_alpha(px, bg, ORANGE)
    use_orange = eo < en
    alpha = tidy(np.where(use_orange, ao, an))
    colour = np.where(use_orange[..., None], ORANGE, NAVY)
    normal = np.dstack([colour, alpha])
    reverse = np.dstack([np.where(use_orange[..., None], ORANGE, WHITE), alpha])
    return normal, reverse


def extract_contained(a: np.ndarray, bg: np.ndarray, box) -> np.ndarray:
    x0, y0, x1, y1 = box
    px = a[y0:y1, x0:x1]
    alpha, _ = ink_alpha(px, bg, NAVY)
    h, w = alpha.shape
    outside = np.zeros((h, w), bool)
    q = deque((y, x) for y in range(h) for x in (0, w - 1)) + deque((y, x) for x in range(w) for y in (0, h - 1))
    while q:  # flood the page from the crop border through anything that is not solid container
        y, x = q.popleft()
        if outside[y, x] or alpha[y, x] >= 0.98:
            continue
        outside[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not outside[ny, nx]:
                q.append((ny, nx))
    edge_alpha = tidy(alpha)
    rgb = np.where(outside[..., None], NAVY, px)
    out_alpha = np.where(outside, edge_alpha, 1.0)
    return np.dstack([rgb, out_alpha])


def favicons(square: np.ndarray, manifest: list) -> None:
    img = Image.fromarray(np.round(square * 255).astype(np.uint8))
    side = max(img.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    for size in (16, 32, 48, 64):
        assert size <= side, "favicons must never be upscaled"
        canvas.resize((size, size), Image.LANCZOS).save(OUT / f"favicon-{size}.png", optimize=True)
    canvas.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    manifest.append({"file": "favicon.ico", "purpose": "Browser tab icon (16/32/48, downscaled)", "interim": True})


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    a = load()
    bg = page_colour(a)
    manifest: list = []
    for name, (box, purpose) in FLAT.items():
        normal, reverse = extract_flat(a, bg, box)
        save(name, trim(normal), purpose + " — on light backgrounds", manifest)
        save(f"{name}-reverse", trim(reverse), purpose + " — reverse, on dark backgrounds", manifest)
    square = None
    for name, (box, purpose) in CONTAINED.items():
        icon = trim(extract_contained(a, bg, box), pad=1)
        save(name, icon, purpose + " — works on light and dark", manifest)
        if name == "zona-icon-square":
            square = icon
    favicons(square, manifest)
    (OUT / "manifest.json").write_text(json.dumps({
        "source": "logo.png (brand guidelines sheet, 1448x1086)",
        "status": "INTERIM — replace with vector masters; see packages/brand/README.md",
        "inks": {"navy": "#07193C", "orange": "#FD5813", "reverse": "#FFFFFF"},
        "assets": manifest,
    }, indent=2) + "\n")
    for m in manifest:
        print(f"{m['file']:34s} {m.get('width', ''):>4} x {m.get('height', ''):<4} max css width {m.get('max_css_width', '-')}")


if __name__ == "__main__":
    main()
