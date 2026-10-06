import 'package:flutter/material.dart';

import '../app/preferences.dart';
import '../design_system/design_system.dart';
import '../l10n/app_localizations.dart';
import '../location/outbox.dart';
import '../location/tracking.dart';
import 'api_client.dart';
import 'session.dart';

/// Services available to every screen.
class AppScope extends InheritedWidget {
  const AppScope({super.key, required this.api, required this.session, required this.tracking, required this.outbox, required this.prefs, required super.child});

  final ApiClient api;
  final SessionController session;
  final TrackingService tracking;
  final Outbox outbox;
  final AppPreferences prefs;

  static AppScope of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!;

  @override
  bool updateShouldNotify(AppScope old) => false;
}

/// Localized message for an API/network error (codes mirror the API's problem+json `code`).
String errorMessage(BuildContext context, Object error) {
  final l10n = AppLocalizations.of(context);
  if (error is! ApiException) return l10n.stateErrorBody;
  final f = ZonaFormat.of(context);
  final arabic = Localizations.localeOf(context).languageCode == 'ar';
  return switch (error.code) {
    'NETWORK' => l10n.errorNETWORK,
    'INVALID_CREDENTIALS' => l10n.errorINVALIDCREDENTIALS,
    'ACCOUNT_LOCKED' => l10n.errorACCOUNTLOCKED,
    'OTP_INVALID' => l10n.errorOTPINVALID,
    'OTP_TOO_SOON' || 'RATE_LIMITED' => l10n.errorOTPTOOSOON,
    'PASSWORD_WEAK' => l10n.errorPASSWORDWEAK,
    'PASSWORD_REUSED' => l10n.errorPASSWORDREUSED,
    'MOBILE_NOT_ALLOWED' => l10n.errorMOBILENOTALLOWED,
    'SESSION_ENDED' => l10n.errorSESSIONENDED,
    'ON_LEAVE' => l10n.errorONLEAVE,
    'ALREADY_CHECKED_IN' => l10n.errorALREADYCHECKEDIN,
    'NOT_CHECKED_IN' => l10n.errorNOTCHECKEDIN,
    'CONSENT_REQUIRED' => l10n.errorCONSENTREQUIRED,
    'OVERLAP' => l10n.errorOVERLAP,
    'CORRECTION_PENDING' => l10n.errorCORRECTIONPENDING,
    'MONTH_FINALIZED' => l10n.errorMONTHFINALIZED,
    'OUTSIDE_GEOFENCE' => l10n.errorOUTSIDEGEOFENCE(
        f.distance((error.extra['distanceM'] as num?) ?? 0),
        ((error.extra['site'] as Map?)?[arabic ? 'nameAr' : 'nameEn'] as String?) ?? '',
      ),
    _ => l10n.stateErrorBody,
  };
}

void showError(BuildContext context, Object error) =>
    showZonaToast(context, variant: ZonaToastVariant.danger, title: errorMessage(context, error));
