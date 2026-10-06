import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../l10n/app_localizations.dart';
import '../generated/zona_tokens.g.dart';

/// Bottom tab navigation: Home, Catalogue, Leave, Profile. Order follows reading direction (mirrors in
/// RTL); 72dp bar with ≥48dp targets, labels always visible, within one-hand thumb reach.
class ZonaBottomNav extends StatelessWidget {
  const ZonaBottomNav({super.key, required this.selectedIndex, required this.onSelected});
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final c = ZonaColors.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(border: Border(top: BorderSide(color: c.line))),
      child: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: onSelected,
        destinations: [
          NavigationDestination(icon: const Icon(LucideIcons.house), label: l10n.tabHome),
          NavigationDestination(icon: const Icon(LucideIcons.bookOpen), label: l10n.tabCatalogue),
          NavigationDestination(icon: const Icon(LucideIcons.calendarRange), label: l10n.tabLeave),
          NavigationDestination(icon: const Icon(LucideIcons.userRound), label: l10n.tabProfile),
        ],
      ),
    );
  }
}
