import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../l10n/app_localizations.dart';
import '../generated/zona_tokens.g.dart';
import '../zona_format.dart';
import '../zona_theme.dart';
import 'status_chip.dart';

enum DayState { notCheckedIn, onDuty, checkedOut }

/// The home screen's hero action: one large Check In / Check Out control that shows its state, the
/// working-hours timer and progress toward the required day (the 8-hour rule).
///
/// The progress ring runs clockwise in both LTR and RTL: it depicts elapsed time like a clock face,
/// which is not mirrored (only directional UI such as linear progress, arrows and chevrons is).
class CheckInHero extends StatelessWidget {
  const CheckInHero({
    super.key,
    required this.state,
    required this.worked,
    required this.required,
    required this.siteName,
    this.checkedInAt,
    this.onPressed,
    this.busy = false,
    this.statusLine,
  });

  final DayState state;
  final Duration worked;
  final Duration required;
  final String siteName;
  final DateTime? checkedInAt;
  final VoidCallback? onPressed;

  /// Shows a spinner in the disk and disables it (e.g. while getting a GPS fix).
  final bool busy;

  /// Replaces the hint under the control while busy (e.g. "Getting your location…").
  final String? statusLine;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    final l10n = AppLocalizations.of(context);
    final f = ZonaFormat.of(context);
    final progress = (worked.inSeconds / required.inSeconds).clamp(0.0, 1.0);
    final complete = progress >= 1;
    final remaining = required - worked;

    final (Color disk, Color onDisk) = switch (state) {
      DayState.notCheckedIn => (c.accentStrong, c.onAccent),
      DayState.onDuty => (c.brand, c.onBrand),
      DayState.checkedOut => (c.sunken, c.fgMuted),
    };

    final chip = switch (state) {
      DayState.notCheckedIn => DayStateChip(label: l10n.dayNotCheckedIn, icon: LucideIcons.circleDashed),
      DayState.onDuty => DayStateChip(label: l10n.dayOnDuty, icon: LucideIcons.radio, live: true),
      DayState.checkedOut => DayStateChip(label: l10n.dayCheckedOut, icon: LucideIcons.circleCheck),
    };

