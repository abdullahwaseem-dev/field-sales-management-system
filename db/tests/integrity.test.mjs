// Phase 1 database integrity tests — every rule the database itself enforces.
// Runs against TEST_DATABASE_URL (rebuilt from the migrations, including a full down/up cycle).
//   npm run db:test
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { after, before, describe, test } from 'node:test';
import 'dotenv/config';
import pg from 'pg';

const url = process.env.TEST_DATABASE_URL;
const env = { ...process.env, PATH: `/opt/homebrew/opt/postgresql@18/bin:${process.env.PATH}`, DATABASE_URL: url, DBMATE_NO_DUMP_SCHEMA: 'true' };
const dbmate = (cmd) => execSync(`npx dbmate ${cmd}`, { env, stdio: 'pipe' }).toString();

const pool = new pg.Pool({ connectionString: url, max: 4 });

/** Runs `fn` in a transaction that is always rolled back, so tests never leak state. */
async function tx(fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    return await fn(c);
  } finally {
    await c.query('ROLLBACK');
    c.release();
  }
}
const cause = (c, value, extra = {}) =>
  Promise.all([
    c.query("SELECT set_config('sfms.change_cause', $1, true)", [value]),
    ...Object.entries(extra).map(([k, v]) => c.query('SELECT set_config($1, $2, true)', [`sfms.${k}`, v])),
  ]);

let configId;
const REP = 'ZN-T0001', REP2 = 'ZN-T0002', ADMIN = 'ZN-T0100';
const SUP = ADMIN, HR = ADMIN; // single-admin model: the one administrator reviews and finalizes

async function newEvent(c, { employee = REP, date = '2026-10-05', status = 'present', checkIn = '2026-10-05T06:10:00Z' } = {}) {
  await cause(c, status === 'absent' ? 'absent_marked' : 'check_in');
  const { rows: [e] } = await c.query(
    `INSERT INTO attendance_event (employee_id, work_date, config_id, window_start_at, latest_start_at,
       required_work_minutes, check_in_at, check_in_lat, check_in_lng, status)
     VALUES ($1, $2, $3, $2::date + time '06:00', $2::date + time '09:00', 480, $4, $5, $6, $7) RETURNING *`,
    [employee, date, configId, checkIn, checkIn ? 24.6935 : null, checkIn ? 46.685 : null, status],
  );
  return e;
}

before(async () => {
  // Fresh test database, then prove every migration also rolls back cleanly.
  dbmate('drop');
  dbmate('create');
  dbmate('up');
  const count = execSync('ls db/migrations/*.sql | wc -l').toString().trim();
  for (let i = 0; i < Number(count); i++) dbmate('rollback');
  dbmate('up');

  const c = await pool.connect();
  try {
    const { rows: [b] } = await c.query("INSERT INTO branch (code, name_en, name_ar) VALUES ('RUH', 'Riyadh', 'الرياض') RETURNING branch_id");
    const { rows: [t] } = await c.query("INSERT INTO team (branch_id, name_en, name_ar) VALUES ($1, 'Riyadh North', 'شمال الرياض') RETURNING team_id", [b.branch_id]);
    for (const [id, role] of [[ADMIN, 'super_admin'], [REP, 'sales_rep'], [REP2, 'sales_rep']]) {
      await c.query(
        'INSERT INTO employee (employee_id, full_name_en, full_name_ar, role, branch_id, team_id) VALUES ($1, $1, $1, $2, $3, $4)',
        [id, role, b.branch_id, t.team_id],
      );
    }
    const { rows: [cfg] } = await c.query("INSERT INTO attendance_config (scope, effective_from) VALUES ('global', '2026-01-01') RETURNING config_id");
    configId = cfg.config_id;
    await c.query("INSERT INTO attendance_config (scope, team_id, grace_minutes, effective_from) VALUES ('team', $1, 5, '2026-06-01')", [t.team_id]);
    const { rows: [g] } = await c.query(
      "INSERT INTO geofence (name_en, name_ar, type, center, radius_m) VALUES ('Olaya', 'العليا', 'circle', 'SRID=4326;POINT(46.685 24.6935)', 200) RETURNING geofence_id");
    await c.query("INSERT INTO geofence_assignment (geofence_id, branch_id, valid_from) VALUES ($1, $2, '2026-01-01')", [g.geofence_id, b.branch_id]);
  } finally {
    c.release();
  }
});

