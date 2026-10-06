import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

/// Error from the API (RFC 7807 problem+json) or the network. `code` maps to a localized message.
class ApiException implements Exception {
  ApiException(this.status, this.code, [this.extra = const {}]);
  final int status;
  final String code;
  final Map<String, dynamic> extra;

  bool get isNetwork => code == 'NETWORK';

  @override
  String toString() => 'ApiException($status, $code)';
}

/// Token pair holder and refresher supplied by the session.
abstract interface class TokenProvider {
  String? get accessToken;
  Future<bool> refresh();
  Future<void> onSessionEnded();
}

/// Thin JSON client: auth header, one shared refresh on 401, typed errors, timeouts.
class ApiClient {
  ApiClient(this.baseUrl, {http.Client? client}) : _http = client ?? http.Client();

  final String baseUrl;
  final http.Client _http;
  TokenProvider? tokens;
  Future<bool>? _refreshing;

  Future<dynamic> get(String path) => _send('GET', path);
  Future<dynamic> post(String path, [Object? body]) => _send('POST', path, body);
  Future<dynamic> patch(String path, [Object? body]) => _send('PATCH', path, body);
  Future<dynamic> put(String path, [Object? body]) => _send('PUT', path, body);

  Future<dynamic> _send(String method, String path, [Object? body, bool retried = false]) async {
    final req = http.Request(method, Uri.parse('$baseUrl$path'))
      ..headers['content-type'] = 'application/json'
      ..headers['accept'] = 'application/json';
    final token = tokens?.accessToken;
    if (token != null) req.headers['authorization'] = 'Bearer $token';
    if (body != null) req.body = jsonEncode(body);

    http.Response res;
    try {
      res = await http.Response.fromStream(await _http.send(req).timeout(const Duration(seconds: 20)));
    } on SocketException {
      throw ApiException(0, 'NETWORK');
    } on TimeoutException {
      throw ApiException(0, 'NETWORK');
    } on http.ClientException {
      throw ApiException(0, 'NETWORK');
    }

    if (res.statusCode == 401 && !retried && tokens != null && !path.startsWith('/auth/')) {
      _refreshing ??= tokens!.refresh().whenComplete(() => _refreshing = null);
      if (await _refreshing!) return _send(method, path, body, true);
      await tokens!.onSessionEnded();
    }
    final decoded = res.body.isEmpty ? null : jsonDecode(utf8.decode(res.bodyBytes));
    if (res.statusCode >= 400) {
      final map = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
      throw ApiException(res.statusCode, (map['code'] as String?) ?? 'HTTP_${res.statusCode}', map);
    }
    return decoded;
  }
}
