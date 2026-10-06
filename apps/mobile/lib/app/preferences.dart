import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../design_system/zona_format.dart';

/// Per-user display preferences, applied instantly (no restart) and saved on the device. Loaded
/// before the first frame so the app never flashes the wrong theme or language. (A server copy per
/// user is added with the backend.)
class AppPreferences extends ChangeNotifier {
  AppPreferences._(this._store, this.themeMode, this.locale, this.digits);

  /// In-memory preferences (tests, previews).
  AppPreferences.memory({this.themeMode = ThemeMode.system, this.locale, this.digits = ZonaDigits.western}) : _store = null;

  static const _kTheme = 'theme', _kLocale = 'locale', _kDigits = 'digits';

  static Future<AppPreferences> load() async {
    final store = SharedPreferencesAsync();
    final theme = await store.getString(_kTheme);
    final locale = await store.getString(_kLocale);
    final digits = await store.getString(_kDigits);
    return AppPreferences._(
      store,
      ThemeMode.values.firstWhere((m) => m.name == theme, orElse: () => ThemeMode.system),
      locale == null ? null : Locale(locale),
      digits == ZonaDigits.arabicIndic.name ? ZonaDigits.arabicIndic : ZonaDigits.western,
    );
  }

  final SharedPreferencesAsync? _store;
  ThemeMode themeMode;

  /// null = follow the device language.
  Locale? locale;
  ZonaDigits digits;

  void setThemeMode(ThemeMode mode) {
    themeMode = mode;
    _store?.setString(_kTheme, mode.name);
    notifyListeners();
  }

  void setLocale(Locale value) {
    locale = value;
    _store?.setString(_kLocale, value.languageCode);
    notifyListeners();
  }

  void setDigits(ZonaDigits value) {
    digits = value;
    _store?.setString(_kDigits, value.name);
    notifyListeners();
  }
}

/// Makes [AppPreferences] available to any widget (e.g. the header controls).
class AppPreferencesScope extends InheritedNotifier<AppPreferences> {
  const AppPreferencesScope({super.key, required AppPreferences prefs, required super.child}) : super(notifier: prefs);

  static AppPreferences of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppPreferencesScope>()!.notifier!;
}
