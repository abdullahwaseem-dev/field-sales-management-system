import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app/app_header.dart';
import '../../core/app_scope.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_localizations.dart';

/// Sign in with employee ID + password, or a one-time code to the registered mobile (FR-AUTH-01).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _id = TextEditingController();
  final _secret = TextEditingController();
  bool _useCode = false, _codeSent = false, _busy = false;
  String? _devCode, _error;
  bool _otp = false;
  Map<String, dynamic>? _demo;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    AppScope.of(context).session.authMethods().then((m) {
      if (mounted) setState(() => (_otp = m['otp'] == true, _demo = m['demo'] as Map<String, dynamic>?));
    });
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = errorMessage(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final session = AppScope.of(context).session;
    final id = _id.text.trim();
    return Scaffold(
      appBar: const AppHeader(showNotifications: false),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(ZonaSpace.s6),
          children: [
            const SizedBox(height: ZonaSpace.s8),
            Center(
              child: ZonaLogo(
                Localizations.localeOf(context).languageCode == 'ar' ? ZonaLogoKind.wordmarkAr : ZonaLogoKind.wordmark,
                height: 56,
                semanticLabel: l10n.appBrandLabel,
              ),
            ),
            const SizedBox(height: ZonaSpace.s8),
            Text(l10n.authTitle, style: t.headline),
            const SizedBox(height: ZonaSpace.s1),
            Text(l10n.authSubtitle, style: t.body.copyWith(color: c.fgMuted)),
            if (_demo != null) ...[
              const SizedBox(height: ZonaSpace.s4),
              Container(
                padding: const EdgeInsets.all(ZonaSpace.s3),
                decoration: BoxDecoration(
                  color: c.brandSubtle,
                  borderRadius: BorderRadius.circular(ZonaRadius.md),
                  border: Border.all(color: c.brand),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(l10n.demoBadge, style: t.label),
                    const SizedBox(height: ZonaSpace.s1),
                    Text(l10n.demoAppHint('${(_demo!['repIds'] as List).first}', '${_demo!['password']}'), style: t.caption),
                    const SizedBox(height: ZonaSpace.s2),
                    ZonaButton(
                      label: l10n.demoUseDemo,
                      variant: ZonaButtonVariant.secondary,
                      onPressed: () {
                        final ids = (_demo!['repIds'] as List).cast<String>();
                        setState(() {
                          _id.text = ids[DateTime.now().millisecond % ids.length];
                          _secret.text = '${_demo!['password']}';
                          _useCode = false;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: ZonaSpace.s6),
            ZonaInput(
              controller: _id,
              label: l10n.fieldEmployeeId,
              icon: LucideIcons.idCard,
              ltr: true,
              textCapitalization: TextCapitalization.characters,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: ZonaSpace.s4),
            if (!_useCode)
              ZonaInput(controller: _secret, label: l10n.fieldPassword, icon: LucideIcons.lock, obscure: true, ltr: true)
            else if (_codeSent)
              ZonaInput(
                controller: _secret,
                label: l10n.authCodeLabel,
                icon: LucideIcons.keyRound,
                ltr: true,
                keyboardType: TextInputType.number,
                hint: l10n.authCodeSent,
              ),
            if (_devCode != null) ...[
              const SizedBox(height: ZonaSpace.s2),
              Text(l10n.authDevCode(_devCode!), style: t.caption.copyWith(color: c.statusInfoFg)),
            ],
            if (_error != null) ...[const SizedBox(height: ZonaSpace.s3), Text(_error!, style: t.body.copyWith(color: c.statusAbsentFg))],
            const SizedBox(height: ZonaSpace.s6),
            if (!_useCode)
              ZonaButton(
                label: l10n.authSignIn,
                loading: _busy,
                expand: true,
                onPressed: id.isEmpty ? null : () => _run(() => session.loginWithPassword(id, _secret.text)),
              )
            else if (!_codeSent)
              ZonaButton(
                label: l10n.authSendCode,
                loading: _busy,
                expand: true,
                onPressed: id.isEmpty
                    ? null
                    : () => _run(() async {
                        _devCode = await session.requestOtp(id);
                        _codeSent = true;
                      }),
              )
            else
              ZonaButton(label: l10n.authSignIn, loading: _busy, expand: true, onPressed: () => _run(() => session.loginWithOtp(id, _secret.text.trim()))),
            const SizedBox(height: ZonaSpace.s3),
            if (!_otp)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: ZonaSpace.s2),
                child: Text(
                  l10n.authForgotAdmin,
                  textAlign: TextAlign.center,
                  style: t.caption.copyWith(color: c.fgMuted),
                ),
              ),
            if (_otp)
              ZonaButton(
                label: _useCode ? l10n.authUsePassword : l10n.authUseCode,
                variant: ZonaButtonVariant.ghost,
                expand: true,
                onPressed: () => setState(() {
                  _useCode = !_useCode;
                  _codeSent = false;
                  _devCode = null;
                  _secret.clear();
                  _error = null;
                }),
              ),
            if (_otp)
              ZonaButton(
                label: l10n.authForgot,
                variant: ZonaButtonVariant.ghost,
                expand: true,
                onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ResetPasswordScreen(initialId: id))),
              ),
          ],
        ),
      ),
    );
  }
}

