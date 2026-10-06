import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../l10n/app_localizations.dart';
import '../generated/zona_tokens.g.dart';
import '../zona_theme.dart';
import 'zona_button.dart';

class ZonaCard extends StatelessWidget {
  const ZonaCard({super.key, required this.child, this.padding = const EdgeInsets.all(ZonaSpace.s4)});
  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(ZonaRadius.lg),
        border: Border.all(color: c.line),
        boxShadow: ZonaElevation.of(context).sm,
      ),
      child: child,
    );
  }
}

/// Monthly-summary stat (FR-LVE-02): label, value in proportional figures, status glyph.
class SummaryStat extends StatelessWidget {
  const SummaryStat({super.key, required this.label, required this.value, required this.icon, required this.fg, required this.bg});
  final String label;
  final String value;
  final IconData icon;
  final Color fg;
  final Color bg;

  @override
  Widget build(BuildContext context) {
    final t = ZonaText.of(context);
    return ZonaCard(
      padding: const EdgeInsets.all(ZonaSpace.s3),
      child: Row(children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(ZonaRadius.md)),
          child: Icon(icon, size: ZonaSize.iconMd, color: fg),
        ),
        const SizedBox(width: ZonaSpace.s3),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: t.title),
            Text(label, style: t.caption, maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
      ]),
    );
  }
}

enum ZonaToastVariant { success, info, warning, danger }

/// Toast content (shown via [showZonaToast]); accent edge on the inline-start side.
class ZonaToast extends StatelessWidget {
  const ZonaToast({super.key, required this.variant, required this.title, this.body, this.onDismiss});
  final ZonaToastVariant variant;
  final String title;
  final String? body;
  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    final (IconData icon, Color fg, Color edge) = switch (variant) {
      ZonaToastVariant.success => (LucideIcons.circleCheck, c.statusPresentFg, c.statusPresentSolid),
      ZonaToastVariant.info => (LucideIcons.info, c.statusInfoFg, c.statusInfoSolid),
      ZonaToastVariant.warning => (LucideIcons.triangleAlert, c.statusLateFg, c.statusLateSolid),
      ZonaToastVariant.danger => (LucideIcons.circleAlert, c.statusAbsentFg, c.statusAbsentSolid),
    };
    return Semantics(
      liveRegion: true,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: c.overlay,
          borderRadius: BorderRadius.circular(ZonaRadius.lg),
          border: Border.all(color: c.line),
          boxShadow: ZonaElevation.of(context).lg,
        ),
        child: IntrinsicHeight(
          child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Container(width: 4, color: edge),
            const SizedBox(width: ZonaSpace.s3),
            Padding(padding: const EdgeInsets.only(top: ZonaSpace.s3 + 2), child: Icon(icon, size: ZonaSize.iconMd, color: fg)),
            const SizedBox(width: ZonaSpace.s3),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: ZonaSpace.s3),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text(title, style: t.label),
                  if (body != null) Text(body!, style: t.body.copyWith(color: c.fgMuted)),
                ]),
              ),
            ),
            IconButton(
              tooltip: AppLocalizations.of(context).actionDismiss,
              onPressed: onDismiss,
              icon: Icon(LucideIcons.x, size: ZonaSize.iconSm, color: c.fgMuted),
            ),
          ]),
        ),
      ),
    );
  }
}

void showZonaToast(BuildContext context, {required ZonaToastVariant variant, required String title, String? body}) {
  final messenger = ScaffoldMessenger.of(context);
  messenger.showSnackBar(SnackBar(
    padding: EdgeInsets.zero,
    content: ZonaToast(variant: variant, title: title, body: body, onDismiss: messenger.hideCurrentSnackBar),
  ));
}

/// Early check-out confirmation (8-hour rule): the safe choice is the primary action.
class EarlyCheckoutDialog extends StatelessWidget {
  const EarlyCheckoutDialog({super.key, required this.worked, required this.required, required this.remaining});
  final String worked;
  final String required;
  final String remaining;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final c = ZonaColors.of(context);
    return AlertDialog(
      icon: Icon(LucideIcons.hourglass, color: c.statusLateFg),
      title: Text(l10n.heroEarlyTitle),
      content: Text(l10n.heroEarlyBody(worked, required, remaining)),
      // Full-width stacked actions, safe choice first (thumb-reachable, no ragged widths in either language).
      actions: [
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          ZonaButton(label: l10n.heroKeepWorking, onPressed: () => Navigator.maybePop(context, false)),
          const SizedBox(height: ZonaSpace.s2),
          ZonaButton(label: l10n.heroEarlyConfirm, variant: ZonaButtonVariant.secondary, onPressed: () => Navigator.maybePop(context, true)),
        ]),
      ],
    );
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, required this.since});
  final String since;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    final l10n = AppLocalizations.of(context);
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(ZonaSpace.s3),
        decoration: BoxDecoration(
          color: c.statusLateBg,
          borderRadius: BorderRadius.circular(ZonaRadius.md),
          border: Border.all(color: c.statusLateBorder),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(LucideIcons.wifiOff, size: ZonaSize.iconMd, color: c.statusLateFg),
          const SizedBox(width: ZonaSpace.s3),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l10n.stateOfflineTitle, style: t.label.copyWith(color: c.statusLateFg)),
              Text(l10n.stateOfflineBody(since), style: t.body.copyWith(color: c.statusLateFg)),
            ]),
          ),
        ]),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    return Padding(
      padding: const EdgeInsets.all(ZonaSpace.s6),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(color: c.brandSubtle, shape: BoxShape.circle),
          child: Icon(icon, color: c.brandFg),
        ),
        const SizedBox(height: ZonaSpace.s3),
        Text(title, style: t.subtitle, textAlign: TextAlign.center),
        const SizedBox(height: ZonaSpace.s1),
        Text(body, style: t.body.copyWith(color: c.fgMuted), textAlign: TextAlign.center),
      ]),
    );
  }
}

/// Skeleton placeholder rows (static under reduce-motion; announced once as "Loading…").
class SkeletonList extends StatelessWidget {
  const SkeletonList({super.key, this.rows = 3});
  final int rows;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    Widget bar(double w, double h, {double r = ZonaRadius.sm}) =>
        Container(width: w, height: h, decoration: BoxDecoration(color: c.skeleton, borderRadius: BorderRadius.circular(r)));
    return Semantics(
      label: AppLocalizations.of(context).stateLoading,
      excludeSemantics: true,
      child: Column(children: [
        for (var i = 0; i < rows; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: ZonaSpace.s2),
            child: Row(children: [
              bar(40, 40, r: ZonaRadius.full),
              const SizedBox(width: ZonaSpace.s3),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [bar(160, 12), const SizedBox(height: 8), bar(96, 12)])),
              bar(64, 24, r: ZonaRadius.full),
            ]),
          ),
      ]),
    );
  }
}
