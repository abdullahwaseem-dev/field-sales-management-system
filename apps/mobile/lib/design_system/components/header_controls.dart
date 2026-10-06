import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../l10n/app_localizations.dart';
import '../generated/zona_tokens.g.dart';
import '../zona_format.dart';
import '../zona_theme.dart';

ButtonStyle _compact(ZonaColors c) => IconButton.styleFrom(
      fixedSize: const Size.square(40),
      minimumSize: const Size.square(40),
      side: BorderSide(color: c.line),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZonaRadius.md)),
      foregroundColor: c.fg,
      // 40dp visual, 48dp touch target.
      tapTargetSize: MaterialTapTargetSize.padded,
    );

/// Compact language switch for the header: shows the OTHER language in its own script ("ع" / "EN").
class LanguageToggleButton extends StatelessWidget {
  const LanguageToggleButton({super.key, required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    final toArabic = Localizations.localeOf(context).languageCode != 'ar';
    return Tooltip(
      message: l10n.settingsSwitchLanguage,
      child: IconButton(
        onPressed: onPressed,
        style: _compact(c),
        icon: Text(
          l10n.settingsLanguageToggle,
          locale: Locale(toArabic ? 'ar' : 'en'),
          style: (toArabic ? t.subtitle : t.labelSm).copyWith(color: c.fg, height: 1),
        ),
      ),
    );
  }
}

/// Compact theme switch for the header: the icon shows the current mode; the menu offers
/// System / Light / Dark and the digit style.
class ThemeMenuButton extends StatelessWidget {
  const ThemeMenuButton({super.key, required this.mode, required this.digits, required this.onMode, required this.onDigits});
  final ThemeMode mode;
  final ZonaDigits digits;
  final ValueChanged<ThemeMode> onMode;
  final ValueChanged<ZonaDigits> onDigits;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    final icon = switch (mode) {
      ThemeMode.light => LucideIcons.sun,
      ThemeMode.dark => LucideIcons.moon,
      ThemeMode.system => LucideIcons.sunMoon,
    };
    PopupMenuEntry<Object> header(String s) => PopupMenuItem<Object>(
          enabled: false,
          height: 32,
          child: Text(s, style: t.labelSm.copyWith(color: c.fgMuted)),
        );
    PopupMenuEntry<Object> item(Object value, String label, bool checked, {IconData? leading, TextDirection? dir}) =>
        PopupMenuItem<Object>(
          value: value,
          height: 44,
          child: Row(children: [
            if (leading != null) ...[Icon(leading, size: ZonaSize.iconMd, color: c.fgMuted), const SizedBox(width: ZonaSpace.s3)],
            // A label in another script (e.g. "٠-٩") keeps its own direction but sits at the layout start.
            Expanded(child: Align(alignment: AlignmentDirectional.centerStart, child: Text(label, style: t.body, textDirection: dir))),
            if (checked) Icon(LucideIcons.check, size: ZonaSize.iconSm, color: c.brandFg),
          ]),
        );
    return PopupMenuButton<Object>(
      tooltip: l10n.settingsTheme,
      onSelected: (v) => v is ThemeMode ? onMode(v) : onDigits(v as ZonaDigits),
      position: PopupMenuPosition.under,
      style: _compact(c),
      icon: Icon(icon, size: ZonaSize.iconMd),
      itemBuilder: (_) => [
        header(l10n.settingsTheme),
        item(ThemeMode.system, l10n.settingsThemeSystem, mode == ThemeMode.system, leading: LucideIcons.sunMoon),
        item(ThemeMode.light, l10n.settingsThemeLight, mode == ThemeMode.light, leading: LucideIcons.sun),
        item(ThemeMode.dark, l10n.settingsThemeDark, mode == ThemeMode.dark, leading: LucideIcons.moon),
        const PopupMenuDivider(),
        header(l10n.settingsDigits),
        item(ZonaDigits.western, l10n.settingsDigitsWestern, digits == ZonaDigits.western),
        item(ZonaDigits.arabicIndic, l10n.settingsDigitsArabic, digits == ZonaDigits.arabicIndic, dir: TextDirection.rtl),
      ],
    );
  }
}