/// Self-service password reset with a one-time code (FR-AUTH-02).
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.initialId});
  final String initialId;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  late final _id = TextEditingController(text: widget.initialId);
  final _code = TextEditingController();
  final _password = TextEditingController();
  bool _sent = false, _busy = false;
  String? _devCode, _error;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final session = AppScope.of(context).session;
    Future<void> run(Future<void> Function() f) async {
      setState(() {
        _busy = true;
        _error = null;
      });
      try {
        await f();
      } catch (e) {
        if (mounted) setState(() => _error = errorMessage(context, e));
      } finally {
        if (mounted) setState(() => _busy = false);
      }
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.authResetTitle)),
      body: ListView(
        padding: const EdgeInsets.all(ZonaSpace.s6),
        children: [
          ZonaInput(controller: _id, label: l10n.fieldEmployeeId, icon: LucideIcons.idCard, ltr: true),
          if (_sent) ...[
            const SizedBox(height: ZonaSpace.s4),
            ZonaInput(
              controller: _code,
              label: l10n.authCodeLabel,
              icon: LucideIcons.keyRound,
              ltr: true,
              keyboardType: TextInputType.number,
              hint: l10n.authCodeSent,
            ),
            if (_devCode != null)
              Padding(
                padding: const EdgeInsets.only(top: ZonaSpace.s2),
                child: Text(l10n.authDevCode(_devCode!), style: t.caption.copyWith(color: c.statusInfoFg)),
              ),
            const SizedBox(height: ZonaSpace.s4),
            ZonaInput(controller: _password, label: l10n.authNewPassword, icon: LucideIcons.lock, obscure: true, ltr: true, hint: l10n.authPasswordRule),
          ],
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: ZonaSpace.s3),
              child: Text(_error!, style: t.body.copyWith(color: c.statusAbsentFg)),
            ),
          const SizedBox(height: ZonaSpace.s6),
          if (!_sent)
            ZonaButton(
              label: l10n.authSendCode,
              loading: _busy,
              expand: true,
              onPressed: () => run(() async {
                _devCode = await session.requestOtp(_id.text.trim(), purpose: 'password_reset');
                _sent = true;
              }),
            )
          else
            ZonaButton(
              label: l10n.actionSave,
              loading: _busy,
              expand: true,
              onPressed: () => run(() async {
                await session.resetPassword(_id.text.trim(), _code.text.trim(), _password.text);
                if (!context.mounted) return;
                showZonaToast(context, variant: ZonaToastVariant.success, title: l10n.authResetDone);
                Navigator.of(context).pop();
              }),
            ),
        ],
      ),
    );
  }
}

/// Forced change on first sign-in (FR-AUTH-02); nothing else is reachable until it's done.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final session = AppScope.of(context).session;
    return Scaffold(
      appBar: const AppHeader(showNotifications: false),
      body: ListView(
        padding: const EdgeInsets.all(ZonaSpace.s6),
        children: [
          Text(l10n.authChangeTitle, style: t.headline),
          const SizedBox(height: ZonaSpace.s1),
          Text(l10n.authChangeBody, style: t.body.copyWith(color: c.fgMuted)),
          const SizedBox(height: ZonaSpace.s6),
          ZonaInput(controller: _current, label: l10n.authCurrentPassword, icon: LucideIcons.lock, obscure: true, ltr: true),
          const SizedBox(height: ZonaSpace.s4),
          ZonaInput(controller: _next, label: l10n.authNewPassword, icon: LucideIcons.lockKeyhole, obscure: true, ltr: true, hint: l10n.authPasswordRule),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: ZonaSpace.s3),
              child: Text(_error!, style: t.body.copyWith(color: c.statusAbsentFg)),
            ),
          const SizedBox(height: ZonaSpace.s6),
          ZonaButton(
            label: l10n.authSaveContinue,
            loading: _busy,
            expand: true,
            onPressed: () async {
              setState(() {
                _busy = true;
                _error = null;
              });
              try {
                await session.changePassword(_current.text, _next.text);
              } catch (e) {
                if (mounted) setState(() => _error = errorMessage(context, e));
              } finally {
                if (mounted) setState(() => _busy = false);
              }
            },
          ),
          ZonaButton(label: l10n.authSignOut, variant: ZonaButtonVariant.ghost, expand: true, onPressed: session.logout),
        ],
      ),
    );
  }
}
