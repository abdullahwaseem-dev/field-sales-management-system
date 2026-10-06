import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show Bidi;
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:uuid/uuid.dart';

import '../../core/app_scope.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_localizations.dart';

/// Monthly sales target (visits and orders, set by the administrator) and the rep's progress.
/// Visits/orders are logged only while checked in, so any location attached is on-duty location.
class SalesTargetCard extends StatelessWidget {
  const SalesTargetCard({super.key, required this.data, required this.onDuty, required this.onLogged});
  final Map<String, dynamic> data;
  final bool onDuty;
  final VoidCallback onLogged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final target = data['target'] as Map<String, dynamic>?;
    final done = data['done'] as Map<String, dynamic>;
    final month = f.monthYear(DateTime.parse('${data['month']}-01'));

    Future<void> log(String kind) async {
      final saved = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (_) => LogActivitySheet(kind: kind),
      );
      if (saved == true) onLogged();
    }

    return ZonaCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(LucideIcons.target, size: ZonaSize.iconMd, color: c.brand),
              const SizedBox(width: ZonaSpace.s2),
              Expanded(child: Text(l10n.salesMonthTarget(month), style: t.subtitle)),
              TextButton(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => SalesScreen(month: data['month'] as String))),
                child: Text(l10n.salesViewAll),
              ),
            ],
          ),
          const SizedBox(height: ZonaSpace.s3),
          if (target == null) ...[
            Text(l10n.salesNone, style: t.label),
            const SizedBox(height: ZonaSpace.s1),
            Text(l10n.salesNoneBody, style: t.caption),
            const SizedBox(height: ZonaSpace.s3),
            _CountRow(icon: LucideIcons.footprints, label: l10n.targetsVisits, done: done['visits'] as int, target: 0),
            const SizedBox(height: ZonaSpace.s2),
            _CountRow(icon: LucideIcons.packageCheck, label: l10n.targetsOrders, done: done['orders'] as int, target: 0),
          ] else ...[
            _CountRow(icon: LucideIcons.footprints, label: l10n.targetsVisits, done: done['visits'] as int, target: target['visits'] as int),
            const SizedBox(height: ZonaSpace.s3),
            _CountRow(icon: LucideIcons.packageCheck, label: l10n.targetsOrders, done: done['orders'] as int, target: target['orders'] as int),
            if ((target['note'] as String?)?.isNotEmpty == true) ...[const SizedBox(height: ZonaSpace.s3), Text(target['note'] as String, style: t.caption, textDirection: Bidi.detectRtlDirectionality(target['note'] as String) ? TextDirection.rtl : TextDirection.ltr)],
          ],
          const SizedBox(height: ZonaSpace.s4),
          Row(
            children: [
              Expanded(
                child: ZonaButton(
                  label: l10n.salesLogVisit,
                  icon: LucideIcons.footprints,
                  variant: ZonaButtonVariant.secondary,
                  onPressed: onDuty ? () => log('visit') : null,
                ),
              ),
              const SizedBox(width: ZonaSpace.s3),
              Expanded(
                child: ZonaButton(
                  label: l10n.salesLogOrder,
                  icon: LucideIcons.packageCheck,
                  variant: ZonaButtonVariant.secondary,
                  onPressed: onDuty ? () => log('order') : null,
                ),
              ),
            ],
          ),
          if (!onDuty) ...[const SizedBox(height: ZonaSpace.s2), Text(l10n.salesCheckInFirst, style: t.caption, textAlign: TextAlign.center)],
        ],
      ),
    );
  }
}

/// One measure: "12 of 40" with a bar and what's left (text carries the meaning, not colour).
class _CountRow extends StatelessWidget {
  const _CountRow({required this.icon, required this.label, required this.done, required this.target});
  final IconData icon;
  final String label;
  final int done;
  final int target;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final reached = target > 0 && done >= target;
    return Semantics(
      label: target > 0 ? '$label: ${l10n.targetsProgress(f.number(done), f.number(target))}' : '$label: ${f.number(done)}',
      excludeSemantics: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, size: ZonaSize.iconSm, color: c.fgMuted),
              const SizedBox(width: ZonaSpace.s2),
              Expanded(child: Text(label, style: t.label)),
              Text(target > 0 ? l10n.targetsProgress(f.number(done), f.number(target)) : f.number(done), style: t.label),
            ],
          ),
          if (target > 0) ...[
            const SizedBox(height: ZonaSpace.s1_5),
            ClipRRect(
              borderRadius: BorderRadius.circular(ZonaRadius.full),
              child: LinearProgressIndicator(
                value: (done / target).clamp(0, 1).toDouble(),
                minHeight: 6,
                backgroundColor: c.sunken,
                color: reached ? c.statusPresentFg : c.brand,
              ),
            ),
            const SizedBox(height: ZonaSpace.s1),
            Text(
              reached ? l10n.salesReached : l10n.salesRemaining(f.number(target - done)),
              style: t.caption.copyWith(color: reached ? c.statusPresentFg : c.fgMuted),
            ),
          ],
        ],
      ),
    );
  }
}

