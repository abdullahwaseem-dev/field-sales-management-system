// Phase 2 end-to-end tests: the API against a fresh test database (migrations + seed).
// Time is pinned per request with `x-test-now` (honoured only in NODE_ENV=test).
//   npm test -w @sfms/api
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { sql } from 'kysely';
import { type Db, KYSELY } from '../db/database';
import { JobsService } from '../jobs/jobs';
import { createApp } from '../main';

const ROOT = `${__dirname}/../../../..`;
const testUrl = process.env.TEST_DATABASE_URL!;
let app: INestApplication;
let base = '';
let db: Db;

// Riyadh is UTC+3. Local 09:00–12:00 window = 06:00–09:00Z; Late after 12:15 local = 09:15Z.
const at = (date: string, utcTime: string) => `${date}T${utcTime}:00Z`;
const OLAYA = { lat: 24.6935, lng: 46.685, accuracyM: 12 };
const TAHLIA = { lat: 21.545, lng: 39.16, accuracyM: 10 };
const DAMMAM = { lat: 26.4332, lng: 50.1031, accuracyM: 10 };

interface Res { status: number; body: any }
async function call(method: string, path: string, opts: { token?: string; body?: unknown; now?: string } = {}): Promise<Res> {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.now ? { 'x-test-now': opts.now } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const device = (id: string) => ({ installId: `test-install-${id}`, platform: 'android', model: 'Test' });
async function login(employeeId: string, client: 'mobile' | 'portal' = 'mobile', install = employeeId) {
  const r = await call('POST', '/auth/login', { body: { employeeId, password: 'Zona@2026', client, ...(client === 'mobile' ? { device: device(install) } : {}) } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body as { accessToken: string; refreshToken: string; mustChangePassword: boolean };
}
async function consented(employeeId: string) {
  const s = await login(employeeId);
  const r = await call('POST', '/consent/accept', { token: s.accessToken, body: { version: '2026-10' } });
  assert.equal(r.status, 200);
  return s.accessToken;
}

before(async () => {
  const env = { ...process.env, PATH: `/opt/homebrew/opt/postgresql@18/bin:${process.env.PATH}`, DATABASE_URL: testUrl, DBMATE_NO_DUMP_SCHEMA: 'true' };
  execSync('npx dbmate drop && npx dbmate create && npx dbmate up', { cwd: ROOT, env, stdio: 'pipe' });
  execSync('node db/seed/seed.mjs', { cwd: ROOT, env, stdio: 'pipe' });
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  db = app.get<Db>(KYSELY);
  // Employees "joined" a while ago so absence marking has history to work with.
  await db.updateTable('employee').set({ created_at: new Date('2026-09-01T00:00:00Z') }).execute();
});

after(async () => {
  await app?.close();
});

describe('authentication', () => {
  test('reps use the app only; the single administrator uses the portal only', async () => {
    assert.equal((await call('POST', '/auth/login', { body: { employeeId: 'ZN-10471', password: 'Zona@2026', client: 'portal' } })).status, 403);
    assert.equal((await call('POST', '/auth/login', { body: { employeeId: 'ZN-00001', password: 'Zona@2026', client: 'mobile', device: device('admin') } })).status, 403);
    assert.ok((await login('ZN-00001', 'portal')).accessToken);
  });

  test('wrong passwords lock the account after 5 attempts', async () => {
    for (let i = 0; i < 5; i++) {
      assert.equal((await call('POST', '/auth/login', { body: { employeeId: 'ZN-10471', password: 'wrong', client: 'mobile', device: device('ZN-10471') } })).status, 401);
    }
    const locked = await call('POST', '/auth/login', { body: { employeeId: 'ZN-10471', password: 'Zona@2026', client: 'mobile', device: device('ZN-10471') } });
    assert.equal(locked.status, 423);
    assert.equal(locked.body.code, 'ACCOUNT_LOCKED');
    await db.updateTable('credential').set({ locked_until: null, failed_attempts: 0 }).where('employee_id', '=', 'ZN-10471').execute();
  });

  test('refresh tokens rotate: the old one stops working', async () => {
    const s = await login('ZN-00001', 'portal');
    const r1 = await call('POST', '/auth/refresh', { body: { refreshToken: s.refreshToken } });
    assert.equal(r1.status, 200);
    assert.equal((await call('POST', '/auth/refresh', { body: { refreshToken: s.refreshToken } })).status, 401);
  });

  test('signing in on a second phone ends the first phone session (FR-AUTH-03)', async () => {
    const first = await login('ZN-10219', 'mobile', 'phone-a');
    await login('ZN-10219', 'mobile', 'phone-b');
    const r = await call('GET', '/me', { token: first.accessToken });
    assert.equal(r.status, 401);
    assert.equal(r.body.code, 'SESSION_ENDED');
  });

  test('first sign-in forces a password change before anything else (FR-AUTH-02)', async () => {
    const s = await login('ZN-10633');
    assert.equal(s.mustChangePassword, true);
    assert.equal((await call('GET', '/attendance/today', { token: s.accessToken })).body.code, 'PASSWORD_CHANGE_REQUIRED');
    assert.equal((await call('POST', '/auth/password', { token: s.accessToken, body: { currentPassword: 'Zona@2026', newPassword: 'short' } })).body.code, 'PASSWORD_WEAK');
    const changed = await call('POST', '/auth/password', { token: s.accessToken, body: { currentPassword: 'Zona@2026', newPassword: 'NewPassw0rd2026' } });
    assert.equal(changed.status, 200);
    assert.equal((await call('GET', '/attendance/today', { token: changed.body.accessToken })).status, 200);
  });

  test('one-time code sign-in (dev echo until an SMS gateway is configured)', async () => {
    assert.deepEqual((await call('GET', '/auth/methods')).body, { password: true, otp: true, demo: null });
    const req = await call('POST', '/auth/otp/request', { body: { employeeId: 'ZN-00001' } });
    assert.equal(req.status, 202);
    assert.match(req.body.devCode, /^\d{6}$/);
    assert.equal((await call('POST', '/auth/otp/verify', { body: { employeeId: 'ZN-00001', code: '000000', client: 'portal' } })).status, 401);
    const ok = await call('POST', '/auth/otp/verify', { body: { employeeId: 'ZN-00001', code: req.body.devCode, client: 'portal' } });
    assert.equal(ok.status, 200);
  });
});

describe('check-in and the 8-hour rule', () => {
  test('consent is required before the first check-in', async () => {
    const s = await login('ZN-10388');
    const r = await call('POST', '/attendance/check-in', { token: s.accessToken, now: at('2026-10-05', '07:00'), body: { location: OLAYA } });
    assert.equal(r.status, 412);
    assert.equal(r.body.code, 'CONSENT_REQUIRED');
  });

  test('anywhere in 09:00–12:00 is on time; full 8 hours is not short', async () => {
    const t = await consented('ZN-10427');
    const inR = await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-05', '07:30'), body: { location: OLAYA } }); // 10:30 local
    assert.equal(inR.status, 200, JSON.stringify(inR.body));
    assert.equal(inR.body.state, 'on_duty');
    assert.equal(inR.body.event.status, 'present');
    assert.equal(inR.body.event.insideGeofence, true);
    assert.equal((await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-05', '07:31'), body: { location: OLAYA } })).body.code, 'ALREADY_CHECKED_IN');
    const out = await call('POST', '/attendance/check-out', { token: t, now: at('2026-10-05', '15:35'), body: { location: OLAYA } });
    assert.equal(out.status, 200);
    assert.equal(out.body.event.workedMinutes, 485);
    assert.equal(out.body.event.isShortHours, false);
  });

  test('after 12:00 + 15 min grace is Late; within grace is on time', async () => {
    const t = await consented('ZN-10427');
    const late = await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-06', '09:20'), body: { location: OLAYA } }); // 12:20 local
    assert.equal(late.body.event.status, 'late');
    assert.equal(late.body.event.lateMinutes, 20);
    await call('POST', '/attendance/check-out', { token: t, now: at('2026-10-06', '17:30'), body: { confirmShort: true } });
    const grace = await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-07', '09:10'), body: { location: OLAYA } }); // 12:10 local
    assert.equal(grace.body.event.status, 'present');
    await call('POST', '/attendance/check-out', { token: t, now: at('2026-10-07', '17:20'), body: {} });
  });

  test('checking out before 8 hours needs confirmation, then the day is flagged short', async () => {
    const t = await consented('ZN-10471');
    await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-05', '08:52'), body: { location: OLAYA } }); // 11:52 local
    const ask = await call('POST', '/attendance/check-out', { token: t, now: at('2026-10-05', '15:30'), body: {} });
    assert.equal(ask.status, 409);
    assert.equal(ask.body.code, 'SHORT_DAY_CONFIRMATION_REQUIRED');
    assert.equal(ask.body.remainingMinutes, 82);
    const ok = await call('POST', '/attendance/check-out', { token: t, now: at('2026-10-05', '15:30'), body: { confirmShort: true } });
    assert.equal(ok.body.event.status, 'present');
    assert.equal(ok.body.event.shortfallMinutes, 82);
    assert.equal(ok.body.event.isShortHours, true);
  });
});

describe('fraud detection (never auto-confirmed)', () => {
  test('outside the geofence (flag mode) → Suspected Fake + administrator notified', async () => {
    const t = await consented('ZN-10512');
    const r = await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-05', '07:00'), body: { location: OLAYA } }); // Riyadh, assigned Jeddah
    assert.equal(r.body.event.status, 'suspected_fake');
    const signals = await db.selectFrom('fraud_signal').select('type').where('event_id', '=', r.body.event.eventId).execute();
    assert.deepEqual(signals.map((s) => s.type), ['outside_geofence']);
    const sup = await db.selectFrom('notification').select('type').where('recipient_id', '=', 'ZN-00001').where('type', '=', 'fraud_flagged').execute();
    assert.equal(sup.length, 1);
  });

  test('mock location and GPS/network mismatch are flagged at check-in', async () => {
    const t = await consented('ZN-10590');
    const r = await call('POST', '/attendance/check-in', {
      token: t, now: at('2026-10-05', '07:00'),
      body: { location: { ...TAHLIA, isMock: true }, networkLocation: { lat: 21.62, lng: 39.2 } },
    });
    assert.equal(r.body.event.status, 'suspected_fake');
    const types = (await db.selectFrom('fraud_signal').select('type').where('event_id', '=', r.body.event.eventId).execute()).map((s) => s.type).sort();
    assert.deepEqual(types, ['gps_network_mismatch', 'mock_location']);
  });

  test('the administrator reviews with a remark; the decision is in the status trail', async () => {
    const { eventId } = (await db.selectFrom('attendance_event').select('event_id as eventId').where('employee_id', '=', 'ZN-10590').executeTakeFirstOrThrow());
    const rep = await consented('ZN-10633').catch(() => '');
    if (rep) assert.equal((await call('POST', `/attendance/events/${eventId}/review`, { token: rep, body: { decision: 'confirm', remark: 'not allowed' } })).status, 403);
    const sup = (await login('ZN-00001', 'portal')).accessToken;
    assert.equal((await call('POST', `/attendance/events/${eventId}/review`, { token: sup, body: { decision: 'confirm', remark: 'no' } })).status, 400);
    const ok = await call('POST', `/attendance/events/${eventId}/review`, { token: sup, now: at('2026-10-05', '08:00'), body: { decision: 'confirm', remark: 'Mock-location app confirmed with the rep' } });
    assert.equal(ok.body.status, 'confirmed_fake');
    const detail = await call('GET', `/attendance/events/${eventId}`, { token: sup });
    assert.deepEqual(detail.body.trail.map((x: any) => x.cause), ['check_in', 'fraud_flagged', 'review_confirmed']);
    assert.equal(detail.body.trail.at(-1).actor_id, 'ZN-00001');
  });
});

describe('location tracking', () => {
  test('pings during the shift are stored; before check-in rejected; retries are idempotent', async () => {
    const t = await consented('ZN-10295');
    await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-05', '06:30'), body: { location: DAMMAM } });
    const p1 = randomUUID();
    const pings = [
      { pingId: randomUUID(), recordedAt: at('2026-10-05', '05:00'), lat: 26.43, lng: 50.1 },
      { pingId: p1, recordedAt: at('2026-10-05', '06:35'), ...DAMMAM },
      { pingId: randomUUID(), recordedAt: at('2026-10-05', '06:40'), lat: 26.434, lng: 50.104, accuracyM: 15 },
    ];
    const r = await call('POST', '/location/pings', { token: t, body: { pings } });
    assert.equal(r.body.accepted, 2);
    assert.deepEqual(r.body.rejected.map((x: any) => x.reason), ['OUTSIDE_SHIFT']);
    const again = await call('POST', '/location/pings', { token: t, body: { pings: [pings[1]] } });
    assert.equal(again.body.accepted, 1);
    const { n } = await db.selectFrom('location_ping').select((eb) => eb.fn.countAll<number>().as('n')).where('ping_id', '=', p1).executeTakeFirstOrThrow();
    assert.equal(Number(n), 1);
  });

  test('impossible speed between pings flags the shift', async () => {
    const t = (await login('ZN-10295')).accessToken;
    const r = await call('POST', '/location/pings', {
      token: t,
      body: { pings: [{ pingId: randomUUID(), recordedAt: at('2026-10-05', '06:45'), lat: 24.69, lng: 46.68, accuracyM: 10 }] }, // Riyadh, 5 min after Dammam
    });
    assert.equal(r.body.accepted, 1);
    const ev = await db.selectFrom('attendance_event').select('status').where('employee_id', '=', 'ZN-10295').where('work_date', '=', '2026-10-05').executeTakeFirstOrThrow();
    assert.equal(ev.status, 'suspected_fake');
  });

  test('live map: the administrator sees everyone on duty; position disappears at check-out', async () => {
    const admin = (await login('ZN-00001', 'portal')).accessToken;
    const live = await call('GET', '/location/live', { token: admin });
    assert.ok(live.body.some((r: any) => r.employee_id === 'ZN-10295'));
    const t = (await login('ZN-10295')).accessToken;
    assert.equal((await call('GET', '/location/live', { token: t })).status, 403);
    await call('POST', '/attendance/check-out', { token: t, now: at('2026-10-05', '14:31'), body: { location: DAMMAM } });
    assert.ok(!(await call('GET', '/location/live', { token: admin })).body.some((r: any) => r.employee_id === 'ZN-10295'));
    const trail = await call('GET', '/location/trail?employeeId=ZN-10295&date=2026-10-05', { token: admin });
    assert.ok(trail.body.points.length >= 4);
  });
});

describe('register, leave, corrections, jobs', () => {
  test('register shows every rep, including those not checked in', async () => {
    const admin = (await login('ZN-00001', 'portal')).accessToken;
    const r = await call('GET', '/attendance/register?date=2026-10-05', { token: admin });
    assert.deepEqual(r.body.rows.map((x: any) => x.employee_id).sort(), ['ZN-10219', 'ZN-10295', 'ZN-10388', 'ZN-10427', 'ZN-10471', 'ZN-10512', 'ZN-10590', 'ZN-10633']);
    assert.equal(r.body.rows.find((x: any) => x.employee_id === 'ZN-10388').event_id, null);
  });

  test('approved leave blocks check-in and turns absent days into leave', async () => {
    const rep = await consented('ZN-10388');
    const req = await call('POST', '/leave', { token: rep, now: at('2026-10-05', '06:00'), body: { startDate: '2026-10-07', endDate: '2026-10-08', reason: 'Family event' } });
    assert.equal(req.status, 201);
    assert.equal((await call('POST', '/leave', { token: rep, now: at('2026-10-05', '06:00'), body: { startDate: '2026-10-08', endDate: '2026-10-08', reason: 'Overlap' } })).body.code, 'OVERLAP');
    const sup = (await login('ZN-00001', 'portal')).accessToken;
    const ok = await call('POST', `/leave/${req.body.request_id}/decide`, { token: sup, now: at('2026-10-05', '08:00'), body: { approve: true } });
    assert.equal(ok.body.status, 'approved');
    const blocked = await call('POST', '/attendance/check-in', { token: rep, now: at('2026-10-07', '07:00'), body: { location: OLAYA } });
    assert.equal(blocked.body.code, 'ON_LEAVE');
  });

  test('absence job: working days without a record → Absent; leave days → On leave; weekends skipped', async () => {
    const jobs = app.get(JobsService);
    await jobs.markAbsences(new Date(at('2026-10-09', '10:00')), 7); // looks back over 2–8 Oct
    const rows = await db.selectFrom('attendance_event').select(['work_date', 'status']).where('employee_id', '=', 'ZN-10388').orderBy('work_date').execute();
    assert.deepEqual(rows, [
      { work_date: '2026-10-04', status: 'absent' },
      { work_date: '2026-10-05', status: 'absent' },
      { work_date: '2026-10-06', status: 'absent' },
      { work_date: '2026-10-07', status: 'on_leave' },
      { work_date: '2026-10-08', status: 'on_leave' },
    ]);
    const trail = await sql<{ cause: string }>`SELECT DISTINCT cause FROM attendance_status_change c JOIN attendance_event e USING (event_id) WHERE e.employee_id = 'ZN-10388'`.execute(db);
    assert.deepEqual(trail.rows.map((r) => r.cause).sort(), ['absent_marked', 'leave_approved']);
  });

  test('a correction request is applied by the administrator and recalculates the day', async () => {
    const rep = (await login('ZN-10388')).accessToken;
    const req = await call('POST', '/attendance/corrections', {
      token: rep, body: { workDate: '2026-10-06', requestedCheckInAt: at('2026-10-06', '06:10'), requestedCheckOutAt: at('2026-10-06', '14:20'), reason: 'Phone battery died, I was at the branch' },
    });
    assert.equal(req.status, 201, JSON.stringify(req.body));
    const sup = (await login('ZN-00001', 'portal')).accessToken;
    const d = await call('POST', `/attendance/corrections/${req.body.request_id}/decide`, { token: sup, now: at('2026-10-09', '08:00'), body: { approve: true, remark: 'Confirmed with branch manager' } });
    assert.equal(d.body.status, 'approved');
    const ev = await db.selectFrom('attendance_event').select(['status', 'worked_minutes', 'check_out_source']).where('employee_id', '=', 'ZN-10388').where('work_date', '=', '2026-10-06').executeTakeFirstOrThrow();
    assert.deepEqual(ev, { status: 'present', worked_minutes: 490, check_out_source: 'correction' });
  });

  test('shift timeout closes forgotten shifts at the last on-duty point', async () => {
    const t = (await login('ZN-10427')).accessToken;
    await call('POST', '/attendance/check-in', { token: t, now: at('2026-10-08', '06:30'), body: { location: OLAYA } });
    await call('POST', '/location/pings', { token: t, body: { pings: [{ pingId: randomUUID(), recordedAt: at('2026-10-08', '13:00'), ...OLAYA }] } });
    await app.get(JobsService).closeTimedOutShifts(new Date(at('2026-10-08', '19:00')));
    const ev = await db.selectFrom('attendance_event').select(['check_out_source', 'worked_minutes']).where('employee_id', '=', 'ZN-10427').where('work_date', '=', '2026-10-08').executeTakeFirstOrThrow();
    assert.deepEqual(ev, { check_out_source: 'shift_timeout', worked_minutes: 390 });
  });

  test('my month: counts follow the agreed definitions', async () => {
    const t = (await login('ZN-10427')).accessToken;
    const m = await call('GET', '/attendance/me?month=2026-10', { token: t });
    assert.deepEqual(
      { present: m.body.counts.presentDays, late: m.body.counts.lateCount, short: m.body.counts.shortHoursCount },
      { present: 4, late: 1, short: 1 }, // only the timed-out 8 Oct shift (390 min) is short
    );
  });
});

describe('catalogue', () => {
  test('lists published items, logs shares idempotently, serves the public share page', async () => {
    const t = (await login('ZN-10427')).accessToken;
    const list = await call('GET', '/catalogue', { token: t });
    assert.equal(list.body.length, 4);
    const item = list.body[0];
    const shareId = randomUUID();
    const body = { shareId, channel: 'whatsapp', recipient: '+966551112222', sharedAt: new Date().toISOString() };
    assert.equal((await call('POST', `/catalogue/${item.product_id}/shares`, { token: t, body })).status, 200);
    assert.equal((await call('POST', `/catalogue/${item.product_id}/shares`, { token: t, body })).status, 200);
    const rows = await db.selectFrom('share_event').select(['recipient']).where('share_id', '=', shareId).execute();
    assert.equal(rows.length, 1);
    assert.ok(rows[0]!.recipient!.startsWith('v1.'), 'recipient is encrypted at rest');
    const page = await fetch(`${base}/p/${item.share_slug}`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /lang="ar"/);
  });
});

describe('monthly summary (Phase 5)', () => {
  const NOV2 = at('2026-11-02', '08:00'); // October has ended

  test('finalize is blocked while suspected check-ins remain; reviews clear them', async () => {
    const hr = (await login('ZN-00001', 'portal')).accessToken;
    const v = await call('POST', '/summary/2026/10/compute', { token: hr, now: NOV2 });
    assert.equal(v.status, 200, JSON.stringify(v.body));
    assert.ok(v.body.rows.length >= 8);
    assert.ok(v.body.pendingSuspected >= 2);
    const blocked = await call('POST', '/summary/2026/10/finalize', { token: hr, now: NOV2 });
    assert.equal(blocked.body.code, 'SUSPECTED_PENDING');
    for (const e of (await call('GET', '/attendance/suspected', { token: hr })).body) {
      const r = await call('POST', `/attendance/events/${e.event_id}/review`, { token: hr, now: NOV2, body: { decision: 'clear', remark: 'Reviewed with supervisor, genuine' } });
      assert.equal(r.status, 200);
    }
  });

  test('counts come from the day records; finalizing freezes the month', async () => {
    const hr = (await login('ZN-00001', 'portal')).accessToken;
    const f = await call('POST', '/summary/2026/10/finalize', { token: hr, now: NOV2 });
    assert.equal(f.status, 200, JSON.stringify(f.body));
    assert.equal(f.body.period.status, 'finalized');
    const faisal = f.body.rows.find((r: any) => r.employee_id === 'ZN-10427');
    assert.deepEqual(
      { present: faisal.present_days, late: faisal.late_count, short: faisal.short_hours_count, status: faisal.status, version: faisal.version },
      { present: 4, late: 1, short: 1, status: 'finalized', version: 1 },
    );
    // Any change to a finalized month's attendance is refused by the database.
    const ev = await db.selectFrom('attendance_event').select('event_id').where('employee_id', '=', 'ZN-10427').where('work_date', '=', '2026-10-05').executeTakeFirstOrThrow();
    const c = await call('POST', '/summary/2026/10/corrections', { token: hr, now: NOV2, body: { eventId: ev.event_id, status: 'late', reason: 'Testing the lock' } });
    assert.equal(c.status, 409);
  });

  test('HRMS API: API key required; finalized counts only, keyed by employee ID', async () => {
    const admin = (await login('ZN-00001', 'portal')).accessToken;
    const client = await call('POST', '/admin/api-clients', { token: admin, body: { name: 'HRMS' } });
    assert.equal(client.status, 201);
    const url = `${base}/api/v1/hrms/v1/attendance-summaries?year=2026&month=10`;
    assert.equal((await fetch(url)).status, 401);
    const res = await fetch(url, { headers: { 'x-api-key': client.body.apiKey } });
    assert.equal(res.status, 200);
    const body = await res.json() as any;
    const row = body.employees.find((e: any) => e.employeeId === 'ZN-10427');
    assert.deepEqual(Object.keys(row).sort(), ['absentDays', 'confirmedFakeCount', 'employeeId', 'finalizedAt', 'lateCount', 'leaveDays', 'presentDays', 'shortHoursCount', 'version']);
  });

  test('re-open (with a reason) allows a correction; re-finalizing bumps the version', async () => {
    const hr = (await login('ZN-00001', 'portal')).accessToken;
    assert.equal((await call('POST', '/summary/2026/10/reopen', { token: hr, now: NOV2, body: { reason: 'no' } })).status, 400);
    const r = await call('POST', '/summary/2026/10/reopen', { token: hr, now: NOV2, body: { reason: 'Late correction from branch' } });
    assert.equal(r.body.period.status, 'reopened');
    const ev = await db.selectFrom('attendance_event').select('event_id').where('employee_id', '=', 'ZN-10427').where('work_date', '=', '2026-10-05').executeTakeFirstOrThrow();
    const c = await call('POST', '/summary/2026/10/corrections', { token: hr, now: NOV2, body: { eventId: ev.event_id, status: 'late', reason: 'Branch confirmed late arrival' } });
    assert.equal(c.status, 200, JSON.stringify(c.body));
    const f = await call('POST', '/summary/2026/10/finalize', { token: hr, now: NOV2 });
    const faisal = f.body.rows.find((x: any) => x.employee_id === 'ZN-10427');
    assert.deepEqual({ late: faisal.late_count, version: faisal.version }, { late: 2, version: 2 });
    const trail = await db.selectFrom('attendance_status_change').select(['cause', 'actor_id', 'reason']).where('event_id', '=', ev.event_id).where('cause', '=', 'month_correction').executeTakeFirstOrThrow();
    assert.deepEqual(trail, { cause: 'month_correction', actor_id: 'ZN-00001', reason: 'Branch confirmed late arrival' });
  });

  test('exports: CSV with BOM (Arabic-safe) and Excel', async () => {
    const hr = (await login('ZN-00001', 'portal')).accessToken;
    const csv = await fetch(`${base}/api/v1/summary/2026/10/export?format=csv&lang=ar`, { headers: { authorization: `Bearer ${hr}` } });
    const bytes = new Uint8Array(await csv.arrayBuffer()); // text() would strip the BOM
    assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], 'UTF-8 BOM so Excel opens Arabic correctly');
    assert.match(new TextDecoder().decode(bytes), /الرقم الوظيفي/);
    const xlsx = await fetch(`${base}/api/v1/summary/2026/10/export?format=xlsx`, { headers: { authorization: `Bearer ${hr}` } });
    assert.equal(xlsx.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    assert.ok((await xlsx.arrayBuffer()).byteLength > 1000);
  });
});

describe('single administrator: accounts and sales targets', () => {
  test('the administrator creates reps with an ID and password of their choosing (no self-signup)', async () => {
    const admin = (await login('ZN-00001', 'portal')).accessToken;
    const { branch_id } = await db.selectFrom('branch').select('branch_id').where('code', '=', 'RUH').executeTakeFirstOrThrow();
    const body = { employeeId: 'zn-20001', nameEn: 'Test Rep', nameAr: 'مندوب تجريبي', branchId: branch_id, password: 'weak', mustChangePassword: false };
    assert.equal((await call('POST', '/admin/employees', { token: admin, body })).body.code, 'PASSWORD_WEAK');
    const r = await call('POST', '/admin/employees', { token: admin, body: { ...body, password: 'Field2026Sales', role: 'super_admin' } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const e = await db.selectFrom('employee').select(['employee_id', 'role']).where('employee_id', '=', 'ZN-20001').executeTakeFirstOrThrow();
    assert.deepEqual(e, { employee_id: 'ZN-20001', role: 'sales_rep' }, 'every account created in the portal is a rep');
    const s = await call('POST', '/auth/login', { body: { employeeId: 'ZN-20001', password: 'Field2026Sales', client: 'mobile', device: device('ZN-20001') } });
    assert.equal(s.status, 200);
    assert.equal(s.body.mustChangePassword, false);
    assert.equal((await call('POST', '/auth/register', { body: { employeeId: 'X1', password: 'x' } })).status, 404);
    assert.equal((await call('PATCH', '/admin/employees/ZN-00001', { token: admin, body: { status: 'inactive' } })).body.code, 'ADMIN_REQUIRED');
  });

  test('targets: set for everyone, adjust one, reps see progress; only on-duty visits/orders count', async () => {
    const admin = (await login('ZN-00001', 'portal')).accessToken;
    const now = at('2026-12-06', '07:00'); // October is finalized by the summary tests above
    const bulk = await call('POST', '/admin/targets/bulk', { token: admin, now, body: { month: '2026-12', visits: 40, orders: 12, overwrite: true } });
    assert.deepEqual(bulk.body, { applied: 9, skipped: 0 });
    assert.equal((await call('PUT', '/admin/targets/ZN-10471/2026-12', { token: admin, body: { visits: 0, orders: 0 } })).status, 400);
    assert.equal((await call('PUT', '/admin/targets/ZN-00001/2026-12', { token: admin, body: { visits: 5, orders: 1 } })).body.code, 'NOT_A_REP');
    assert.equal((await call('PUT', '/admin/targets/ZN-10471/2026-12', { token: admin, body: { visits: 50, orders: 20, note: 'New area' } })).status, 200);
    const again = await call('POST', '/admin/targets/bulk', { token: admin, now, body: { month: '2026-12', visits: 1, orders: 1 } });
    assert.deepEqual(again.body, { applied: 0, skipped: 9 }, 'bulk never overwrites unless asked');

    const rep = (await login('ZN-10471')).accessToken;
    const visit = { activityId: randomUUID(), kind: 'visit', customerName: 'Panda Olaya', ...OLAYA };
    assert.equal((await call('POST', '/sales/activities', { token: rep, now: at('2026-12-06', '08:00'), body: visit })).body.code, 'NOT_ON_DUTY');
    await call('POST', '/consent/accept', { token: rep, body: { version: '2026-10' } });
    const ci = await call('POST', '/attendance/check-in', { token: rep, now, body: { location: OLAYA } });
    assert.equal(ci.status, 200, JSON.stringify(ci.body));
    assert.equal((await call('POST', '/sales/activities', { token: rep, now: at('2026-12-06', '08:00'), body: visit })).status, 201);
    assert.equal((await call('POST', '/sales/activities', { token: rep, now: at('2026-12-06', '08:00'), body: visit })).body.duplicate, true, 'retries are safe');
    await call('POST', '/sales/activities', { token: rep, now: at('2026-12-06', '08:00'), body: { activityId: randomUUID(), kind: 'order', customerName: 'Danube Hittin', note: '12 cartons' } });
    const mistake = randomUUID();
    await call('POST', '/sales/activities', { token: rep, now: at('2026-12-06', '08:00'), body: { activityId: mistake, kind: 'order', customerName: 'Typo' } });
    assert.equal((await call('POST', `/admin/sales/activities/${mistake}/void`, { token: admin, body: { reason: 'Logged twice' } })).status, 200);

    const mine = await call('GET', '/sales/me?month=2026-12', { token: rep, now });
    assert.deepEqual({ target: mine.body.target.visits, orders: mine.body.target.orders, done: mine.body.done, onDuty: mine.body.onDuty },
      { target: 50, orders: 20, done: { visits: 1, orders: 1 }, onDuty: true });
    const n = await db.selectFrom('notification').select('message_key').where('recipient_id', '=', 'ZN-10471').where('type', '=', 'target_set').execute();
    assert.equal(n.length, 2);
    const board = await call('GET', '/admin/targets?month=2026-12', { token: admin });
    const reem = board.body.find((x: any) => x.employee_id === 'ZN-10471');
    assert.deepEqual([reem.visits_target, reem.visits_done, reem.orders_target, reem.orders_done], [50, 1, 20, 1]);
    assert.equal((await call('GET', '/admin/targets', { token: rep })).status, 403);
  });
});
