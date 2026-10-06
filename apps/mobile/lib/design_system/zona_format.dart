import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

import '../l10n/app_localizations.dart';

enum ZonaDigits { western, arabicIndic }

/// Per-user locale preferences that are not part of [Locale] itself.
class ZonaLocaleSettings extends InheritedWidget {
  const ZonaLocaleSettings({super.key, required this.digits, required super.child});

  /// Arabic-Indic digits apply to the Arabic UI only; English always uses 0-9.
  final ZonaDigits digits;

  static ZonaDigits digitsOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ZonaLocaleSettings>()?.digits ?? ZonaDigits.western;

  @override
  bool updateShouldNotify(ZonaLocaleSettings old) => old.digits != digits;
}

/// Locale-aware formatting. Never build dates, times or numbers by string concatenation.
class ZonaFormat {
  ZonaFormat._(this._locale, this._digits, this._l10n);

  factory ZonaFormat.of(BuildContext context) =>
      ZonaFormat._(Localizations.localeOf(context), ZonaLocaleSettings.digitsOf(context), AppLocalizations.of(context));

  final Locale _locale;
  final ZonaDigits _digits;
  final AppLocalizations _l10n;

  static const _western = '0123456789';
  static const _arabicIndic = '٠١٢٣٤٥٦٧٨٩';

  /// Normalises every digit to the user's choice (intl data may emit either system for Arabic).
  String digits(String s) {
    final toArabic = _locale.languageCode == 'ar' && _digits == ZonaDigits.arabicIndic;
    final from = toArabic ? _western : _arabicIndic;
    final to = toArabic ? _arabicIndic : _western;
    final b = StringBuffer();
    for (final ch in s.characters) {
      final i = from.indexOf(ch);
      b.write(i >= 0 ? to[i] : ch);
    }
    return b.toString();
  }

  String get _tag => _locale.languageCode == 'ar' ? 'ar' : 'en_GB';

  String number(num n) => digits(NumberFormat.decimalPattern(_tag).format(n));
  /// 12-hour clock with the locale's own am/pm markers (am/pm, ص/م), matching the portal.
  String time(DateTime d) => digits(DateFormat('h:mm a', _tag).format(d));
  String date(DateTime d) => digits(DateFormat.yMMMMd(_tag).format(d));
  String weekdayDate(DateTime d) => digits(DateFormat.MMMMEEEEd(_tag).format(d));
  String shortDate(DateTime d) => digits(DateFormat.MMMd(_tag).format(d));
  String monthYear(DateTime d) => digits(DateFormat.yMMMM(_tag).format(d));

  /// Distance with locale-aware units: "240 m" / "٢٤٠ م", "3.2 km" / "3.2 كم".
  String distance(num metres) {
    final ar = _locale.languageCode == 'ar';
    if (metres < 1000) return digits('${NumberFormat.decimalPattern(_tag).format(metres.round())} ${ar ? 'م' : 'm'}');
    return digits('${NumberFormat('#,##0.#', _tag).format(metres / 1000)} ${ar ? 'كم' : 'km'}');
  }

  String duration(Duration d) {
    final minutes = d.inMinutes.remainder(60);
    return digits(minutes == 0
        ? _l10n.durationH(d.inHours.toString())
        : _l10n.durationHm(d.inHours.toString(), minutes.toString()));
  }
}
