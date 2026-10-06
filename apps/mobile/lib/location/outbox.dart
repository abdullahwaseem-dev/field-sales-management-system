import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../core/api_client.dart';

/// Durable offline queue (SQLite): location pings and other writes (e.g. share logs) wait here until
/// the network is back (FR-LOC-04). Pings carry device-generated IDs, so re-sending is idempotent.
class Outbox extends ChangeNotifier {
  Database? _db;
  int pendingPings = 0;
  bool _flushing = false;

  Future<Database> _open() async {
    return _db ??= await openDatabase(
      p.join(await getDatabasesPath(), 'sfms_outbox.db'),
      version: 1,
      onCreate: (db, _) async {
        await db.execute('''CREATE TABLE ping (
          ping_id TEXT PRIMARY KEY, recorded_at TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL,
          accuracy REAL, speed REAL, heading REAL, provider TEXT, is_mock INTEGER NOT NULL DEFAULT 0)''');
        await db.execute('''CREATE TABLE request (
          id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL)''');
      },
    );
  }

  Future<void> addPing(Map<String, Object?> ping) async {
    final db = await _open();
    await db.insert('ping', ping, conflictAlgorithm: ConflictAlgorithm.ignore);
    await _count();
  }

  Future<void> addRequest(String path, Map<String, Object?> body) async {
    final db = await _open();
    await db.insert('request', {'path': path, 'body': jsonEncode(body), 'created_at': DateTime.now().toUtc().toIso8601String()});
  }

  Future<void> _count() async {
    final db = await _open();
    pendingPings = Sqflite.firstIntValue(await db.rawQuery('SELECT count(*) FROM ping')) ?? 0;
    notifyListeners();
  }

  /// Sends queued pings (in batches) and queued requests. Stops quietly when offline.
  Future<void> flush(ApiClient api) async {
    if (_flushing) return;
    _flushing = true;
    try {
      final db = await _open();
      while (true) {
        final rows = await db.query('ping', orderBy: 'recorded_at', limit: 200);
        if (rows.isEmpty) break;
        await api.post('/location/pings', {
          'pings': [
            for (final r in rows)
              {
                'pingId': r['ping_id'],
                'recordedAt': r['recorded_at'],
                'lat': r['lat'],
                'lng': r['lng'],
                if (r['accuracy'] != null) 'accuracyM': r['accuracy'],
                if (r['speed'] != null && (r['speed'] as num) >= 0) 'speedMps': r['speed'],
                if (r['heading'] != null && (r['heading'] as num) >= 0 && (r['heading'] as num) < 360) 'headingDeg': r['heading'],
                if (r['provider'] != null) 'provider': r['provider'],
                'isMock': r['is_mock'] == 1,
              }
          ],
        });
        // Accepted and permanently rejected (e.g. outside the shift) are both done with.
        await db.delete('ping', where: 'ping_id IN (${List.filled(rows.length, '?').join(',')})', whereArgs: [for (final r in rows) r['ping_id']]);
      }
      final reqs = await db.query('request', orderBy: 'id', limit: 50);
      for (final r in reqs) {
        try {
          await api.post(r['path'] as String, jsonDecode(r['body'] as String));
        } on ApiException catch (e) {
          if (e.isNetwork) rethrow;
          // Non-network failures (validation, gone) cannot succeed later: drop them.
        }
        await db.delete('request', where: 'id = ?', whereArgs: [r['id']]);
      }
    } on ApiException catch (e) {
      if (!e.isNetwork && e.status != 401) debugPrint('outbox flush: $e');
    } finally {
      _flushing = false;
      await _count();
    }
  }
}