after(() => pool.end());

describe('schema', () => {
  test('has no salary, payroll, deduction or currency fields anywhere', async () => {
    const { rows } = await pool.query(`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (column_name ~* '(salary|payroll|deduction|payslip|wage|currency|price|amount|cost)'
          OR table_name ~* '(salary|payroll|deduction|payslip|wage|currency|price)')`);
    assert.deepEqual(rows, []);
  });
});

describe('attendance status rules', () => {
  test('a status change without a declared cause is refused', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await c.query("SELECT set_config('sfms.change_cause', '', true)");
      await assert.rejects(c.query("UPDATE attendance_event SET status = 'late' WHERE event_id = $1", [e.event_id]), /without a declared cause/);
    }));

  test('every status change writes an immutable trail row', () =>
    tx(async (c) => {
      const e = await newEvent(c, { status: 'late' });
      const { rows } = await c.query('SELECT from_status, to_status, cause FROM attendance_status_change WHERE event_id = $1', [e.event_id]);
      assert.deepEqual(rows, [{ from_status: null, to_status: 'late', cause: 'check_in' }]);
      await assert.rejects(c.query('UPDATE attendance_status_change SET reason = $1', ['x']), /append-only/);
    }));

  test('Confirmed Fake is never automatic: only from Suspected Fake, with a human review', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await cause(c, 'review_confirmed', { actor_id: SUP, reason: 'mock app' });
      await c.query('SAVEPOINT s');
      await assert.rejects(
        c.query("UPDATE attendance_event SET status = 'confirmed_fake', reviewed_by = $2, reviewed_at = now(), review_notes = 'x' WHERE event_id = $1", [e.event_id, SUP]),
        /only follow suspected_fake/);
      await c.query('ROLLBACK TO s');

      const { rows: [sig] } = await c.query("INSERT INTO fraud_signal (event_id, phase, type) VALUES ($1, 'check_in', 'mock_location') RETURNING signal_id", [e.event_id]);
      await cause(c, 'fraud_flagged', { fraud_signal_id: sig.signal_id });
      await c.query("UPDATE attendance_event SET status = 'suspected_fake' WHERE event_id = $1", [e.event_id]);

      await cause(c, 'review_confirmed', { actor_id: SUP, reason: 'mock app' });
      await c.query('SAVEPOINT s2');
      await assert.rejects(c.query("UPDATE attendance_event SET status = 'confirmed_fake' WHERE event_id = $1", [e.event_id]), /violates check constraint|human review/);
      await c.query('ROLLBACK TO s2');

      await c.query(
        "UPDATE attendance_event SET status = 'confirmed_fake', reviewed_by = $2, reviewed_at = now(), review_notes = 'Mock-location app confirmed' WHERE event_id = $1",
        [e.event_id, SUP]);
      const { rows } = await c.query('SELECT to_status, cause, actor_id FROM attendance_status_change WHERE event_id = $1 ORDER BY created_at, change_id', [e.event_id]);
      assert.deepEqual(rows.map((r) => r.cause), ['check_in', 'fraud_flagged', 'review_confirmed']);
      assert.equal(rows.at(-1).actor_id, SUP);
    }));

  test('clearing a Suspected Fake also needs a review with a remark', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      const { rows: [sig] } = await c.query("INSERT INTO fraud_signal (event_id, phase, type) VALUES ($1, 'check_in', 'gps_network_mismatch') RETURNING signal_id", [e.event_id]);
      await cause(c, 'fraud_flagged', { fraud_signal_id: sig.signal_id });
      await c.query("UPDATE attendance_event SET status = 'suspected_fake' WHERE event_id = $1", [e.event_id]);
      await cause(c, 'review_cleared', { actor_id: SUP, reason: 'GPS drift' });
      await c.query('SAVEPOINT s');
      await assert.rejects(c.query("UPDATE attendance_event SET status = 'present' WHERE event_id = $1", [e.event_id]), /human review/);
      await c.query('ROLLBACK TO s');
      await c.query("UPDATE attendance_event SET status = 'present', reviewed_by = $2, reviewed_at = now(), review_notes = 'GPS drift near tower' WHERE event_id = $1", [e.event_id, SUP]);
    }));

  test('a rep cannot review their own attendance', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await assert.rejects(c.query('UPDATE attendance_event SET reviewed_by = $2, reviewed_at = now() WHERE event_id = $1', [e.event_id, REP]), /check constraint/);
    }));

  test('one attendance record per employee per day', () =>
    tx(async (c) => {
      await newEvent(c);
      await assert.rejects(newEvent(c), /duplicate key/);
    }));

  test('attendance records are never deleted', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await assert.rejects(c.query('DELETE FROM attendance_event WHERE event_id = $1', [e.event_id]), /never deleted/);
    }));
});

