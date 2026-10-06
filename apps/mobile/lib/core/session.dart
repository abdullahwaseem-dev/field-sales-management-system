import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';

import 'api_client.dart';
import 'config.dart';

enum SessionState { loading, signedOut, mustChangePassword, signedIn }

class Employee {
  Employee({required this.id, required this.role, required this.nameEn, required this.nameAr});
  final String id;
  final String role;
  final String nameEn;
  final String nameAr;
  String name(String lang) => lang == 'ar' ? nameAr : nameEn;
}

/// Sign-in state. Tokens live in the platform keystore/keychain (flutter_secure_storage), never in
/// plain preferences. A stable per-install ID identifies the device to the server (FR-AUTH-03).
class SessionController extends ChangeNotifier implements TokenProvider {
  SessionController(this.api) {
    api.tokens = this;
  }

  final ApiClient api;
  static const _store = FlutterSecureStorage();
  static const _kAccess = 'access', _kRefresh = 'refresh', _kEmployee = 'employee', _kInstall = 'install_id';

  SessionState state = SessionState.loading;
  Employee? employee;
  String? _access;
  String? _refresh;
  Map<String, dynamic>? _device;

  @override
  String? get accessToken => _access;

  Future<void> restore() async {
    _access = await _store.read(key: _kAccess);
    _refresh = await _store.read(key: _kRefresh);
    final emp = await _store.read(key: _kEmployee);
    if (_refresh == null || emp == null) {
      state = SessionState.signedOut;
    } else {
      final parts = emp.split('|');
      employee = Employee(id: parts[0], role: parts[1], nameEn: parts[2], nameAr: parts[3]);
      state = parts.length > 4 && parts[4] == '1' ? SessionState.mustChangePassword : SessionState.signedIn;
    }
    notifyListeners();
  }

  Future<Map<String, dynamic>> device() async {
    if (_device != null) return _device!;
    var installId = await _store.read(key: _kInstall);
    if (installId == null) {
      installId = const Uuid().v4();
      await _store.write(key: _kInstall, value: installId);
    }
    final info = DeviceInfoPlugin();
    String model = 'unknown', os = Platform.operatingSystemVersion;
    if (Platform.isAndroid) {
      final a = await info.androidInfo;
      model = '${a.manufacturer} ${a.model}';
      os = 'Android ${a.version.release} (API ${a.version.sdkInt})';
    } else if (Platform.isIOS) {
      final i = await info.iosInfo;
      model = i.utsname.machine;
      os = 'iOS ${i.systemVersion}';
    }
    return _device = {
      'installId': installId,
      'platform': Platform.isIOS ? 'ios' : 'android',
      'model': model,
      'osVersion': os,
      'appVersion': AppConfig.appVersion,
    };
  }

  Future<void> loginWithPassword(String employeeId, String password) async {
    final res = await api.post('/auth/login', {'employeeId': employeeId, 'password': password, 'client': 'mobile', 'device': await device()});
    await _accept(res as Map<String, dynamic>);
  }

  /// Whether this deployment can deliver one-time codes (no SMS gateway → password only).
  Future<bool> otpAvailable() async => (await authMethods())['otp'] == true;

  /// What this deployment offers: `otp` (bool) and, on the public demo, `demo` sign-ins.
  Future<Map<String, dynamic>> authMethods() async {
    try {
      return await api.get('/auth/methods') as Map<String, dynamic>;
    } catch (_) {
      return const {};
    }
  }

  Future<String?> requestOtp(String employeeId, {String purpose = 'login'}) async {
    final res = await api.post('/auth/otp/request', {'employeeId': employeeId, 'purpose': purpose}) as Map<String, dynamic>;
    return res['devCode'] as String?;
  }

  Future<void> loginWithOtp(String employeeId, String code) async {
    final res = await api.post('/auth/otp/verify', {'employeeId': employeeId, 'code': code, 'client': 'mobile', 'device': await device()});
    await _accept(res as Map<String, dynamic>);
  }

  Future<void> resetPassword(String employeeId, String code, String newPassword) async {
    await api.post('/auth/password/reset', {'employeeId': employeeId, 'code': code, 'newPassword': newPassword});
  }

  Future<void> changePassword(String current, String next) async {
    final res = await api.post('/auth/password', {'currentPassword': current, 'newPassword': next});
    await _accept(res as Map<String, dynamic>);
  }

  Future<void> logout() async {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Signing out locally even if the server is unreachable.
    }
    await _clear();
  }

  @override
  Future<bool> refresh() async {
    if (_refresh == null) return false;
    try {
      final res = await api.post('/auth/refresh', {'refreshToken': _refresh}) as Map<String, dynamic>;
      await _accept(res, notify: false);
      return true;
    } on ApiException catch (e) {
      return e.isNetwork; // offline: keep the session, the request fails normally
    }
  }

  @override
  Future<void> onSessionEnded() => _clear();

  Future<void> _accept(Map<String, dynamic> res, {bool notify = true}) async {
    _access = res['accessToken'] as String;
    _refresh = res['refreshToken'] as String;
    final e = res['employee'] as Map<String, dynamic>;
    final mustChange = res['mustChangePassword'] == true;
    employee = Employee(id: e['employeeId'] as String, role: e['role'] as String, nameEn: e['nameEn'] as String, nameAr: e['nameAr'] as String);
    await _store.write(key: _kAccess, value: _access);
    await _store.write(key: _kRefresh, value: _refresh);
    await _store.write(key: _kEmployee, value: [employee!.id, employee!.role, employee!.nameEn, employee!.nameAr, mustChange ? '1' : '0'].join('|'));
    state = mustChange ? SessionState.mustChangePassword : SessionState.signedIn;
    if (notify) notifyListeners();
  }

  Future<void> _clear() async {
    _access = null;
    _refresh = null;
    employee = null;
    await _store.delete(key: _kAccess);
    await _store.delete(key: _kRefresh);
    await _store.delete(key: _kEmployee);
    state = SessionState.signedOut;
    notifyListeners();
  }
}
