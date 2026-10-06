import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../l10n/app_localizations.dart';
import '../generated/zona_tokens.g.dart';
import '../zona_theme.dart';

enum AttendanceStatus { present, late, absent, suspectedFake, confirmedFake, onLeave }

extension AttendanceStatusUi on AttendanceStatus {
  /// Same Lucide glyphs as the portal (packages/tokens core.status).
  IconData get icon => switch (this) {
        AttendanceStatus.present => LucideIcons.circleCheck,
        AttendanceStatus.late => LucideIcons.clockAlert,
        AttendanceStatus.absent => LucideIcons.circleX,
        AttendanceStatus.suspectedFake => LucideIcons.shieldQuestion,
        AttendanceStatus.confirmedFake => LucideIcons.shieldX,
        AttendanceStatus.onLeave => LucideIcons.calendarDays,
      };

  String label(AppLocalizations l10n) => switch (this) {
        AttendanceStatus.present => l10n.statusPresent,
        AttendanceStatus.late => l10n.statusLate,
        AttendanceStatus.absent => l10n.statusAbsent,
        AttendanceStatus.suspectedFake => l10n.statusSuspectedFake,
        AttendanceStatus.confirmedFake => l10n.statusConfirmedFake,
        AttendanceStatus.onLeave => l10n.statusOnLeave,
      };

  ({Color fg, Color bg, Color border, Color solid}) colors(ZonaColors c) => switch (this) {
        AttendanceStatus.present => (fg: c.statusPresentFg, bg: c.statusPresentBg, border: c.statusPresentBorder, solid: c.statusPresentSolid),
        AttendanceStatus.late => (fg: c.statusLateFg, bg: c.statusLateBg, border: c.statusLateBorder, solid: c.statusLateSolid),
        AttendanceStatus.absent => (fg: c.statusAbsentFg, bg: c.statusAbsentBg, border: c.statusAbsentBorder, solid: c.statusAbsentSolid),
        AttendanceStatus.suspectedFake => (fg: c.statusSuspectedFakeFg, bg: c.statusSuspectedFakeBg, border: c.statusSuspectedFakeBorder, solid: c.statusSuspectedFakeSolid),
        AttendanceStatus.confirmedFake => (fg: c.statusConfirmedFakeFg, bg: c.statusConfirmedFakeBg, border: c.statusConfirmedFakeBorder, solid: c.statusConfirmedFakeSolid),
        AttendanceStatus.onLeave => (fg: c.statusOnLeaveFg, bg: c.statusOnLeaveBg, border: c.statusOnLeaveBorder, solid: c.statusOnLeaveSolid),
      };
}

/// Pill with icon + label (never colour alone). "Suspected fake" also gets a dashed border = pending review.
class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key});
  final AttendanceStatus status;

  @override
  Widget build(BuildContext context) {
    final col = status.colors(ZonaColors.of(context));
    final t = ZonaText.of(context);
    final dashed = status == AttendanceStatus.suspectedFake;
    return CustomPaint(
      painter: dashed ? _DashedPillPainter(col.border) : null,
      child: Container(
        height: 28,
        padding: const EdgeInsetsDirectional.symmetric(horizontal: ZonaSpace.s3),
        decoration: BoxDecoration(
          color: col.bg,
          borderRadius: BorderRadius.circular(ZonaRadius.full),
          border: dashed ? null : Border.all(color: col.border),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(status.icon, size: ZonaSize.iconSm, color: col.fg),
          const SizedBox(width: ZonaSpace.s1_5),
          Text(status.label(AppLocalizations.of(context)), style: t.labelSm.copyWith(color: col.fg)),
        ]),
      ),
    );
  }
}

/// Neutral chip for day state (Not checked in / On duty / Checked out).
class DayStateChip extends StatelessWidget {
  const DayStateChip({super.key, required this.label, required this.icon, this.live = false});
  final String label;
  final IconData icon;
  final bool live;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    final fg = live ? c.statusPresentFg : c.fgMuted;
    return Container(
      height: 28,
      padding: const EdgeInsetsDirectional.symmetric(horizontal: ZonaSpace.s3),
      decoration: BoxDecoration(
        color: live ? c.statusPresentBg : c.sunken,
        borderRadius: BorderRadius.circular(ZonaRadius.full),
        border: Border.all(color: live ? c.statusPresentBorder : c.line),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: ZonaSize.iconSm, color: fg),
        const SizedBox(width: ZonaSpace.s1_5),
        Text(label, style: t.labelSm.copyWith(color: fg)),
      ]),
    );
  }
}

class _DashedPillPainter extends CustomPainter {
  _DashedPillPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius((Offset.zero & size).deflate(0.5), Radius.circular(size.height / 2));
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (final metric in (Path()..addRRect(rrect)).computeMetrics()) {
      for (double d = 0; d < metric.length; d += 6) {
        canvas.drawPath(metric.extractPath(d, d + 3.5), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DashedPillPainter old) => old.color != color;
}

/// Second, independent signal for the 8-hour rule; sits beside the status, never replaces it.
class ShortHoursBadge extends StatelessWidget {
  const ShortHoursBadge({super.key, required this.shortfall});
  final String shortfall;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    return Container(
      height: 28,
      padding: const EdgeInsetsDirectional.symmetric(horizontal: ZonaSpace.s3),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(ZonaRadius.full),
        border: Border.all(color: c.lineStrong),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(LucideIcons.hourglass, size: ZonaSize.iconSm, color: c.fgMuted),
        const SizedBox(width: ZonaSpace.s1_5),
        Text(AppLocalizations.of(context).statusShortBy(shortfall), style: t.labelSm.copyWith(color: c.fgMuted)),
      ]),
    );
  }
}
