import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/app_scope.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_localizations.dart';

/// In-app inbox. Server sends message keys; text is rendered in the reader's language.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>>? _items;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final res = await AppScope.of(context).api.get('/notifications') as Map<String, dynamic>;
    if (mounted) setState(() => _items = (res['items'] as List).cast<Map<String, dynamic>>());
  }

  /// 'YYYY-MM' → "October 2026" / "أكتوبر 2026" (the server sends the month, the app names it).
  static String _month(AppLocalizations l10n, String ym) {
    final d = DateTime.tryParse('$ym-01');
    return d == null ? ym : DateFormat.yMMMM(l10n.localeName == 'ar' ? 'ar' : 'en_GB').format(d);
  }

  static String message(AppLocalizations l10n, Map<String, dynamic> n, {bool arabic = false}) {
    final params = (n['params'] as Map?) ?? const {};
    return switch (n['messageKey']) {
      'notify.checkedIn' => l10n.notifyCheckedIn,
      'notify.checkedOut' => l10n.notifyCheckedOut,
      'notify.checkedOutShort' => l10n.notifyCheckedOutShort,
      'notify.autoCheckedOut' => l10n.notifyAutoCheckedOut,
      'notify.lateWarning' => l10n.notifyLateWarning,
      'notify.hoursCompleted' => l10n.notifyHoursCompleted,
      'notify.geofenceExit' => l10n.notifyGeofenceExit,
      'notify.leaveApproved' => l10n.notifyLeaveApproved,
      'notify.leaveRejected' => l10n.notifyLeaveRejected,
      'notify.correctionApproved' => l10n.notifyCorrectionApproved,
      'notify.correctionRejected' => l10n.notifyCorrectionRejected,
      'notify.fraudFlagged' => l10n.notifyFraudFlagged('${params['employeeId'] ?? ''}'),
      'notify.newContent' => l10n.notifyNewContent('${params[arabic ? 'nameAr' : 'nameEn'] ?? ''}'),
      'notify.targetSet' => l10n.notifyTargetSet(_month(l10n, '${params['month'] ?? ''}')),
      _ => '',
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.navNotifications),
        actions: [
          TextButton(
            onPressed: () async {
              await AppScope.of(context).api.post('/notifications/read-all');
              _load();
            },
            child: Text(l10n.notificationsMarkAll),
          ),
        ],
      ),
      body: _items == null
          ? const Padding(
              padding: EdgeInsets.all(ZonaSpace.s4),
              child: ZonaCard(child: SkeletonList()),
            )
          : _items!.isEmpty
          ? EmptyState(icon: LucideIcons.bellOff, title: l10n.notificationsEmpty, body: '')
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(ZonaSpace.s4),
                itemCount: _items!.length,
                separatorBuilder: (_, _) => const SizedBox(height: ZonaSpace.s2),
                itemBuilder: (context, i) {
                  final n = _items![i];
                  final unread = n['readAt'] == null;
                  return ZonaCard(
                    child: Row(
                      children: [
                        Icon(unread ? LucideIcons.bellDot : LucideIcons.bell, color: unread ? c.accentFg : c.fgMuted),
                        const SizedBox(width: ZonaSpace.s3),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(message(l10n, n, arabic: Localizations.localeOf(context).languageCode == 'ar'), style: unread ? t.label : t.body),
                              Text(
                                '${f.shortDate(DateTime.parse(n['createdAt'] as String).toLocal())} · ${f.time(DateTime.parse(n['createdAt'] as String).toLocal())}',
                                style: t.caption,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}
