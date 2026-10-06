import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:safe_device/safe_device.dart';
import 'package:uuid/uuid.dart';

import '../core/api_client.dart';
import 'outbox.dart';

enum LocationAccess { denied, whileInUse, always, serviceOff }

/// Debug-only escape hatch so development on an emulator isn't flagged as a rooted/emulated device.
const _allowEmulator = bool.fromEnvironment('ALLOW_EMULATOR');

/// Location for check-in and on-duty tracking. Tracking starts only after the server accepts a
/// check-in and stops at check-out — never off-shift (FR-LOC-03). On Android it runs as a foreground
/// service with a persistent, dismiss-proof notification (FR-LOC-02); on iOS as background updates
/// with the blue location indicator.
class TrackingService extends ChangeNotifier {
  TrackingService(this.api, this.outbox) {
    _connectivity = Connectivity().onConnectivityChanged.listen((r) {
      if (!r.contains(ConnectivityResult.none)) unawaited(outbox.flush(api));
    });
  }

  final ApiClient api;
  final Outbox outbox;
  StreamSubscription<Position>? _stream;
  late final StreamSubscription<List<ConnectivityResult>> _connectivity;
  DateTime? _lastPing;
  Duration _interval = const Duration(minutes: 3);

  bool get isTracking => _stream != null;

  Future<LocationAccess> access() async {
    if (!await Geolocator.isLocationServiceEnabled()) return LocationAccess.serviceOff;
    final p = await Geolocator.checkPermission();
    return switch (p) {
      LocationPermission.always => LocationAccess.always,
      LocationPermission.whileInUse => LocationAccess.whileInUse,
      _ => LocationAccess.denied,
    };
  }

  /// FR-AUTH-04: while-in-use first, then "Allow all the time" (Android opens the settings page).
  Future<LocationAccess> requestAlways() async {
    var p = await Geolocator.checkPermission();
    if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
    if (p == LocationPermission.whileInUse) {
      await Permission.locationAlways.request();
    }
    if (Platform.isAndroid) await Permission.notification.request(); // foreground-service notification (Android 13+)
    return access();
  }

  Future<void> openSettings() => Geolocator.openAppSettings();

  Future<Position> currentFix() => Geolocator.getCurrentPosition(
        locationSettings: Platform.isAndroid
            ? AndroidSettings(accuracy: LocationAccuracy.high, timeLimit: const Duration(seconds: 20))
            : AppleSettings(accuracy: LocationAccuracy.best, timeLimit: const Duration(seconds: 20)),
      );

  /// Network (cell/Wi-Fi) position on Android, compared with GPS on the server (FR-ATT-05).
  Future<Position?> networkFix() async {
    if (!Platform.isAndroid) return null;
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: AndroidSettings(forceLocationManager: true, accuracy: LocationAccuracy.low, timeLimit: const Duration(seconds: 8)),
      );
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, bool>> integrity() async {
    try {
      final rooted = await SafeDevice.isJailBroken;
      final real = await SafeDevice.isRealDevice;
      final mockSetting = Platform.isAndroid && await SafeDevice.isMockLocation;
      return {
        'rooted': rooted,
        'emulator': !real && !(kDebugMode && _allowEmulator),
        'developerMockSetting': mockSetting,
      };
    } catch (_) {
      return {};
    }
  }

  static Map<String, Object?> fixJson(Position p) => {
        'lat': p.latitude,
        'lng': p.longitude,
        'accuracyM': p.accuracy,
        'provider': 'fused',
        'isMock': p.isMocked,
      };

  Future<void> start({required int intervalSeconds, required String title, required String text}) async {
    if (_stream != null) return;
    _interval = Duration(seconds: intervalSeconds);
    final settings = Platform.isAndroid
        ? AndroidSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 0,
            intervalDuration: _interval,
            foregroundNotificationConfig: ForegroundNotificationConfig(
              notificationTitle: title,
              notificationText: text,
              notificationChannelName: title,
              enableWakeLock: true,
              setOngoing: true,
            ),
          )
        : AppleSettings(
            accuracy: LocationAccuracy.high,
            activityType: ActivityType.otherNavigation,
            pauseLocationUpdatesAutomatically: false,
            showBackgroundLocationIndicator: true,
            allowBackgroundLocationUpdates: true,
          );
    _stream = Geolocator.getPositionStream(locationSettings: settings).listen(_onPosition, onError: (Object e) => debugPrint('tracking: $e'));
    notifyListeners();
  }

  Future<void> stop() async {
    await _stream?.cancel();
    _stream = null;
    _lastPing = null;
    notifyListeners();
    await outbox.flush(api);
  }

  Future<void> _onPosition(Position p) async {
    final now = DateTime.now();
    // Battery-friendly: at most one ping per configured interval (2–5 min, FR-LOC-01).
    if (_lastPing != null && now.difference(_lastPing!) < _interval * 0.9) return;
    _lastPing = now;
    await outbox.addPing({
      'ping_id': const Uuid().v4(),
      'recorded_at': (p.timestamp).toUtc().toIso8601String(),
      'lat': p.latitude,
      'lng': p.longitude,
      'accuracy': p.accuracy,
      'speed': p.speed,
      'heading': p.heading,
      'provider': 'fused',
      'is_mock': p.isMocked ? 1 : 0,
    });
    unawaited(outbox.flush(api));
  }

  @override
  void dispose() {
    _connectivity.cancel();
    _stream?.cancel();
    super.dispose();
  }
}