describe('8-hour rule', () => {
  test('short day: 6h 38m of 8h → 82 minutes short, status unchanged', () =>
    tx(async (c) => {
      const e = await newEvent(c, { checkIn: '2026-10-05T08:52:00Z' });
      const { rows: [r] } = await c.query(
        "UPDATE attendance_event SET check_out_at = '2026-10-05T15:30:00Z', check_out_source = 'employee', worked_minutes = 398 WHERE event_id = $1 RETURNING status, shortfall_minutes, is_short_hours",
        [e.event_id]);
      assert.deepEqual(r, { status: 'present', shortfall_minutes: 82, is_short_hours: true });
    }));

  test('full day: 8h 8m → no shortfall', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      const { rows: [r] } = await c.query(
        "UPDATE attendance_event SET check_out_at = '2026-10-05T14:18:00Z', check_out_source = 'employee', worked_minutes = 488 WHERE event_id = $1 RETURNING shortfall_minutes, is_short_hours",
        [e.event_id]);
      assert.deepEqual(r, { shortfall_minutes: 0, is_short_hours: false });
    }));

  test('team override applies from its effective date; global before it', async () => {
    const { rows: [{ team_id }] } = await pool.query('SELECT team_id FROM employee WHERE employee_id = $1', [REP]);
    const { rows: [early] } = await pool.query("SELECT (effective_attendance_config($1, '2026-03-01')).grace_minutes", [team_id]);
    const { rows: [late] } = await pool.query("SELECT (effective_attendance_config($1, '2026-10-05')).grace_minutes", [team_id]);
    assert.equal(early.grace_minutes, 15);
    assert.equal(late.grace_minutes, 5);
  });

  test('attendance configuration is insert-only (history is kept)', () =>
    tx(async (c) => {
      await assert.rejects(c.query('UPDATE attendance_config SET grace_minutes = 30'), /append-only/);
    }));
});

describe('location tracking only while on duty', () => {
  const ping = (c, e, at, id = crypto.randomUUID()) =>
    c.query('INSERT INTO location_ping (ping_id, employee_id, attendance_event_id, recorded_at, lat, lng) VALUES ($1, $2, $3, $4, 24.69, 46.68)',
      [id, e.employee_id, e.event_id, at]);

  test('pings inside the shift are stored in the monthly partition', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await ping(c, e, '2026-10-05T07:00:00Z');
      const { rows } = await c.query("SELECT tableoid::regclass::text AS part FROM location_ping WHERE attendance_event_id = $1", [e.event_id]);
      assert.equal(rows[0].part, 'location_ping_2026_10');
    }));

  test('pings before check-in or after check-out are refused (FR-LOC-03)', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await c.query('SAVEPOINT s');
      await assert.rejects(ping(c, e, '2026-10-05T05:00:00Z'), /outside the checked-in shift/);
      await c.query('ROLLBACK TO s');
      await c.query("UPDATE attendance_event SET check_out_at = '2026-10-05T14:20:00Z', check_out_source = 'employee', worked_minutes = 490 WHERE event_id = $1", [e.event_id]);
      await assert.rejects(ping(c, e, '2026-10-05T15:00:00Z'), /outside the checked-in shift/);
    }));

  test('a ping must belong to the employee who owns the shift', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await assert.rejects(ping(c, { ...e, employee_id: REP2 }, '2026-10-05T07:00:00Z'), /does not match/);
    }));

  test('the live-map position disappears at check-out', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      await c.query("INSERT INTO employee_live_location (employee_id, attendance_event_id, ping_id, recorded_at, lat, lng) VALUES ($1, $2, gen_random_uuid(), now(), 24.69, 46.68)", [REP, e.event_id]);
      await c.query("UPDATE attendance_event SET check_out_at = '2026-10-05T14:20:00Z', check_out_source = 'employee', worked_minutes = 490 WHERE event_id = $1", [e.event_id]);
      const { rowCount } = await c.query('SELECT 1 FROM employee_live_location WHERE employee_id = $1', [REP]);
      assert.equal(rowCount, 0);
    }));
});

