# @sfms/brand: ZONA logo assets

## Status: INTERIM (vector masters outstanding)

`logo.png` in the repo root is the brand-guidelines sheet ("01 LOGO SYSTEM"), not a logo master.
Its largest wordmark is about 470 px wide and its icon about 110 px. That is fine for on-screen UI
lockups, but far too small for app-store icons.

`scripts/extract_interim.py` isolates each variant from the sheet **at native resolution** and makes
the page transparent. It never redraws, recolors, crops into the artwork, stretches or upscales.
Every asset in `interim/manifest.json` has a `max_css_width` (native width ÷ 2), which is the largest
size it can be shown at on a 2× screen without blurring. UI code must respect it.

| Asset | Use | Max CSS width |
|---|---|---|
| `zona-wordmark(-reverse).png` | Portal header, login | 239 px |
| `zona-wordmark-ar(-reverse).png` | Arabic login, Arabic header | 143 px |
| `zona-lockup(-reverse).png` | Portal sidebar (expanded), report header | 205 px |
| `zona-mark(-reverse).png` | Collapsed sidebar, compact headers | 59 px |
| `zona-icon-square.png`, `zona-icon-circle.png` | Avatars/badges on light surfaces | 59 px |
| `favicon.ico`, `favicon-{16,32,48,64}.png` | Browser tab (downscaled) | n/a |

The `-reverse` files reproduce the sheet's own **REVERSE VERSION** (white letters, orange dot) and are
used on dark surfaces. The navy container icons have low contrast on dark surfaces, so dark mode
uses `zona-mark-reverse` instead.

### Blocked until masters arrive
- iOS app icon (1024 px and all sizes), Android adaptive icon (432 px foreground) and Play Store icon (512 px)
- Native splash screens
- `apple-touch-icon` (180 px) and the PWA icons (192 and 512 px)
- Print-resolution logo for PDF exports (≥ 300 dpi)

### When the masters arrive
Put the SVGs (or AI/EPS/PDF) in `masters/` using the file names above, and replace the interim
pipeline with SVG rasterization. Every size will then be generated from vectors, and these PNGs are deleted.

## Usage rules (from the guidelines sheet)
- **Clear space:** at least *x* on every side, where *x* ≈ half the wordmark height. This is read
  from the sheet's clear-space diagram; please confirm it against the official guideline.
- **Minimum size (sheet):** 20 mm wordmark and 12 mm icon in print. On screen the minimums are
  72 px wordmark width and 16 px icon.
- **Never** recolor, stretch, rotate, add effects, or set "ZONA"/"زونة" in a font.
- **Never mirror the logo in RTL layouts.**
- **Brand inks** (measured from the artwork): navy `#07193C`, orange `#FD5813`.
