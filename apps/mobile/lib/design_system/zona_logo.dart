import 'dart:math' as math;

import 'package:flutter/material.dart';

enum ZonaLogoKind { wordmark, wordmarkAr, lockup, mark }

/// The ZONA logo (interim raster, native resolution). Uses the brand's own reverse artwork on dark
/// surfaces; never mirrored in RTL, never recoloured, and never drawn larger than its native pixels.
class ZonaLogo extends StatelessWidget {
  const ZonaLogo(this.kind, {super.key, required this.height, this.semanticLabel});

  final ZonaLogoKind kind;
  final double height;
  final String? semanticLabel;

  static const _assets = {
    ZonaLogoKind.wordmark: ('zona-wordmark', 478, 109),
    ZonaLogoKind.wordmarkAr: ('zona-wordmark-ar', 286, 160),
    ZonaLogoKind.lockup: ('zona-lockup', 410, 93),
    ZonaLogoKind.mark: ('zona-mark', 119, 115),
  };

  @override
  Widget build(BuildContext context) {
    final (name, w, h) = _assets[kind]!;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final dpr = math.max(2.0, MediaQuery.devicePixelRatioOf(context));
    final shownHeight = math.min(height, h / dpr);
    return Image.asset(
      'assets/brand/$name${dark ? '-reverse' : ''}.png',
      height: shownHeight,
      width: shownHeight * w / h,
      semanticLabel: semanticLabel,
      excludeFromSemantics: semanticLabel == null,
      filterQuality: FilterQuality.medium,
      matchTextDirection: false,
    );
  }
}
