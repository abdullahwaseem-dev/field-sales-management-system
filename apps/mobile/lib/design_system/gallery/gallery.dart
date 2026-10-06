import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app/app_header.dart';
import '../../l10n/app_localizations.dart';
import '../design_system.dart';

/// Phase 0 design-system gallery (product screens arrive in Phase 3). The compositions below are also
/// rendered by the golden tests to produce the review screenshots.
class DesignSystemGallery extends StatefulWidget {
  const DesignSystemGallery({super.key});

  @override
  State<DesignSystemGallery> createState() => _DesignSystemGalleryState();
}

class _DesignSystemGalleryState extends State<DesignSystemGallery> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppHeader(),
      bottomNavigationBar: ZonaBottomNav(selectedIndex: _tab, onSelected: (i) => setState(() => _tab = i)),
      body: ListView(
        padding: const EdgeInsets.all(ZonaSpace.s4),
        children: const [
          HomeComposition(embedded: true),
          SizedBox(height: ZonaSpace.s6),
          HeroStatesSheet(),
          SizedBox(height: ZonaSpace.s6),
          ComponentsSheet(),
        ],
      ),
    );
  }
}

final _sampleDay = DateTime(2026, 10, 5);
DateTime _at(int h, int m) => DateTime(2026, 10, 5, h, m);

/// The home-screen hero in context: greeting, Check In/Out control, location indicator, month summary.
class HomeComposition extends StatelessWidget {
  const HomeComposition({super.key, this.embedded = false});
  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(l10n.homeGreeting(l10n.dsSampleName), style: t.titleLg),
        Text(f.weekdayDate(_sampleDay), style: t.caption),
        const SizedBox(height: ZonaSpace.s5),
        ZonaCard(
          padding: const EdgeInsets.symmetric(vertical: ZonaSpace.s6, horizontal: ZonaSpace.s4),
          child: CheckInHero(
            state: DayState.onDuty,
            worked: const Duration(hours: 5, minutes: 12),
            required: const Duration(hours: 8),
            checkedInAt: _at(9, 4),
            siteName: l10n.dsSampleSite,
          ),
        ),
        const SizedBox(height: ZonaSpace.s3),
        const LocationSharingIndicator(),
        const SizedBox(height: ZonaSpace.s5),
        Text(l10n.summaryTitle, style: t.subtitle),
        const SizedBox(height: ZonaSpace.s3),
        // Rows sized by their content (not a fixed aspect ratio) so Arabic line heights and large
        // system font sizes never clip the tiles.
        _statRow(
          SummaryStat(label: l10n.summaryPresent, value: f.number(14), icon: LucideIcons.circleCheck, fg: c.statusPresentFg, bg: c.statusPresentBg),
          SummaryStat(label: l10n.summaryLate, value: f.number(2), icon: LucideIcons.clockAlert, fg: c.statusLateFg, bg: c.statusLateBg),
        ),
        const SizedBox(height: ZonaSpace.s3),
        _statRow(
          SummaryStat(label: l10n.summaryAbsent, value: f.number(0), icon: LucideIcons.circleX, fg: c.statusAbsentFg, bg: c.statusAbsentBg),
          SummaryStat(label: l10n.summaryLeave, value: f.number(1), icon: LucideIcons.calendarDays, fg: c.statusOnLeaveFg, bg: c.statusOnLeaveBg),
        ),
      ],
    );
    if (embedded) return content;
    return Scaffold(
      appBar: const AppHeader(),
      bottomNavigationBar: ZonaBottomNav(selectedIndex: 0, onSelected: (_) {}),
      body: SingleChildScrollView(padding: const EdgeInsets.all(ZonaSpace.s4), child: content),
    );
  }

  Widget _statRow(Widget a, Widget b) => IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(child: a),
          const SizedBox(width: ZonaSpace.s3),
          Expanded(child: b),
        ]),
      );
}

