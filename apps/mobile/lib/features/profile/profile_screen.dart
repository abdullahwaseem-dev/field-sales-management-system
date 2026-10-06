import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/app_scope.dart';
import '../../core/config.dart';
import '../../design_system/design_system.dart';
import '../../design_system/gallery/gallery.dart';
import '../../l10n/app_localizations.dart';
import '../home/home_screen.dart';

/// Profile: who I am, my attendance by month with correction requests (BR-ATT-02), privacy, sign out.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _me;
  Map<String, dynamic>? _month;
  int _offset = 180;
  late DateTime _monthStart = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  String get _monthKey => '${_monthStart.year}-${_monthStart.month.toString().padLeft(2, '0')}';

  Future<void> _load() async {
    final api = AppScope.of(context).api;
    try {
      final me = await api.get('/me') as Map<String, dynamic>;
      final today = await api.get('/attendance/today') as Map<String, dynamic>;
      final month = await api.get('/attendance/me?month=$_monthKey') as Map<String, dynamic>;
      if (mounted) setState(() => (_me = me, _month = month, _offset = today['utcOffsetMinutes'] as int));
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    final scope = AppScope.of(context);
    final me = _me;
    String n(Map<String, dynamic>? m) => m == null ? '—' : m[arabic ? 'nameAr' : 'nameEn'] as String;

    Widget row(String label, String value, {bool ltr = false}) => Padding(
      padding: const EdgeInsets.symmetric(vertical: ZonaSpace.s1),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: t.body.copyWith(color: c.fgMuted)),
          ),
          Text(value, style: t.body, textDirection: ltr ? TextDirection.ltr : null),
        ],
      ),
    );

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(ZonaSpace.s4),
        children: [
          ZonaCard(
            child: me == null
                ? const SkeletonList(rows: 2)
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(n(me), style: t.titleLg),
                      const SizedBox(height: ZonaSpace.s3),
                      row(l10n.fieldEmployeeId, me['employeeId'] as String, ltr: true),
                      row(l10n.fieldTeam, n(me['team'] as Map<String, dynamic>?)),
                      row(l10n.profileBranch, n(me['branch'] as Map<String, dynamic>?)),
                    ],
                  ),
          ),
          const SizedBox(height: ZonaSpace.s5),
          Row(
            children: [
              Expanded(child: Text(l10n.profileMyAttendance, style: t.subtitle)),
              IconButton(
                tooltip: MaterialLocalizations.of(context).previousMonthTooltip,
                icon: const ZonaDirIcon(LucideIcons.chevronLeft),
                onPressed: () {
                  setState(() => _monthStart = DateTime(_monthStart.year, _monthStart.month - 1));
                  _load();
                },
              ),
              Text(f.monthYear(_monthStart), style: t.label),
              IconButton(
                tooltip: MaterialLocalizations.of(context).nextMonthTooltip,
                icon: const ZonaDirIcon(LucideIcons.chevronRight),
                onPressed: _monthStart.isBefore(DateTime(DateTime.now().year, DateTime.now().month))
                    ? () {
                        setState(() => _monthStart = DateTime(_monthStart.year, _monthStart.month + 1));
                        _load();
                      }
                    : null,
              ),
            ],
          ),
          const SizedBox(height: ZonaSpace.s2),
          if (_month == null)
            const ZonaCard(child: SkeletonList())
          else if ((_month!['days'] as List).isEmpty)
            ZonaCard(
              child: EmptyState(icon: LucideIcons.calendarDays, title: l10n.attendanceNoRecords, body: ''),
            )
          else
            for (final d in (_month!['days'] as List).cast<Map<String, dynamic>>().reversed)
              Padding(
                padding: const EdgeInsets.only(bottom: ZonaSpace.s2),
                child: _DayCard(day: d, offset: _offset, finalized: _month!['finalized'] == true, onChanged: _load),
              ),
          const SizedBox(height: ZonaSpace.s5),
          ZonaCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(LucideIcons.shieldCheck),
                  title: Text(l10n.profilePrivacy),
                  trailing: const ZonaDirIcon(LucideIcons.chevronRight),
                  onTap: () async {
                    final consent = await scope.api.get('/consent') as Map<String, dynamic>;
                    if (!context.mounted) return;
                    showModalBottomSheet<void>(
                      context: context,
                      showDragHandle: true,
                      builder: (_) => Padding(
                        padding: const EdgeInsets.all(ZonaSpace.s4),
                        child: Text(consent[arabic ? 'bodyAr' : 'bodyEn'] as String, style: t.bodyLg),
                      ),
                    );
                  },
                ),
                ListTile(
                  leading: Icon(LucideIcons.logOut, color: c.statusAbsentFg),
                  title: Text(l10n.authSignOut, style: t.bodyLg.copyWith(color: c.statusAbsentFg)),
                  onTap: () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (_) => AlertDialog(
                        content: Text(l10n.authSignOutConfirm),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.actionCancel)),
                          TextButton(onPressed: () => Navigator.pop(context, true), child: Text(l10n.authSignOut)),
                        ],
                      ),
                    );
                    if (ok == true) {
                      await scope.tracking.stop();
                      await scope.session.logout();
                    }
                  },
                ),
                if (const bool.fromEnvironment('dart.vm.product') == false)
                  ListTile(
                    leading: const Icon(LucideIcons.palette),
                    title: Text(l10n.dsTitle),
                    onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const DesignSystemGallery())),
                  ),
              ],
            ),
          ),
          const SizedBox(height: ZonaSpace.s3),
          Center(child: Text(l10n.profileVersion(AppConfig.appVersion), style: t.caption)),
        ],
      ),
    );
  }
}

