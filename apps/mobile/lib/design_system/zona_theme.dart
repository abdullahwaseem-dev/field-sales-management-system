import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'generated/zona_tokens.g.dart';

/// Text styles built from the type tokens. Arabic gets taller line heights and never letter-spacing.
@immutable
class ZonaText extends ThemeExtension<ZonaText> {
  const ZonaText({
    required this.display,
    required this.headline,
    required this.titleLg,
    required this.title,
    required this.subtitle,
    required this.bodyLg,
    required this.body,
    required this.label,
    required this.labelSm,
    required this.caption,
    required this.kpi,
    required this.timer,
  });

  factory ZonaText.build(ZonaColors c, {required bool arabic}) {
    TextStyle s(ZonaTypeToken t, {Color? color, bool tabular = false}) => TextStyle(
          fontFamily: ZonaFonts.latin,
          fontFamilyFallback: const [ZonaFonts.arabic],
          fontSize: t.size,
          height: (arabic ? t.lineHeightArabic : t.lineHeight) / t.size,
          leadingDistribution: TextLeadingDistribution.even,
          fontWeight: t.weight,
          letterSpacing: arabic ? 0 : t.trackingEm * t.size,
          color: color ?? c.fg,
          fontFeatures: tabular ? const [FontFeature.tabularFigures()] : null,
        );
    return ZonaText(
      display: s(ZonaType.display),
      headline: s(ZonaType.headline),
      titleLg: s(ZonaType.titleLg),
      title: s(ZonaType.title),
      subtitle: s(ZonaType.subtitle),
      bodyLg: s(ZonaType.bodyLg),
      body: s(ZonaType.body),
      label: s(ZonaType.label),
      labelSm: s(ZonaType.labelSm),
      caption: s(ZonaType.caption, color: c.fgMuted),
      kpi: s(ZonaType.kpi),
      timer: s(ZonaType.timer, tabular: true),
    );
  }

  final TextStyle display, headline, titleLg, title, subtitle, bodyLg, body, label, labelSm, caption, kpi, timer;

  static ZonaText of(BuildContext context) => Theme.of(context).extension<ZonaText>()!;

  @override
  ZonaText copyWith() => this;

  @override
  ZonaText lerp(ThemeExtension<ZonaText>? other, double t) => t < 0.5 || other is! ZonaText ? this : other;
}

