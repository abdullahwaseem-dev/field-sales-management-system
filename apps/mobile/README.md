# ZONA Sales: field app (Flutter)

Phase 0 contains the design system (`lib/design_system`) and a gallery (`lib/design_system/gallery`).
Product screens arrive in Phase 3.

- Tokens: `lib/design_system/generated/zona_tokens.g.dart` is generated from `packages/tokens`.
- Strings: `lib/l10n/app_{en,ar}.arb` are generated from `packages/i18n`. Run `npm run build:design` at the repo root.
- Screenshots: `flutter test --update-goldens test/design_system_golden_test.dart`.
- Bundle id `sa.zona.sfmsMobile` is a placeholder. Confirm it before store submission.
