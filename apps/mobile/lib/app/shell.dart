import 'dart:async';

import 'package:flutter/material.dart';

import '../core/app_scope.dart';
import '../core/session.dart';
import '../design_system/design_system.dart';
import '../features/auth/auth_screens.dart';
import '../features/catalogue/catalogue_screen.dart';
import '../features/home/home_screen.dart';
import '../features/leave/leave_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/onboarding/onboarding.dart';
import '../features/profile/profile_screen.dart';
import '../l10n/app_localizations.dart';
import 'app_header.dart';

/// Routes by session state: sign-in → forced password change → consent/permissions → app.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final session = AppScope.of(context).session;
    return ListenableBuilder(
      listenable: session,
      builder: (context, _) => switch (session.state) {
        SessionState.loading => Scaffold(body: Center(child: ZonaLogo(ZonaLogoKind.mark, height: 56, semanticLabel: AppLocalizations.of(context).appBrandLabel))),
        SessionState.signedOut => const LoginScreen(),
        SessionState.mustChangePassword => const ChangePasswordScreen(),
        SessionState.signedIn => const OnboardingGate(child: HomeShell()),
      },
    );
  }
}

/// Signed-in app: header (logo, language, theme, notifications) + bottom tabs.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  int _unread = 0;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshUnread());
    _poll = Timer.periodic(const Duration(minutes: 1), (_) => _refreshUnread());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refreshUnread() async {
    try {
      final res = await AppScope.of(context).api.get('/notifications') as Map<String, dynamic>;
      if (mounted) setState(() => _unread = res['unread'] as int);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppHeader(
        unread: _unread,
        onNotifications: () async {
          await Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const NotificationsScreen()));
          _refreshUnread();
        },
      ),
      body: IndexedStack(index: _tab, children: [
        HomeScreen(onOpenProfile: () => setState(() => _tab = 3)),
        const CatalogueScreen(),
        const LeaveScreen(),
        const ProfileScreen(),
      ]),
      bottomNavigationBar: ZonaBottomNav(selectedIndex: _tab, onSelected: (i) => setState(() => _tab = i)),
    );
  }
}