/// Builds the app theme for a brightness + locale entirely from design tokens.
abstract final class ZonaTheme {
  static ThemeData build(Brightness brightness, Locale locale) {
    final dark = brightness == Brightness.dark;
    final c = dark ? ZonaColors.dark : ZonaColors.light;
    final text = ZonaText.build(c, arabic: locale.languageCode == 'ar');
    final radius = BorderRadius.circular(ZonaRadius.md);

    final scheme = ColorScheme(
      brightness: brightness,
      primary: c.brand,
      onPrimary: c.onBrand,
      primaryContainer: c.brandSubtle,
      onPrimaryContainer: c.brandFg,
      secondary: c.accentStrong,
      onSecondary: c.onAccent,
      secondaryContainer: c.accentSubtle,
      onSecondaryContainer: c.accentFg,
      tertiary: c.statusInfoSolid,
      onTertiary: c.onSolid,
      error: c.statusAbsentSolid,
      onError: c.onSolid,
      surface: c.surface,
      onSurface: c.fg,
      onSurfaceVariant: c.fgMuted,
      surfaceContainerLowest: c.canvas,
      surfaceContainerLow: c.surface,
      surfaceContainer: c.raised,
      surfaceContainerHigh: c.raised,
      surfaceContainerHighest: c.overlay,
      outline: c.lineStrong,
      outlineVariant: c.line,
      shadow: ZonaColors.dark.onBrand, // navy-950: shadows are navy-tinted, never pure black
      scrim: c.scrim,
      inverseSurface: c.fg,
      onInverseSurface: c.canvas,
      inversePrimary: dark ? ZonaColors.light.brand : ZonaColors.dark.brand,
    );

    ButtonStyle base(Color bg, Color fg, {BorderSide? side}) => ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.disabled) ? c.sunken : bg),
          foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.disabled) ? c.fgDisabled : fg),
          overlayColor: WidgetStatePropertyAll(fg.withValues(alpha: 0.08)),
          minimumSize: const WidgetStatePropertyAll(Size(ZonaSize.touchMin, ZonaSize.controlMobile)),
          padding: const WidgetStatePropertyAll(EdgeInsetsDirectional.symmetric(horizontal: ZonaSpace.s5)),
          shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: radius)),
          side: side == null ? null : WidgetStatePropertyAll(side),
          textStyle: WidgetStatePropertyAll(text.label),
          elevation: const WidgetStatePropertyAll(0),
          tapTargetSize: MaterialTapTargetSize.padded,
        );

    OutlineInputBorder border(Color color, [double width = 1]) =>
        OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: color, width: width));

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.canvas,
      fontFamily: ZonaFonts.latin,
      fontFamilyFallback: const [ZonaFonts.arabic],
      textTheme: TextTheme(
        displaySmall: text.display,
        headlineMedium: text.headline,
        headlineSmall: text.titleLg,
        titleLarge: text.title,
        titleMedium: text.subtitle,
        titleSmall: text.label,
        bodyLarge: text.bodyLg,
        bodyMedium: text.body,
        bodySmall: text.caption,
        labelLarge: text.label,
        labelMedium: text.labelSm,
        labelSmall: text.labelSm,
      ),
      extensions: [c, dark ? ZonaElevation.dark : ZonaElevation.light, text],
      splashFactory: InkRipple.splashFactory,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      dividerTheme: DividerThemeData(color: c.line, thickness: 1, space: 1),
      filledButtonTheme: FilledButtonThemeData(style: base(c.brand, c.onBrand)),
      outlinedButtonTheme: OutlinedButtonThemeData(style: base(c.surface, c.fg, side: BorderSide(color: c.lineStrong))),
      textButtonTheme: TextButtonThemeData(style: base(Colors.transparent, c.brandFg)),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        contentPadding: const EdgeInsetsDirectional.symmetric(horizontal: ZonaSpace.s4, vertical: ZonaSpace.s4),
        hintStyle: text.body.copyWith(color: c.fgMuted),
        helperStyle: text.caption,
        errorStyle: text.caption.copyWith(color: c.statusAbsentFg),
        prefixIconColor: c.fgMuted,
        border: border(c.lineStrong),
        enabledBorder: border(c.lineStrong),
        focusedBorder: border(c.focus, 2),
        errorBorder: border(c.statusAbsentBorder),
        focusedErrorBorder: border(c.statusAbsentSolid, 2),
        disabledBorder: border(c.line),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.brand : c.surface),
        checkColor: WidgetStatePropertyAll(c.onBrand),
        side: BorderSide(color: c.lineStrong, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZonaRadius.xs)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 72,
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: c.brandSubtle,
        indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZonaRadius.full)),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (s) => text.labelSm.copyWith(color: s.contains(WidgetState.selected) ? c.brandFg : c.fgMuted),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(size: ZonaSize.iconLg, color: s.contains(WidgetState.selected) ? c.brandFg : c.fgMuted),
        ),
      ),
      cardTheme: CardThemeData(
        color: c.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZonaRadius.lg), side: BorderSide(color: c.line)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.overlay,
        surfaceTintColor: Colors.transparent,
        barrierColor: c.scrim,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZonaRadius.xl)),
        titleTextStyle: text.title,
        contentTextStyle: text.body.copyWith(color: c.fgMuted),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: c.overlay,
        surfaceTintColor: Colors.transparent,
        elevation: 3,
        shadowColor: ZonaColors.dark.onBrand,
        textStyle: text.body,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZonaRadius.md), side: BorderSide(color: c.line)),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: Colors.transparent,
        elevation: 0,
        behavior: SnackBarBehavior.floating,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: c.surface,
        foregroundColor: c.fg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleTextStyle: text.title,
        systemOverlayStyle: overlayStyle(brightness),
      ),
    );
  }

  /// Status bar + system navigation bar themed to match (light icons on dark, dark icons on light).
  static SystemUiOverlayStyle overlayStyle(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final c = dark ? ZonaColors.dark : ZonaColors.light;
    return SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
      statusBarBrightness: brightness,
      systemNavigationBarColor: c.surface,
      systemNavigationBarIconBrightness: dark ? Brightness.light : Brightness.dark,
      systemNavigationBarDividerColor: c.line,
    );
  }
}
