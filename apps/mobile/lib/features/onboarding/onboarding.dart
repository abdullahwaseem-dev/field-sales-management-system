import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app/app_header.dart';
import '../../core/app_scope.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_localizations.dart';
import '../../location/tracking.dart';

/// Before attendance unlocks: explicit consent (SRS §5.6) and "Allow all the time" location (FR-AUTH-04).
class OnboardingGate extends StatefulWidget {
  const OnboardingGate({super.key, required this.child});
  final Widget child;

  @override
  State<OnboardingGate> createState() => _OnboardingGateState();
}

class _OnboardingGateState extends State<OnboardingGate> with WidgetsBindingObserver {
  Map<String, dynamic>? _consent;
  LocationAccess? _access;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Coming back from system Settings: re-check the permission.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _access != LocationAccess.always) _checkAccess();
  }

  Future<void> _load() async {
    final scope = AppScope.of(context);
    try {
      final consent = await scope.api.get('/consent') as Map<String, dynamic>;
      final access = await scope.tracking.access();
      if (mounted) setState(() => (_consent = consent, _access = access, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _checkAccess() async {
    final access = await AppScope.of(context).tracking.access();
    if (mounted) setState(() => _access = access);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (_error != null) {
      return Scaffold(
        appBar: const AppHeader(showNotifications: false),
        body: Center(child: EmptyState(icon: LucideIcons.wifiOff, title: l10n.stateErrorTitle, body: errorMessage(context, _error!))),
        bottomNavigationBar: Padding(padding: const EdgeInsets.all(ZonaSpace.s4), child: ZonaButton(label: l10n.actionRetry, onPressed: _load)),
      );
    }
    if (_consent == null || _access == null) return const _Splash();
    if (_consent!['accepted'] != true) return _ConsentScreen(consent: _consent!, onAccepted: _load);
    if (_access != LocationAccess.always) return _PermissionScreen(access: _access!, onChanged: _checkAccess);
    return widget.child;
  }
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(child: ZonaLogo(ZonaLogoKind.mark, height: 56, semanticLabel: AppLocalizations.of(context).appBrandLabel)),
      );
}

class _ConsentScreen extends StatefulWidget {
  const _ConsentScreen({required this.consent, required this.onAccepted});
  final Map<String, dynamic> consent;
  final VoidCallback onAccepted;

  @override
  State<_ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<_ConsentScreen> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    return Scaffold(
      appBar: const AppHeader(showNotifications: false),
      body: ListView(padding: const EdgeInsets.all(ZonaSpace.s6), children: [
        Icon(LucideIcons.mapPinCheck, size: 48, color: c.brandFg),
        const SizedBox(height: ZonaSpace.s4),
        Text(l10n.onboardingConsentTitle, style: t.headline),
        const SizedBox(height: ZonaSpace.s4),
        Text(widget.consent[arabic ? 'bodyAr' : 'bodyEn'] as String, style: t.bodyLg),
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(ZonaSpace.s4),
          child: ZonaButton(
            label: l10n.onboardingConsentAccept,
            loading: _busy,
            expand: true,
            onPressed: () async {
              setState(() => _busy = true);
              try {
                await AppScope.of(context).api.post('/consent/accept', {'version': widget.consent['version']});
                widget.onAccepted();
              } catch (e) {
                if (context.mounted) showError(context, e);
              } finally {
                if (mounted) setState(() => _busy = false);
              }
            },
          ),
        ),
      ),
    );
  }
}

class _PermissionScreen extends StatelessWidget {
  const _PermissionScreen({required this.access, required this.onChanged});
  final LocationAccess access;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final tracking = AppScope.of(context).tracking;
    final needsSettings = access == LocationAccess.whileInUse;
    return Scaffold(
      appBar: const AppHeader(showNotifications: false),
      body: ListView(padding: const EdgeInsets.all(ZonaSpace.s6), children: [
        Icon(LucideIcons.locateFixed, size: 48, color: c.brandFg),
        const SizedBox(height: ZonaSpace.s4),
        Text(l10n.onboardingPermTitle, style: t.headline),
        const SizedBox(height: ZonaSpace.s4),
        Text(l10n.onboardingPermBody, style: t.bodyLg),
        if (needsSettings) ...[
          const SizedBox(height: ZonaSpace.s4),
          Text(l10n.onboardingPermAlwaysNeeded, style: t.body.copyWith(color: c.statusLateFg)),
        ],
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(ZonaSpace.s4),
          child: ZonaButton(
            label: needsSettings ? l10n.onboardingPermOpenSettings : l10n.onboardingPermAllow,
            expand: true,
            onPressed: () async {
              if (needsSettings) {
                await tracking.requestAlways();
                await tracking.openSettings();
              } else {
                await tracking.requestAlways();
              }
              onChanged();
            },
          ),
        ),
      ),
    );
  }
}