/// Log a customer visit or an order. The id is made on the phone, so a retry never double-counts.
class LogActivitySheet extends StatefulWidget {
  const LogActivitySheet({super.key, required this.kind});
  final String kind;

  @override
  State<LogActivitySheet> createState() => _LogActivitySheetState();
}

class _LogActivitySheetState extends State<LogActivitySheet> {
  final _customer = TextEditingController();
  final _note = TextEditingController();
  final _id = const Uuid().v4();
  bool _busy = false;

  Future<void> _save() async {
    final scope = AppScope.of(context);
    final l10n = AppLocalizations.of(context);
    setState(() => _busy = true);
    try {
      Map<String, Object?> where = const {};
      try {
        final fix = await scope.tracking.currentFix().timeout(const Duration(seconds: 8));
        where = {'lat': fix.latitude, 'lng': fix.longitude, 'accuracyM': fix.accuracy};
      } catch (_) {
        // A visit still counts without a fix.
      }
      await scope.api.post('/sales/activities', {
        'activityId': _id,
        'kind': widget.kind,
        'customerName': _customer.text.trim(),
        if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
        ...where,
      });
      if (!mounted) return;
      showZonaToast(context, variant: ZonaToastVariant.success, title: l10n.salesLogged);
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: ZonaSpace.s4, right: ZonaSpace.s4, bottom: MediaQuery.viewInsetsOf(context).bottom + ZonaSpace.s4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.kind == 'order' ? l10n.salesLogOrder : l10n.salesLogVisit, style: t.title),
            const SizedBox(height: ZonaSpace.s4),
            ZonaInput(
              controller: _customer,
              label: l10n.targetsCustomer,
              hint: l10n.salesCustomerHint,
              icon: LucideIcons.store,
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: ZonaSpace.s4),
            ZonaInput(controller: _note, label: l10n.targetsNote, hint: l10n.salesNoteHint, maxLines: 3),
            const SizedBox(height: ZonaSpace.s4),
            ZonaButton(label: l10n.actionSave, loading: _busy, expand: true, onPressed: _customer.text.trim().isEmpty ? null : _save),
          ],
        ),
      ),
    );
  }
}

/// Everything the rep logged this month, newest first (voided entries shown struck through).
class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key, required this.month});
  final String month;

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  Map<String, dynamic>? _data;
  Object? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_data == null) _load();
  }

  Future<void> _load() async {
    try {
      final d = await AppScope.of(context).api.get('/sales/me?month=${widget.month}') as Map<String, dynamic>;
      if (mounted) setState(() => (_data = d, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final data = _data;
    final items = ((data?['activities'] as List?) ?? const []).cast<Map<String, dynamic>>();
    return Scaffold(
      appBar: AppBar(title: Text(l10n.salesTitle)),
      body: data == null
          ? (_error != null
                ? EmptyState(icon: LucideIcons.wifiOff, title: l10n.stateErrorTitle, body: errorMessage(context, _error!))
                : const Padding(
                    padding: EdgeInsets.all(ZonaSpace.s4),
                    child: ZonaCard(child: SkeletonList()),
                  ))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(ZonaSpace.s4),
                children: [
                  SalesTargetCard(data: data, onDuty: data['onDuty'] == true, onLogged: _load),
                  const SizedBox(height: ZonaSpace.s5),
                  Text(l10n.salesRecent, style: t.subtitle),
                  const SizedBox(height: ZonaSpace.s2),
                  if (items.isEmpty)
                    EmptyState(icon: LucideIcons.clipboardList, title: l10n.salesEmpty, body: l10n.targetsEmptyLogBody)
                  else
                    ZonaCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          for (final (i, a) in items.indexed) ...[
                            if (i > 0) Divider(height: 1, color: c.line),
                            ListTile(
                              leading: Icon(
                                a['kind'] == 'order' ? LucideIcons.packageCheck : LucideIcons.footprints,
                                color: a['voided'] == true ? c.fgMuted : c.brand,
                              ),
                              title: Text(
                                a['customerName'] as String,
                                style: t.label.copyWith(
                                  decoration: a['voided'] == true ? TextDecoration.lineThrough : null,
                                  color: a['voided'] == true ? c.fgMuted : null,
                                ),
                              ),
                              subtitle: Text(
                                [
                                  a['kind'] == 'order' ? l10n.targetsKindOrder : l10n.targetsKindVisit,
                                  f.shortDate(DateTime.parse(a['workDate'] as String)),
                                  if (a['voided'] == true)
                                    '${l10n.targetsVoided}: ${a['voidReason'] ?? ''}'
                                  else if ((a['note'] as String?)?.isNotEmpty == true)
                                    a['note'] as String,
                                ].join(' · '),
                                style: t.caption.copyWith(color: a['voided'] == true ? c.statusAbsentFg : null),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
