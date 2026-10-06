import 'package:flutter/material.dart';

import 'app/preferences.dart';
import 'app/shell.dart';
import 'core/api_client.dart';
import 'core/app_scope.dart';
import 'core/config.dart';
import 'core/session.dart';
import 'design_system/design_system.dart';
import 'l10n/app_localizations.dart';
import 'location/outbox.dart';
import 'location/tracking.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Loaded before the first frame: no flash of the wrong theme or language.
  final prefs = await AppPreferences.load();
  final api = ApiClient(AppConfig.apiBaseUrl);
  final session = SessionController(api);
  final outbox = Outbox();
  final tracking = TrackingService(api, outbox);
  await session.restore();
  runApp(SfmsApp(prefs: prefs, api: api, session: session, outbox: outbox, tracking: tracking));
}

class SfmsApp extends StatelessWidget {
  const SfmsApp({super.key, required this.prefs, required this.api, required this.session, required this.outbox, required this.tracking});

  final AppPreferences prefs;
  final ApiClient api;
  final SessionController session;
  final Outbox outbox;
  final TrackingService tracking;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: prefs,
      builder: (context, _) => MaterialApp(
        debugShowCheckedModeBanner: false,
        onGenerateTitle: (context) => AppLocalizations.of(context).appName,
        themeMode: prefs.themeMode,
        theme: ZonaTheme.build(Brightness.light, const Locale('en')),
        darkTheme: ZonaTheme.build(Brightness.dark, const Locale('en')),
        locale: prefs.locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        // Default to the device language: Arabic if it is Arabic, otherwise English.
        localeResolutionCallback: (device, supported) => device?.languageCode == 'ar' ? const Locale('ar') : const Locale('en'),
        // Rebuild the theme for the resolved locale (Arabic line heights) and theme the system bars.
        builder: (context, child) => AppScope(
          api: api,
          session: session,
          tracking: tracking,
          outbox: outbox,
          prefs: prefs,
          child: AppPreferencesScope(prefs: prefs, child: ZonaScope(digits: prefs.digits, child: child!)),
        ),
        home: const AuthGate(),
      ),
    );
  }
}

/// Applies the locale-specific theme, digit preference and system-bar styling below MaterialApp.
class ZonaScope extends StatelessWidget {
  const ZonaScope({super.key, required this.digits, required this.child});
  final ZonaDigits digits;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final locale = Localizations.localeOf(context);
    return Theme(
      data: ZonaTheme.build(brightness, locale),
      child: ZonaLocaleSettings(
        digits: digits,
        child: AnnotatedRegion(value: ZonaTheme.overlayStyle(brightness), child: child),
      ),
    );
  }
}
