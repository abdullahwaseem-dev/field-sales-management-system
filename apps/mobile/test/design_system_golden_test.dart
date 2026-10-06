// Renders the Phase 0 mobile design-system compositions in all four combinations
// (EN/AR × light/dark) with the real fonts, producing the review screenshots:
//   flutter test --update-goldens test/design_system_golden_test.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sfms_mobile/app/preferences.dart';
import 'package:sfms_mobile/design_system/design_system.dart';
import 'package:sfms_mobile/design_system/gallery/gallery.dart';
import 'package:sfms_mobile/features/sales/sales.dart';
import 'package:sfms_mobile/l10n/app_localizations.dart';

const _width = 390.0;
const _dpr = 2.0;

Future<void> _loadFonts() async {
  Future<ByteData> asset(String path) => rootBundle.load(path);
  final inter = FontLoader('Inter');
  final plex = FontLoader('IBM Plex Sans Arabic');
  for (final w in ['Regular', 'Medium', 'SemiBold', 'Bold']) {
    inter.addFont(asset('assets/fonts/inter/Inter-$w.ttf'));
    plex.addFont(asset('assets/fonts/ibm-plex-sans-arabic/IBMPlexSansArabic-$w.ttf'));
  }
  final lucide = FontLoader('packages/lucide_icons_flutter/Lucide')
    ..addFont(asset('packages/lucide_icons_flutter/assets/lucide.ttf'));
  await Future.wait([inter.load(), plex.load(), lucide.load()]);
}

Widget _harness(Brightness brightness, Locale locale, Widget home) => MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ZonaTheme.build(brightness, locale),
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: true),
        child: AppPreferencesScope(
          prefs: AppPreferences.memory(locale: locale),
          child: ZonaLocaleSettings(digits: ZonaDigits.western, child: child!),
        ),
      ),
      home: home,
    );

Widget _sheet(Widget child, Key key) => Scaffold(
      body: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Padding(key: key, padding: const EdgeInsets.all(ZonaSpace.s4), child: child),
      ),
    );

void main() {
  setUpAll(_loadFonts);

  const combos = {
    'en-light': (Brightness.light, Locale('en')),
    'en-dark': (Brightness.dark, Locale('en')),
    'ar-light': (Brightness.light, Locale('ar')),
    'ar-dark': (Brightness.dark, Locale('ar')),
  };

  for (final MapEntry(key: combo, value: (brightness, locale)) in combos.entries) {
    final screens = <String, (Widget Function(Key), double?)>{
      'home': ((_) => const HomeComposition(), 844),
      'hero-states': ((k) => _sheet(const HeroStatesSheet(), k), null),
      'components': ((k) => _sheet(const ComponentsSheet(), k), null),
      'sales-target': ((k) => _sheet(const _SalesTargets(), k), null),
    };
    for (final MapEntry(key: name, value: (builder, fixedHeight)) in screens.entries) {
      testWidgets('$name · $combo', (tester) async {
        // flutter_test draws shadows unblurred by default; the review screenshots need the real look.
        debugDisableShadows = false;
        final contentKey = GlobalKey();
        tester.view.devicePixelRatio = _dpr;
        tester.view.physicalSize = Size(_width * _dpr, (fixedHeight ?? 4000) * _dpr);
        addTearDown(tester.view.reset);

        await tester.pumpWidget(_harness(brightness, locale, builder(contentKey)));
        await tester.runAsync(() async {
          for (final element in find.byType(Image).evaluate()) {
            await precacheImage((element.widget as Image).image, element);
          }
        });
        await tester.pump();

        if (fixedHeight == null) {
          // Size the image to the content so nothing is clipped and there is no empty tail.
          final height = tester.getSize(find.byKey(contentKey)).height;
          tester.view.physicalSize = Size(_width * _dpr, height * _dpr);
          await tester.pump();
        }
        await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/$name-$combo.png'));
        debugDisableShadows = true; // flutter_test requires debug paint flags restored by the end of the body
      });
    }
  }
}

/// The home-screen target card: mid-month on duty, target reached, and no target while off duty.
class _SalesTargets extends StatelessWidget {
  const _SalesTargets();

  @override
  Widget build(BuildContext context) {
    Map<String, dynamic> data(Map<String, dynamic>? target, int visits, int orders) =>
        {'month': '2026-10', 'target': target, 'done': {'visits': visits, 'orders': orders}, 'onDuty': true, 'activities': const []};
    return Column(children: [
      SalesTargetCard(data: data({'visits': 40, 'orders': 12, 'note': 'Focus on Olaya hypermarkets this month.'}, 23, 5), onDuty: true, onLogged: () {}),
      const SizedBox(height: ZonaSpace.s4),
      SalesTargetCard(data: data({'visits': 30, 'orders': 8, 'note': null}, 31, 8), onDuty: true, onLogged: () {}),
      const SizedBox(height: ZonaSpace.s4),
      SalesTargetCard(data: data(null, 2, 0), onDuty: false, onLogged: () {}),
    ]);
  }
}