describe('monthly lock', () => {
  test('a finalized month freezes attendance until HR re-opens it', () =>
    tx(async (c) => {
      const e = await newEvent(c, { date: '2026-09-14', checkIn: '2026-09-14T06:05:00Z' });
      await c.query("INSERT INTO attendance_period (year, month, status, finalized_by, finalized_at) VALUES (2026, 9, 'finalized', $1, now())", [HR]);
      await c.query('SAVEPOINT s');
      await assert.rejects(c.query("UPDATE attendance_event SET late_minutes = 1 WHERE event_id = $1", [e.event_id]), /finalized month/);
      await c.query('ROLLBACK TO s');
      await c.query("UPDATE attendance_period SET status = 'reopened', reopened_by = $1, reopened_at = now(), reopen_reason = 'Late correction' WHERE year = 2026 AND month = 9", [HR]);
      await c.query("UPDATE attendance_event SET late_minutes = 1 WHERE event_id = $1", [e.event_id]);
    }));
});

describe('audit log', () => {
  test('is hash-chained and append-only', () =>
    tx(async (c) => {
      await c.query("INSERT INTO audit_log (actor_type, action, entity, entity_id, after_value) VALUES ('system', 'create', 'employee', 'ZN-1', '{\"a\":1}')");
      await c.query("INSERT INTO audit_log (actor_id, actor_type, action, entity, entity_id, reason) VALUES ($1, 'employee', 'update', 'attendance_config', 'x', 'grace change')", [HR]);
      const { rows: [v] } = await c.query('SELECT audit_log_verify() AS broken');
      assert.equal(v.broken, null);
      await c.query('SAVEPOINT s');
      await assert.rejects(c.query("UPDATE audit_log SET reason = 'edited'"), /append-only/);
      await c.query('ROLLBACK TO s');
      await c.query('SAVEPOINT s2');
      await assert.rejects(c.query('DELETE FROM audit_log'), /append-only/);
      await c.query('ROLLBACK TO s2');
      await assert.rejects(c.query('TRUNCATE audit_log'), /append-only/);
    }));
});

describe('leave and geofences', () => {
  test('overlapping live leave requests are refused', () =>
    tx(async (c) => {
      await c.query("INSERT INTO leave_request (employee_id, start_date, end_date, reason) VALUES ($1, '2026-10-12', '2026-10-14', 'Family')", [REP]);
      await assert.rejects(
        c.query("INSERT INTO leave_request (employee_id, start_date, end_date, reason) VALUES ($1, '2026-10-14', '2026-10-15', 'Trip')", [REP]),
        /conflicting key value violates exclusion constraint/);
    }));

  test('geofence distance: 0 inside, metres to the edge outside', async () => {
    const { rows: [{ geofence_id }] } = await pool.query('SELECT geofence_id FROM geofence LIMIT 1');
    const { rows: [inside] } = await pool.query("SELECT geofence_distance_m($1, 'SRID=4326;POINT(46.6851 24.6936)') AS d", [geofence_id]);
    const { rows: [outside] } = await pool.query("SELECT geofence_distance_m($1, 'SRID=4326;POINT(46.685 24.6980)') AS d", [geofence_id]);
    assert.equal(inside.d, 0);
    assert.ok(outside.d > 280 && outside.d < 320, `≈300 m, got ${outside.d}`);
  });

  test('employees inherit geofences assigned to their branch', async () => {
    const { rows } = await pool.query("SELECT * FROM employee_geofences($1, '2026-10-05')", [REP]);
    assert.equal(rows.length, 1);
  });
});

