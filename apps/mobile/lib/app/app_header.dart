import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../design_system/components/header_controls.dart';
import '../design_system/design_system.dart';
import '../l10n/app_localizations.dart';
import 'preferences.dart';

/// App header: ZONA logo at the start; compact language, theme and notification controls at the end.
class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({super.key, this.showNotifications = true, this.unread = 0, this.onNotifications});

  final bool showNotifications;
  final int unread;
  final VoidCallback? onNotifications;

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final c = ZonaColors.of(context);
    final prefs = AppPreferencesScope.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    return AppBar(
      toolbarHeight: 64,
      automaticallyImplyLeading: false,
      titleSpacing: ZonaSpace.s4,
      title: ZonaLogo(ZonaLogoKind.lockup, height: 30, semanticLabel: l10n.appBrandLabel),
      shape: Border(bottom: BorderSide(color: c.line)),
      actions: [
        LanguageToggleButton(onPressed: () => prefs.setLocale(Locale(arabic ? 'en' : 'ar'))),
        ThemeMenuButton(mode: prefs.themeMode, digits: prefs.digits, onMode: prefs.setThemeMode, onDigits: prefs.setDigits),
        if (showNotifications)
          IconButton(
            tooltip: l10n.navNotifications,
            onPressed: onNotifications,
            icon: Badge(
              isLabelVisible: unread > 0,
              alignment: AlignmentDirectional.topEnd,
              offset: const Offset(2, -4),
              label: Text(ZonaFormat.of(context).number(unread)),
              backgroundColor: c.accentStrong,
              textColor: c.onAccent,
              child: Icon(LucideIcons.bell, size: ZonaSize.iconMd, color: c.fgMuted),
            ),
          ),
        const SizedBox(width: ZonaSpace.s3),
      ],
    );
  }
}
