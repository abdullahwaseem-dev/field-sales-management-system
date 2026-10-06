import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_localizations.dart';
import '../../location/tracking.dart';
import '../sales/sales.dart';

/// Site-local time: the branch's offset from the API (KSA has no daylight saving).
DateTime siteTime(String iso, int offsetMinutes) => DateTime.parse(iso).toUtc().add(Duration(minutes: offsetMinutes));

/// Home: the hero Check In / Check Out control with the 8-hour progress, location-sharing status
/// and this month's summary.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.onOpenProfile});
  final VoidCallback? onOpenProfile;

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  Map<String, dynamic>? _today;
  Map<String, dynamic>? _month;
  Map<String, dynamic>? _sales;
  Object? _error;
  bool _busy = false;
  String? _busyLine;
  Timer? _tick;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tick = Timer.periodic(const Duration(seconds: 30), (_) => mounted ? setState(() {}) : null);
    WidgetsBinding.instance.addPostFrameCallback((_) => reload());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tick?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) reload();
  }

  Future<void> reload() async {
    final scope = AppScope.of(context);
    try {
      final today = await scope.api.get('/attendance/today') as Map<String, dynamic>;
      final ym = (today['date'] as String).substring(0, 7);
      final month = await scope.api.get('/attendance/me?month=$ym') as Map<String, dynamic>;
      final sales = await scope.api.get('/sales/me?month=$ym') as Map<String, dynamic>;
      if (!mounted) return;
      setState(() => (_today = today, _month = month, _sales = sales, _error = null));
      await _syncTracking(today);
      unawaited(scope.outbox.flush(scope.api));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  /// Tracking mirrors the server's view of the shift: on only while on duty (FR-LOC-03).
  Future<void> _syncTracking(Map<String, dynamic> today) async {
    final scope = AppScope.of(context);
    final l10n = AppLocalizations.of(context);
    if (today['state'] == 'on_duty') {
      await scope.tracking.start(
        intervalSeconds: (today['rules'] as Map)['pingIntervalSeconds'] as int,
        title: l10n.homeTrackingTitle,
        text: l10n.homeTrackingText,
      );
    } else if (scope.tracking.isTracking) {
      await scope.tracking.stop();
    }
  }

  Future<void> _checkIn() async {
    final scope = AppScope.of(context);
    final l10n = AppLocalizations.of(context);
    setState(() => (_busy = true, _busyLine = l10n.homeLocating));
    try {
      if (await scope.tracking.access() == LocationAccess.denied) {
        throw ApiException(0, 'LOCATION_PERMISSION');
      }
      final fix = await scope.tracking.currentFix().catchError((Object _) => throw ApiException(0, 'LOCATION_UNAVAILABLE'));
      final network = await scope.tracking.networkFix();
      final integrity = await scope.tracking.integrity();
      final networkJson = network == null ? null : {'lat': network.latitude, 'lng': network.longitude, 'accuracyM': network.accuracy};
      final today = await scope.api.post('/attendance/check-in', {
        'location': TrackingService.fixJson(fix),
        'networkLocation': ?networkJson,
        'integrity': integrity,
      }) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() => _today = today);
      await _syncTracking(today);
      if (!mounted) return;
      final f = ZonaFormat.of(context);
      final event = today['event'] as Map<String, dynamic>;
      showZonaToast(
        context,
        variant: event['status'] == 'suspected_fake' ? ZonaToastVariant.warning : ZonaToastVariant.success,
        title: l10n.toastCheckedIn(f.time(siteTime(event['checkInAt'] as String, today['utcOffsetMinutes'] as int))),
        body: event['status'] == 'suspected_fake' ? l10n.homeFlagged : l10n.toastCheckedInBody,
      );
      unawaited(reload());
    } on ApiException catch (e) {
      if (!mounted) return;
      final l = AppLocalizations.of(context);
      showZonaToast(
        context,
        variant: ZonaToastVariant.danger,
        title: switch (e.code) {
          'LOCATION_PERMISSION' => l.errorLOCATIONPERMISSION,
          'LOCATION_UNAVAILABLE' => l.errorLOCATIONUNAVAILABLE,
          _ => errorMessage(context, e),
        },
      );
    } finally {
      if (mounted) setState(() => (_busy = false, _busyLine = null));
    }
  }

  Future<void> _checkOut({bool confirmShort = false}) async {
    final scope = AppScope.of(context);
    setState(() => _busy = true);
    try {
      Map<String, Object?>? location;
      try {
        location = TrackingService.fixJson(await scope.tracking.currentFix().timeout(const Duration(seconds: 12)));
      } catch (_) {
        location = null; // check-out still works without a fix
      }
      final today = await scope.api.post('/attendance/check-out', {'location': ?location, if (confirmShort) 'confirmShort': true}) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() => _today = today);
      await scope.tracking.stop();
      unawaited(reload());
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.code == 'SHORT_DAY_CONFIRMATION_REQUIRED') {
        setState(() => _busy = false);
        final f = ZonaFormat.of(context);
        final ok = await showDialog<bool>(
          context: context,
          builder: (_) => EarlyCheckoutDialog(
            worked: f.duration(Duration(minutes: e.extra['workedMinutes'] as int)),
            required: f.duration(Duration(minutes: e.extra['requiredMinutes'] as int)),
            remaining: f.duration(Duration(minutes: e.extra['remainingMinutes'] as int)),
          ),
        );
        if (ok == true) return _checkOut(confirmShort: true);
      } else {
        showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final scope = AppScope.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    final today = _today;

    if (today == null) {
      return _error != null
          ? ListView(
              children: [
                EmptyState(icon: LucideIcons.wifiOff, title: l10n.stateErrorTitle, body: errorMessage(context, _error!)),
                Center(
                  child: ZonaButton(label: l10n.actionRetry, variant: ZonaButtonVariant.secondary, onPressed: reload),
                ),
              ],
            )
          : const Padding(
              padding: EdgeInsets.all(ZonaSpace.s4),
              child: ZonaCard(child: SkeletonList()),
            );
    }

    final offset = today['utcOffsetMinutes'] as int;
    final event = today['event'] as Map<String, dynamic>?;
    final rules = today['rules'] as Map<String, dynamic>;
    final state = today['state'] as String;
    final required = Duration(minutes: (event?['requiredWorkMinutes'] ?? rules['requiredWorkMinutes']) as int);
    final checkInAt = event?['checkInAt'] == null ? null : DateTime.parse(event!['checkInAt'] as String);
    final worked = state == 'on_duty' && checkInAt != null
        ? DateTime.now().toUtc().difference(checkInAt.toUtc())
        : Duration(minutes: (event?['workedMinutes'] as int?) ?? 0);
    final sites = (today['sites'] as List).cast<Map<String, dynamic>>();
    final site = sites.isEmpty ? '' : sites.first[arabic ? 'nameAr' : 'nameEn'] as String;
    final counts = (_month?['counts'] as Map<String, dynamic>?) ?? const {};
    final holiday = today['holiday'] as Map<String, dynamic>?;

    Widget banner(IconData icon, String text, Color fg, Color bg) => Container(
      padding: const EdgeInsets.all(ZonaSpace.s3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(ZonaRadius.md)),
      child: Row(
        children: [
          Icon(icon, color: fg, size: ZonaSize.iconMd),
          const SizedBox(width: ZonaSpace.s3),
          Expanded(
            child: Text(text, style: t.body.copyWith(color: fg)),
          ),
        ],
      ),
    );

    return RefreshIndicator(
      onRefresh: reload,
      child: ListView(
        padding: const EdgeInsets.all(ZonaSpace.s4),
        children: [
          Text(l10n.homeGreeting(scope.session.employee?.name(arabic ? 'ar' : 'en') ?? ''), style: t.titleLg),
          Text(f.weekdayDate(DateTime.parse(today['date'] as String)), style: t.caption),
          const SizedBox(height: ZonaSpace.s4),
          if (holiday != null) ...[
            banner(LucideIcons.partyPopper, l10n.homeHoliday(holiday[arabic ? 'nameAr' : 'nameEn'] as String), c.statusInfoFg, c.statusInfoBg),
            const SizedBox(height: ZonaSpace.s3),
          ] else if (today['isOffDay'] == true && state == 'not_checked_in') ...[
            banner(LucideIcons.coffee, l10n.homeOffDay, c.statusInfoFg, c.statusInfoBg),
            const SizedBox(height: ZonaSpace.s3),
          ],
          if (state == 'on_leave')
            banner(LucideIcons.calendarDays, l10n.homeOnLeave, c.statusOnLeaveFg, c.statusOnLeaveBg)
          else
            ZonaCard(
              padding: const EdgeInsets.symmetric(vertical: ZonaSpace.s6, horizontal: ZonaSpace.s4),
              child: CheckInHero(
                state: switch (state) {
                  'on_duty' => DayState.onDuty,
                  'checked_out' => DayState.checkedOut,
                  _ => DayState.notCheckedIn,
                },
                worked: worked,
                required: required,
                checkedInAt: checkInAt == null ? null : siteTime(event!['checkInAt'] as String, offset),
                siteName: site,
                busy: _busy,
                statusLine: _busyLine,
                onPressed: state == 'on_duty' ? () => _checkOut() : _checkIn,
              ),
            ),
          if (event?['status'] == 'suspected_fake') ...[
            const SizedBox(height: ZonaSpace.s3),
            banner(LucideIcons.shieldQuestion, l10n.homeFlagged, c.statusSuspectedFakeFg, c.statusSuspectedFakeBg),
          ],
          if (state == 'on_duty') ...[const SizedBox(height: ZonaSpace.s3), const LocationSharingIndicator()],
          ListenableBuilder(
            listenable: scope.outbox,
            builder: (context, _) => scope.outbox.pendingPings == 0
                ? const SizedBox.shrink()
                : Padding(
                    padding: const EdgeInsets.only(top: ZonaSpace.s2),
                    child: Text(l10n.homePending(scope.outbox.pendingPings), style: t.caption, textAlign: TextAlign.center),
                  ),
          ),
          if (_sales != null) ...[const SizedBox(height: ZonaSpace.s4), SalesTargetCard(data: _sales!, onDuty: state == 'on_duty', onLogged: reload)],
          const SizedBox(height: ZonaSpace.s5),
          Row(
            children: [
              Expanded(child: Text(l10n.summaryTitle, style: t.subtitle)),
              if (widget.onOpenProfile != null) TextButton(onPressed: widget.onOpenProfile, child: Text(l10n.profileMyAttendance)),
            ],
          ),
          const SizedBox(height: ZonaSpace.s2),
          _statRow(
            SummaryStat(
              label: l10n.summaryPresent,
              value: f.number(counts['presentDays'] ?? 0),
              icon: LucideIcons.circleCheck,
              fg: c.statusPresentFg,
              bg: c.statusPresentBg,
            ),
            SummaryStat(
              label: l10n.summaryLate,
              value: f.number(counts['lateCount'] ?? 0),
              icon: LucideIcons.clockAlert,
              fg: c.statusLateFg,
              bg: c.statusLateBg,
            ),
          ),
          const SizedBox(height: ZonaSpace.s3),
          _statRow(
            SummaryStat(
              label: l10n.summaryAbsent,
              value: f.number(counts['absentDays'] ?? 0),
              icon: LucideIcons.circleX,
              fg: c.statusAbsentFg,
              bg: c.statusAbsentBg,
            ),
            SummaryStat(
              label: l10n.summaryLeave,
              value: f.number(counts['leaveDays'] ?? 0),
              icon: LucideIcons.calendarDays,
              fg: c.statusOnLeaveFg,
              bg: c.statusOnLeaveBg,
            ),
          ),
          const SizedBox(height: ZonaSpace.s3),
          _statRow(
            SummaryStat(label: l10n.summaryShort, value: f.number(counts['shortHoursCount'] ?? 0), icon: LucideIcons.hourglass, fg: c.fgMuted, bg: c.sunken),
            SummaryStat(
              label: l10n.statusConfirmedFake,
              value: f.number(counts['confirmedFakeCount'] ?? 0),
              icon: LucideIcons.shieldX,
              fg: c.statusConfirmedFakeFg,
              bg: c.statusConfirmedFakeBg,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statRow(Widget a, Widget b) => IntrinsicHeight(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(child: a),
        const SizedBox(width: ZonaSpace.s3),
        Expanded(child: b),
      ],
    ),
  );
}