class _DayCard extends StatelessWidget {
  const _DayCard({required this.day, required this.offset, required this.finalized, required this.onChanged});
  final Map<String, dynamic> day;
  final int offset;
  final bool finalized;
  final VoidCallback onChanged;

  static AttendanceStatus _status(String s) => switch (s) {
    'late' => AttendanceStatus.late,
    'absent' => AttendanceStatus.absent,
    'suspected_fake' => AttendanceStatus.suspectedFake,
    'confirmed_fake' => AttendanceStatus.confirmedFake,
    'on_leave' => AttendanceStatus.onLeave,
    _ => AttendanceStatus.present,
  };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final inAt = day['checkInAt'] as String?, outAt = day['checkOutAt'] as String?;
    final pending = (day['corrections'] as List).any((r) => r['status'] == 'pending');
    final short = day['shortfallMinutes'] as int?;
    return ZonaCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(f.weekdayDate(DateTime.parse(day['workDate'] as String)), style: t.label)),
              StatusChip(_status(day['status'] as String)),
            ],
          ),
          if (inAt != null) ...[
            const SizedBox(height: ZonaSpace.s2),
            Text(
              '${f.time(siteTime(inAt, offset))} → ${outAt == null ? l10n.attendanceMissingCheckout : f.time(siteTime(outAt, offset))}'
              '${day['workedMinutes'] == null ? '' : '  ·  ${f.duration(Duration(minutes: day['workedMinutes'] as int))}'}',
              style: t.body.copyWith(color: c.fgMuted),
            ),
          ],
          if ((short ?? 0) > 0) ...[const SizedBox(height: ZonaSpace.s2), ShortHoursBadge(shortfall: f.duration(Duration(minutes: short!)))],
          if (pending)
            Padding(
              padding: const EdgeInsets.only(top: ZonaSpace.s2),
              child: Text(l10n.attendanceCorrectionPending, style: t.labelSm.copyWith(color: c.statusLateFg)),
            )
          else if (!finalized && day['status'] != 'on_leave')
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: TextButton(
                onPressed: () async {
                  final sent = await showModalBottomSheet<bool>(
                    context: context,
                    isScrollControlled: true,
                    showDragHandle: true,
                    builder: (_) => _CorrectionSheet(day: day, offset: offset),
                  );
                  if (sent == true) onChanged();
                },
                child: Text(l10n.attendanceRequestCorrection),
              ),
            ),
        ],
      ),
    );
  }
}

class _CorrectionSheet extends StatefulWidget {
  const _CorrectionSheet({required this.day, required this.offset});
  final Map<String, dynamic> day;
  final int offset;
  @override
  State<_CorrectionSheet> createState() => _CorrectionSheetState();
}

class _CorrectionSheetState extends State<_CorrectionSheet> {
  TimeOfDay? _in, _out;
  final _reason = TextEditingController();
  bool _busy = false;

  /// Site-local wall time on the work date → UTC instant.
  String _utc(TimeOfDay t) {
    final d = DateTime.parse(widget.day['workDate'] as String);
    return DateTime.utc(d.year, d.month, d.day, t.hour, t.minute).subtract(Duration(minutes: widget.offset)).toIso8601String();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    Widget pick(String label, TimeOfDay? value, ValueChanged<TimeOfDay> set) => OutlinedButton.icon(
      icon: const Icon(LucideIcons.clock),
      label: Text(value == null ? label : '$label · ${value.format(context)}'),
      onPressed: () async {
        final v = await showTimePicker(context: context, initialTime: value ?? const TimeOfDay(hour: 9, minute: 0));
        if (v != null) setState(() => set(v));
      },
    );
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: ZonaSpace.s4, right: ZonaSpace.s4, bottom: MediaQuery.viewInsetsOf(context).bottom + ZonaSpace.s4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.attendanceRequestCorrection, style: t.title),
            const SizedBox(height: ZonaSpace.s4),
            pick(l10n.tableCheckIn, _in, (v) => _in = v),
            const SizedBox(height: ZonaSpace.s2),
            pick(l10n.tableCheckOut, _out, (v) => _out = v),
            const SizedBox(height: ZonaSpace.s4),
            ZonaInput(controller: _reason, label: l10n.attendanceCorrectionReason, maxLines: 3),
            const SizedBox(height: ZonaSpace.s4),
            ZonaButton(
              label: l10n.leaveSubmit,
              loading: _busy,
              expand: true,
              onPressed: () async {
                setState(() => _busy = true);
                try {
                  await AppScope.of(context).api.post('/attendance/corrections', {
                    'workDate': widget.day['workDate'],
                    if (_in != null) 'requestedCheckInAt': _utc(_in!),
                    if (_out != null) 'requestedCheckOutAt': _utc(_out!),
                    'reason': _reason.text.trim(),
                  });
                  if (!context.mounted) return;
                  showZonaToast(context, variant: ZonaToastVariant.success, title: l10n.attendanceCorrectionSent);
                  Navigator.of(context).pop(true);
                } catch (e) {
                  if (context.mounted) showError(context, e);
                } finally {
                  if (mounted) setState(() => _busy = false);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
