import 'package:flutter/material.dart';

import '../generated/zona_tokens.g.dart';

enum ZonaButtonVariant { primary, accent, secondary, ghost, danger }

/// Icon that points somewhere (arrow, chevron, back): mirrored in RTL. Clocks, pins and media never mirror.
class ZonaDirIcon extends StatelessWidget {
  const ZonaDirIcon(this.icon, {super.key, this.size, this.color});
  final IconData icon;
  final double? size;
  final Color? color;

  @override
  Widget build(BuildContext context) => Transform.flip(
        flipX: Directionality.of(context) == TextDirection.rtl,
        child: Icon(icon, size: size, color: color),
      );
}

class ZonaButton extends StatelessWidget {
  const ZonaButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ZonaButtonVariant.primary,
    this.icon,
    this.trailing,
    this.loading = false,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final ZonaButtonVariant variant;
  final IconData? icon;
  final Widget? trailing;
  final bool loading;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final c = ZonaColors.of(context);
    final child = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading)
          SizedBox.square(
            dimension: ZonaSize.iconSm,
            child: CircularProgressIndicator(strokeWidth: 2, color: c.fgDisabled),
          )
        else if (icon != null)
          Icon(icon, size: ZonaSize.iconMd),
        if (loading || icon != null) const SizedBox(width: ZonaSpace.s2),
        Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
        if (trailing != null) ...[const SizedBox(width: ZonaSpace.s2), trailing!],
      ],
    );
    final pressed = loading ? null : onPressed;
    final button = switch (variant) {
      ZonaButtonVariant.primary => FilledButton(onPressed: pressed, child: child),
      ZonaButtonVariant.accent => FilledButton(
          onPressed: pressed,
          style: FilledButton.styleFrom(backgroundColor: c.accentStrong, foregroundColor: c.onAccent),
          child: child,
        ),
      ZonaButtonVariant.danger => FilledButton(
          onPressed: pressed,
          style: FilledButton.styleFrom(backgroundColor: c.statusAbsentSolid, foregroundColor: c.onSolid),
          child: child,
        ),
      ZonaButtonVariant.secondary => OutlinedButton(onPressed: pressed, child: child),
      ZonaButtonVariant.ghost => TextButton(onPressed: pressed, child: child),
    };
    return Semantics(button: true, enabled: pressed != null, child: button);
  }
}
