# Phase 0: design system review

Everything below is built from one source: `packages/tokens` (colour, type, space, radius, elevation,
motion) and `packages/i18n` (every UI string, English and Arabic). The portal and the Flutter app
consume the same generated output. **Product screens have not been built.** They wait for your approval of this page.

## How to review

| What | How |
|---|---|
| **Design-system page (interactive)** | `npm run dev:portal`, then open http://localhost:5173. Use the header controls to switch theme (System/Light/Dark), language (English/العربية), digits (0-9/٠-٩) and Hijri dates. Changes apply instantly and are remembered. Reload to confirm there is no flash of the wrong theme or direction. |
| **Screenshots, portal** | [`screenshots/portal/`](screenshots/portal/). Each specimen image shows **EN-light, EN-dark, AR-light and AR-dark** side by side. `page-*.png` shows the page itself in each combination, plus a phone-width Arabic view. |
| **Screenshots, mobile (Flutter)** | [`screenshots/mobile/`](screenshots/mobile/): `home`, `hero-states` and `components`, each in all four combinations. |
| **Mobile gallery on a device** | `cd apps/mobile && flutter run`. Theme, language and digits switch at runtime with no restart. |
| **Regenerate everything** | `npm run screenshots` (portal + WCAG scan) · `npm run screenshots:mobile` (Flutter goldens) |

## What is on the page

**Brand:** the logo lockup, wordmark and mark, on light and dark, in both languages.
**Colour:** brand scales, semantic roles with live contrast ratios, attendance status tokens, and the chart palette.
**Typography:** the type scale in both scripts, numbers and dates (Gregorian, Hijri Umm al-Qura, time,
duration), Arabic plural forms and mixed-direction text.
**Foundations:** spacing, radius, elevation and motion.
**Components:**
- buttons and form controls
- status chips, including the 8-hour "short by" badge
- cards and KPI tiles
- the data table (sort, search, column picker, bulk select, sticky header, row actions)
- the collapsible sidebar with global search
- live-map markers with clustering
- the suspected-fake review dialog
- toasts
- loading, empty, error and offline states

**Mobile:**
- the check-in hero in all three states, with progress toward the 8-hour day
- the "Location sharing is ON" indicator
- the bottom tab bar
- monthly summary tiles
- the early check-out dialog, plus the same core components as the portal

## Verified automatically

| Check | Result |
|---|---|
| WCAG AA contrast, 164 text/icon/border pairs, both themes | All pass. The build fails on any miss. Tightest pairs: 3.06:1 light, 3.55:1 dark (minimum 3:1 for icons and borders). |
| axe-core WCAG 2.0/2.1/2.2 A+AA scan of the whole page (EN-light, AR-dark) | 0 violations |
| ICU syntax, matching placeholders across languages, Arabic plural forms (zero/one/two/few/many/other) | 199 messages pass |
| Chart palette colour-blind separation, light and dark | Passes. On light surfaces, slots 3–5 need direct labels or a table view. |
| Horizontal page scroll at 390 px (phone) | None |
| Flutter `analyze` + 12 golden tests (deterministic re-run) | Clean / all pass |

## Design decisions to confirm

1. **Check-in is orange, check-out is navy.** The hero action uses the brand accent before check-in
   and the brand navy while on duty. The progress ring turns green when the 8 hours are reached.
2. **The 8-hour progress ring runs clockwise in both languages.** It depicts elapsed time like a clock face,
   so it is not mirrored. Linear progress, arrows, chevrons, the tab order, the sidebar and swipe
   directions all mirror. The logo, maps, phone numbers and times never mirror.
3. **Times use the 12-hour clock in both languages:** "9:04 am" and "9:04 ص".
4. **Arabic-Indic digits are opt-in and apply to the Arabic UI only.** English always shows 0-9.
5. **Status colours avoid the brand orange.** Danger and Absent are pushed toward crimson and Late toward
   amber, so a status never looks like branding. Every status also has its own icon and label, and
   "Suspected fake" gets a dashed border meaning "pending review".
6. **Fonts:** Inter for Latin text and IBM Plex Sans Arabic for Arabic, self-hosted, with taller Arabic
   line heights and zero letter-spacing on Arabic text.

## Open items

- **Logo masters (blocking for app icons and splash screens).** The page uses *interim* logo files
  extracted from the guidelines sheet at native resolution. They are never upscaled, which is fine for
  on-screen lockups. App-store icons, splash screens and print-quality report logos need the vector
  masters (see `packages/brand/README.md`).
- **Arabic copy review.** 14 strings are flagged for a native speaker in
  [`packages/i18n/REVIEW.md`](../../packages/i18n/REVIEW.md), mainly the status terms for
  suspected/confirmed fake and the abbreviations for hours and minutes.
- **Brand colours.** These use the values measured from the artwork (`#07193C` / `#FD5813`), as
  recommended. If official agency values exist, replace them in `packages/tokens/src/primitives.json`;
  every scale and contrast check regenerates.
- **Not yet built (later phases):** preferences are saved in the browser only (the per-user server copy
  arrives in Phase 2), the real Google Maps styles need an API key (Phase 4), Hijri dates on mobile come
  in Phase 3, and chart components come in Phase 4/6.
