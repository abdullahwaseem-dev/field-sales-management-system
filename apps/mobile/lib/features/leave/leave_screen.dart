import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/app_scope.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_localizations.dart';

/// Leave / off-day requests and their status (FR-LVE-01).
class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  List<Map<String, dynamic>>? _items;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    try {
      final items = ((await AppScope.of(context).api.get('/leave/mine')) as List).cast<Map<String, dynamic>>();
      if (mounted) setState(() => (_items = items, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final created = await showModalBottomSheet<bool>(context: context, isScrollControlled: true, showDragHandle: true, builder: (_) => const _NewLeaveSheet());
          if (created == true) _load();
        },
        icon: const Icon(LucideIcons.calendarPlus),
        label: Text(l10n.leaveNew),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(padding: const EdgeInsets.fromLTRB(ZonaSpace.s4, ZonaSpace.s4, ZonaSpace.s4, 96), children: [
          if (_items == null && _error != null)
            EmptyState(icon: LucideIcons.wifiOff, title: l10n.stateErrorTitle, body: errorMessage(context, _error!))
          else if (_items == null)
            const ZonaCard(child: SkeletonList())
          else if (_items!.isEmpty)
            EmptyState(icon: LucideIcons.calendarDays, title: l10n.leaveEmpty, body: '')
          else
            for (final r in _items!) Padding(padding: const EdgeInsets.only(bottom: ZonaSpace.s3), child: _LeaveCard(request: r, onChanged: _load)),
        ]),
      ),
    );
  }
}

class _LeaveCard extends StatelessWidget {
  const _LeaveCard({required this.request, required this.onChanged});
  final Map<String, dynamic> request;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final start = DateTime.parse(request['start_date'] as String), end = DateTime.parse(request['end_date'] as String);
    final status = request['status'] as String;
    final (label, fg, bg, icon) = switch (status) {
      'approved' => (l10n.leaveStatusApproved, c.statusPresentFg, c.statusPresentBg, LucideIcons.circleCheck),
      'rejected' => (l10n.leaveStatusRejected, c.statusAbsentFg, c.statusAbsentBg, LucideIcons.circleX),
      'cancelled' => (l10n.leaveStatusCancelled, c.fgMuted, c.sunken, LucideIcons.ban),
      _ => (l10n.leaveStatusPending, c.statusLateFg, c.statusLateBg, LucideIcons.hourglass),
    };
    final cancellable = status == 'pending' || (status == 'approved' && start.isAfter(DateTime.now()));
    return ZonaCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(request['type'] == 'off_day' ? l10n.leaveTypeOffDay : l10n.leaveTypeLeave, style: t.subtitle)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: ZonaSpace.s3, vertical: ZonaSpace.s1),
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(ZonaRadius.full)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: ZonaSize.iconSm, color: fg), const SizedBox(width: ZonaSpace.s1_5), Text(label, style: t.labelSm.copyWith(color: fg))]),
          ),
        ]),
        const SizedBox(height: ZonaSpace.s1),
        Text('${f.shortDate(start)} – ${f.shortDate(end)} · ${l10n.leaveDays(end.difference(start).inDays + 1)}', style: t.body.copyWith(color: c.fgMuted)),
        const SizedBox(height: ZonaSpace.s2),
        Text(request['reason'] as String, style: t.body),
        if ((request['decision_remark'] as String?)?.isNotEmpty ?? false) ...[
          const SizedBox(height: ZonaSpace.s2),
          Text(request['decision_remark'] as String, style: t.caption),
        ],
        if (cancellable)
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(
              onPressed: () async {
                try {
                  await AppScope.of(context).api.post('/leave/${request['request_id']}/cancel');
                  onChanged();
                } catch (e) {
                  if (context.mounted) showError(context, e);
                }
              },
              child: Text(l10n.leaveCancelRequest),
            ),
          ),
      ]),
    );
  }
}

class _NewLeaveSheet extends StatefulWidget {
  const _NewLeaveSheet();
  @override
  State<_NewLeaveSheet> createState() => _NewLeaveSheetState();
}

class _NewLeaveSheetState extends State<_NewLeaveSheet> {
  String _type = 'leave';
  DateTimeRange? _range;
  final _reason = TextEditingController();
  bool _busy = false;

  String _iso(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final f = ZonaFormat.of(context);
    final now = DateTime.now();
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: ZonaSpace.s4, right: ZonaSpace.s4, bottom: MediaQuery.viewInsetsOf(context).bottom + ZonaSpace.s4),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(l10n.leaveNew, style: t.title),
          const SizedBox(height: ZonaSpace.s4),
          Text(l10n.leaveType, style: t.label),
          const SizedBox(height: ZonaSpace.s1_5),
          SegmentedButton<String>(
            segments: [ButtonSegment(value: 'leave', label: Text(l10n.leaveTypeLeave)), ButtonSegment(value: 'off_day', label: Text(l10n.leaveTypeOffDay))],
            selected: {_type},
            onSelectionChanged: (s) => setState(() => _type = s.first),
          ),
          const SizedBox(height: ZonaSpace.s4),
          OutlinedButton.icon(
            icon: const Icon(LucideIcons.calendarRange),
            label: Text(_range == null ? '${l10n.leaveFrom} – ${l10n.leaveTo}' : '${f.shortDate(_range!.start)} – ${f.shortDate(_range!.end)}'),
            onPressed: () async {
              final picked = await showDateRangePicker(context: context, firstDate: DateTime(now.year, now.month), lastDate: now.add(const Duration(days: 365)), initialDateRange: _range);
              if (picked != null) setState(() => _range = picked);
            },
          ),
          const SizedBox(height: ZonaSpace.s4),
          ZonaInput(controller: _reason, label: l10n.leaveReason, maxLines: 3),
          const SizedBox(height: ZonaSpace.s4),
          ZonaButton(
            label: l10n.leaveSubmit,
            loading: _busy,
            expand: true,
            onPressed: _range == null || _reason.text.trim().length < 3
                ? null
                : () async {
                    setState(() => _busy = true);
                    try {
                      await AppScope.of(context).api.post('/leave', {'type': _type, 'startDate': _iso(_range!.start), 'endDate': _iso(_range!.end), 'reason': _reason.text.trim()});
                      if (!context.mounted) return;
                      showZonaToast(context, variant: ZonaToastVariant.success, title: l10n.leaveSubmitted);
                      Navigator.of(context).pop(true);
                    } catch (e) {
                      if (context.mounted) showError(context, e);
                    } finally {
                      if (mounted) setState(() => _busy = false);
                    }
                  },
          ),
        ]),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _reason.addListener(() => setState(() {}));
  }
}