    final semantics = switch (state) {
      DayState.notCheckedIn => l10n.heroCheckIn,
      DayState.onDuty => '${l10n.heroCheckOut}. ${l10n.heroWorkedOf(f.duration(worked), f.duration(required))}',
      DayState.checkedOut => l10n.dayCheckedOut,
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: ZonaSpace.s2,
          runSpacing: ZonaSpace.s2,
          children: [
            chip,
            if (checkedInAt != null && state != DayState.notCheckedIn)
              Text(l10n.heroCheckedInAt(f.time(checkedInAt!)), style: t.caption),
          ],
        ),
        const SizedBox(height: ZonaSpace.s6),
        SizedBox.square(
          dimension: ZonaSize.heroAction + 28,
          child: CustomPaint(
            painter: state == DayState.notCheckedIn
                ? null
                : _RingPainter(progress: progress, track: c.line, color: complete ? c.statusPresentSolid : c.accent),
            child: Center(
              child: Semantics(
                button: state != DayState.checkedOut,
                label: semantics,
                excludeSemantics: true,
                child: Material(
                  color: disk,
                  shape: const CircleBorder(),
                  elevation: 0,
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: state == DayState.checkedOut || busy ? null : onPressed,
                    child: SizedBox.square(
                      dimension: ZonaSize.heroAction,
                      child: Padding(
                        padding: const EdgeInsets.all(ZonaSpace.s4),
                        child: busy
                            ? Center(child: SizedBox.square(dimension: 40, child: CircularProgressIndicator(color: onDisk, strokeWidth: 3)))
                            : _DiskContent(state: state, worked: worked, onDisk: onDisk),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: ZonaSpace.s5),
        if (busy && statusLine != null)
          Text(statusLine!, style: t.body.copyWith(color: c.fgMuted), textAlign: TextAlign.center)
        else if (state == DayState.notCheckedIn)
          Text(l10n.heroCheckInHint(siteName), style: t.body.copyWith(color: c.fgMuted), textAlign: TextAlign.center)
        else ...[
          Text(l10n.heroWorkedOf(f.duration(worked), f.duration(required)), style: t.subtitle, textAlign: TextAlign.center),
          const SizedBox(height: ZonaSpace.s1),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(complete ? LucideIcons.circleCheck : LucideIcons.hourglass,
                  size: ZonaSize.iconSm, color: complete ? c.statusPresentFg : c.fgMuted),
              const SizedBox(width: ZonaSpace.s1_5),
              Text(
                complete ? l10n.heroComplete : l10n.heroRemaining(f.duration(remaining)),
                style: t.body.copyWith(color: complete ? c.statusPresentFg : c.fgMuted),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _DiskContent extends StatelessWidget {
  const _DiskContent({required this.state, required this.worked, required this.onDisk});
  final DayState state;
  final Duration worked;
  final Color onDisk;

  @override
  Widget build(BuildContext context) {
    final t = ZonaText.of(context);
    final l10n = AppLocalizations.of(context);
    final f = ZonaFormat.of(context);
    Widget label(IconData icon, String text) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: ZonaSize.iconMd, color: onDisk),
            const SizedBox(width: ZonaSpace.s1_5),
            Flexible(child: Text(text, style: t.label.copyWith(color: onDisk), overflow: TextOverflow.ellipsis)),
          ],
        );
    return switch (state) {
      DayState.notCheckedIn => Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(LucideIcons.fingerprint, size: ZonaSize.iconXl + 8, color: onDisk),
          const SizedBox(height: ZonaSpace.s2),
          Text(l10n.heroCheckIn, style: t.title.copyWith(color: onDisk), textAlign: TextAlign.center),
        ]),
      DayState.onDuty => Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          FittedBox(child: Text(f.duration(worked), style: t.timer.copyWith(color: onDisk, fontSize: 30))),
          const SizedBox(height: ZonaSpace.s2),
          label(LucideIcons.logOut, l10n.heroCheckOut),
        ]),
      DayState.checkedOut => Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(LucideIcons.circleCheckBig, size: ZonaSize.iconXl, color: onDisk),
          const SizedBox(height: ZonaSpace.s2),
          FittedBox(child: Text(f.duration(worked), style: t.title.copyWith(color: onDisk))),
        ]),
    };
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.progress, required this.track, required this.color});
  final double progress;
  final Color track;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 8.0;
    final rect = (Offset.zero & size).deflate(stroke / 2);
    final base = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, 0, math.pi * 2, false, base..color = track);
    if (progress > 0) canvas.drawArc(rect, -math.pi / 2, math.pi * 2 * progress, false, base..color = color);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress || old.color != color || old.track != track;
}

/// Persistent "Location sharing is ON" indicator (FR-LOC-05), shown only while on duty.
class LocationSharingIndicator extends StatefulWidget {
  const LocationSharingIndicator({super.key});

  @override
  State<LocationSharingIndicator> createState() => _LocationSharingIndicatorState();
}

class _LocationSharingIndicatorState extends State<LocationSharingIndicator> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Respect the OS reduce-motion setting: the dot stays static.
    if (MediaQuery.disableAnimationsOf(context)) {
      _pulse.stop();
    } else if (!_pulse.isAnimating) {
      _pulse.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final t = ZonaText.of(context);
    final l10n = AppLocalizations.of(context);
    return Semantics(
      liveRegion: true,
      label: '${l10n.heroLocationOn}. ${l10n.heroLocationOnHint}',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.all(ZonaSpace.s3),
        decoration: BoxDecoration(
          color: c.brandSubtle,
          borderRadius: BorderRadius.circular(ZonaRadius.lg),
        ),
        child: Row(children: [
          SizedBox.square(
            dimension: 40,
            child: Stack(alignment: Alignment.center, children: [
              FadeTransition(
                opacity: Tween(begin: 0.25, end: 0.6).animate(_pulse),
                child: DecoratedBox(
                  decoration: BoxDecoration(shape: BoxShape.circle, color: c.statusPresentSolid.withValues(alpha: 0.35)),
                  child: const SizedBox.square(dimension: 40),
                ),
              ),
              Icon(LucideIcons.mapPin, size: ZonaSize.iconMd, color: c.statusPresentFg),
            ]),
          ),
          const SizedBox(width: ZonaSpace.s3),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l10n.heroLocationOn, style: t.label.copyWith(color: c.brandFg)),
              Text(l10n.heroLocationOnHint, style: t.caption.copyWith(color: c.fgMuted)),
            ]),
          ),
        ]),
      ),
    );
  }
}