/// The other hero states: before check-in, required hours complete, and a short checked-out day.
class HeroStatesSheet extends StatelessWidget {
  const HeroStatesSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final f = ZonaFormat.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      ZonaCard(
        padding: const EdgeInsets.all(ZonaSpace.s5),
        child: CheckInHero(state: DayState.notCheckedIn, worked: Duration.zero, required: const Duration(hours: 8), siteName: l10n.dsSampleSite),
      ),
      const SizedBox(height: ZonaSpace.s4),
      ZonaCard(
        padding: const EdgeInsets.all(ZonaSpace.s5),
        child: CheckInHero(
          state: DayState.onDuty,
          worked: const Duration(hours: 8, minutes: 7),
          required: const Duration(hours: 8),
          checkedInAt: _at(9, 4),
          siteName: l10n.dsSampleSite,
        ),
      ),
      const SizedBox(height: ZonaSpace.s4),
      ZonaCard(
        padding: const EdgeInsets.all(ZonaSpace.s5),
        child: Column(children: [
          CheckInHero(
            state: DayState.checkedOut,
            worked: const Duration(hours: 6, minutes: 38),
            required: const Duration(hours: 8),
            checkedInAt: _at(11, 52),
            siteName: l10n.dsSampleSite,
          ),
          const SizedBox(height: ZonaSpace.s3),
          Wrap(spacing: ZonaSpace.s2, runSpacing: ZonaSpace.s2, alignment: WrapAlignment.center, children: [
            const StatusChip(AttendanceStatus.present),
            ShortHoursBadge(shortfall: f.duration(const Duration(hours: 1, minutes: 22))),
          ]),
        ]),
      ),
    ]);
  }
}

/// Core components: buttons, fields, chips, toast, dialog and the loading/empty/offline states.
class ComponentsSheet extends StatelessWidget {
  const ComponentsSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final f = ZonaFormat.of(context);
    Widget heading(String s) => Padding(
          padding: const EdgeInsets.only(top: ZonaSpace.s6, bottom: ZonaSpace.s3),
          child: Text(s, style: t.title),
        );
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      heading(l10n.dsCButtons),
      ZonaButton(label: l10n.heroCheckIn, variant: ZonaButtonVariant.accent, icon: LucideIcons.fingerprint, onPressed: () {}, expand: true),
      const SizedBox(height: ZonaSpace.s2),
      ZonaButton(label: l10n.actionShowMore, onPressed: () {}, expand: true, trailing: const ZonaDirIcon(LucideIcons.arrowRight, size: ZonaSize.iconMd)),
      const SizedBox(height: ZonaSpace.s2),
      Row(children: [
        Expanded(child: ZonaButton(label: l10n.actionExport, variant: ZonaButtonVariant.secondary, icon: LucideIcons.download, onPressed: () {})),
        const SizedBox(width: ZonaSpace.s2),
        Expanded(child: ZonaButton(label: l10n.actionCancel, variant: ZonaButtonVariant.ghost, onPressed: () {})),
      ]),
      const SizedBox(height: ZonaSpace.s2),
      Row(children: [
        Expanded(child: ZonaButton(label: l10n.actionSave, loading: true, onPressed: () {})),
        const SizedBox(width: ZonaSpace.s2),
        Expanded(child: ZonaButton(label: l10n.actionApprove, onPressed: null)),
      ]),
      heading(l10n.dsCForms),
      ZonaTextField(label: l10n.fieldEmployeeId, initialValue: 'ZN-10427', icon: LucideIcons.idCard, ltrValue: true, required: true),
      const SizedBox(height: ZonaSpace.s4),
      ZonaTextField(label: l10n.fieldPhone, initialValue: '+966 55 123 4567', icon: LucideIcons.phone, ltrValue: true, hint: l10n.fieldPhoneHint, keyboardType: TextInputType.phone),
      const SizedBox(height: ZonaSpace.s4),
      ZonaTextField(label: l10n.fieldEmail, initialValue: 'faisal.alharbi@', icon: LucideIcons.mail, ltrValue: true, error: l10n.fieldErrorRequired),
      heading(l10n.dsCStatus),
      Wrap(spacing: ZonaSpace.s2, runSpacing: ZonaSpace.s2, children: [
        for (final s in AttendanceStatus.values) StatusChip(s),
      ]),
      heading(l10n.dsCToast),
      ZonaToast(variant: ZonaToastVariant.success, title: l10n.toastCheckedIn(f.time(_at(9, 4))), body: l10n.toastCheckedInBody),
      const SizedBox(height: ZonaSpace.s2),
      ZonaToast(variant: ZonaToastVariant.warning, title: l10n.toastGeofenceExit, body: l10n.toastGeofenceExitBody),
      heading(l10n.dsCDialog),
      EarlyCheckoutDialog(
        worked: f.duration(const Duration(hours: 6, minutes: 38)),
        required: f.duration(const Duration(hours: 8)),
        remaining: f.duration(const Duration(hours: 1, minutes: 22)),
      ),
      heading(l10n.dsCStates),
      OfflineBanner(since: f.time(_at(14, 5))),
      const SizedBox(height: ZonaSpace.s3),
      ZonaCard(child: EmptyState(icon: LucideIcons.inbox, title: l10n.stateEmptyReviewTitle, body: l10n.stateEmptyReviewBody)),
      const SizedBox(height: ZonaSpace.s3),
      const ZonaCard(child: SkeletonList()),
    ]);
  }
}
