/// Build-time configuration. Release builds take the API from a config file:
///   flutter build apk --release --dart-define-from-file=config/production.json   (private, git-ignored)
///   flutter build apk --release --dart-define-from-file=config/demo.json         (public demo)
/// Debug builds reach a locally running API from the Android emulator (10.0.2.2 is the host).
abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000/api/v1');
  static const appVersion = '1.1.0';
}