describe('single administrator + sales targets', () => {
  /** Expects `q` to fail without aborting the surrounding test transaction. */
  const fails = async (c, q, re) => {
    await c.query('SAVEPOINT f');
    await assert.rejects(q(), re);
    await c.query('ROLLBACK TO SAVEPOINT f');
  };
  const newEmployee = (c, id, role) =>
    c.query("INSERT INTO employee (employee_id, full_name_en, full_name_ar, role, branch_id) SELECT $1, $1, $1, $2, branch_id FROM branch LIMIT 1", [id, role]);

  test('only one administrator account can exist', () =>
    tx(async (c) => {
      await fails(c, () => newEmployee(c, 'ZN-T0999', 'super_admin'), /employee_single_admin_idx/);
    }));

  test('no supervisor or HR tiers', () =>
    tx(async (c) => {
      await fails(c, () => newEmployee(c, 'ZN-T0998', 'sales_supervisor'), /employee_role_admin_or_rep/);
      await fails(c, () => newEmployee(c, 'ZN-T0997', 'hr_admin'), /employee_role_admin_or_rep/);
    }));

  test('a target is per calendar month and counts something', () =>
    tx(async (c) => {
      await fails(c, () => c.query("INSERT INTO sales_target (employee_id, month, visits_target, set_by) VALUES ($1, '2026-10-05', 10, $2)", [REP, ADMIN]), /check/);
      await fails(c, () => c.query("INSERT INTO sales_target (employee_id, month, set_by) VALUES ($1, '2026-10-01', $2)", [REP, ADMIN]), /check/);
      await c.query("INSERT INTO sales_target (employee_id, month, visits_target, orders_target, set_by) VALUES ($1, '2026-10-01', 40, 12, $2)", [REP, ADMIN]);
      await fails(c, () => c.query("INSERT INTO sales_target (employee_id, month, visits_target, set_by) VALUES ($1, '2026-10-01', 5, $2)", [REP, ADMIN]), /unique/);
    }));

  test('visits and orders are logged only during an open shift, never deleted, voided once', () =>
    tx(async (c) => {
      const e = await newEvent(c);
      const log = (id, at) => c.query(
        "INSERT INTO sales_activity (activity_id, employee_id, attendance_event_id, work_date, kind, customer_name, occurred_at) VALUES ($1, $2, $3, '2026-10-05', 'visit', 'Panda Olaya', $4)",
        [id, REP, e.event_id, at]);
      await fails(c, () => log('01990000-0000-7000-8000-000000000001', '2026-10-05T05:00:00Z'), /only while checked in/);
      await log('01990000-0000-7000-8000-000000000002', '2026-10-05T08:00:00Z');
      await fails(c, () => c.query("DELETE FROM sales_activity WHERE activity_id = '01990000-0000-7000-8000-000000000002'"), /never deleted/);
      await fails(c, () => c.query("UPDATE sales_activity SET kind = 'order' WHERE activity_id = '01990000-0000-7000-8000-000000000002'"), /only be voided/);
      await c.query("UPDATE sales_activity SET voided_at = now(), voided_by = $1, void_reason = 'duplicate' WHERE activity_id = '01990000-0000-7000-8000-000000000002'", [ADMIN]);
      await fails(c, () => c.query("UPDATE sales_activity SET void_reason = 'again' WHERE activity_id = '01990000-0000-7000-8000-000000000002'"), /only be voided/);

      await cause(c, 'check_out');
      await c.query("UPDATE attendance_event SET check_out_at = '2026-10-05T14:30:00Z', check_out_source = 'employee', worked_minutes = 500 WHERE event_id = $1", [e.event_id]);
      await fails(c, () => log('01990000-0000-7000-8000-000000000003', '2026-10-05T15:00:00Z'), /only while checked in/);
    }));
});
