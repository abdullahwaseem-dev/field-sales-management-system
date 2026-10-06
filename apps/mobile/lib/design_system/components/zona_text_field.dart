import 'package:flutter/material.dart';

import '../../l10n/app_localizations.dart';
import '../generated/zona_tokens.g.dart';
import '../zona_theme.dart';

/// Labelled text field. [ltrValue] keeps inherently left-to-right values (phone, email, employee ID)
/// in LTR order while aligning them with the surrounding (possibly RTL) layout.
class ZonaTextField extends StatelessWidget {
  const ZonaTextField({
    super.key,
    required this.label,
    this.initialValue,
    this.hint,
    this.error,
    this.icon,
    this.ltrValue = false,
    this.required = false,
    this.keyboardType,
  });

  final String label;
  final String? initialValue;
  final String? hint;
  final String? error;
  final IconData? icon;
  final bool ltrValue;
  final bool required;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final l10n = AppLocalizations.of(context);
    final rtlLayout = Directionality.of(context) == TextDirection.rtl;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text.rich(
          TextSpan(text: label, children: [
            if (required) TextSpan(text: '  (${l10n.fieldRequired})', style: t.caption),
          ]),
          style: t.label,
        ),
        const SizedBox(height: ZonaSpace.s1_5),
        TextFormField(
          initialValue: initialValue,
          keyboardType: keyboardType,
          style: t.bodyLg,
          textDirection: ltrValue ? TextDirection.ltr : null,
          // An LTR value inside an RTL layout aligns to the layout's start edge (physical right).
          textAlign: ltrValue && rtlLayout ? TextAlign.right : TextAlign.start,
          decoration: InputDecoration(
            prefixIcon: icon == null ? null : Icon(icon, size: ZonaSize.iconMd),
            helperText: error == null ? hint : null,
            errorText: error,
            errorMaxLines: 2,
            helperMaxLines: 2,
            focusColor: c.focus,
          ),
        ),
      ],
    );
  }
}

/// Controller-based labelled input (forms that read their values). Same look as [ZonaTextField].
class ZonaInput extends StatefulWidget {
  const ZonaInput({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.icon,
    this.obscure = false,
    this.ltr = false,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.maxLines = 1,
    this.onChanged,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? icon;
  final bool obscure;
  final bool ltr;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final int maxLines;
  final ValueChanged<String>? onChanged;

  @override
  State<ZonaInput> createState() => _ZonaInputState();
}

class _ZonaInputState extends State<ZonaInput> {
  late bool _hidden = widget.obscure;

  @override
  Widget build(BuildContext context) {
    final t = ZonaText.of(context);
    final rtlLayout = Directionality.of(context) == TextDirection.rtl;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(widget.label, style: t.label),
      const SizedBox(height: ZonaSpace.s1_5),
      TextField(
        controller: widget.controller,
        obscureText: _hidden,
        keyboardType: widget.keyboardType,
        textCapitalization: widget.textCapitalization,
        maxLines: widget.obscure ? 1 : widget.maxLines,
        onChanged: widget.onChanged,
        style: t.bodyLg,
        textDirection: widget.ltr ? TextDirection.ltr : null,
        textAlign: widget.ltr && rtlLayout ? TextAlign.right : TextAlign.start,
        autocorrect: !widget.ltr,
        decoration: InputDecoration(
          prefixIcon: widget.icon == null ? null : Icon(widget.icon, size: ZonaSize.iconMd),
          helperText: widget.hint,
          helperMaxLines: 3,
          suffixIcon: widget.obscure
              ? IconButton(
                  onPressed: () => setState(() => _hidden = !_hidden),
                  icon: Icon(_hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: ZonaSize.iconMd),
                )
              : null,
        ),
      ),
    ]);
  }
}
