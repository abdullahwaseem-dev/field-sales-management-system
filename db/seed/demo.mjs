#!/usr/bin/env node
// Public demo layer, run after the development seed (with SEED_PASSWORD=ZonaDemo2026):
//   - nobody is forced to change the shared demo password;
//   - the simulated reps (ZN-1…) work staggered shifts round the clock, so the live map is never empty;
//   - each simulated rep has a phone on record and has accepted the tracking consent;
//   - five visitor rep accounts (DEMO-REP1…5) for people trying the Android app;
//   - last month's targets too, so month-to-month comparisons have data.
// Activity itself (check-ins, routes, visits, orders, leave) comes from the API's demo simulator.
import { hash } from '@node-rs/argon2';
import 'dotenv/config';
import pg from 'pg';

const PASSWORD = process.env.SEED_PASSWORD ?? 'ZonaDemo2026';
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
await db.query('BEGIN');

await db.query('UPDATE credential SET must_change_password = false');
// Accounts "joined" months ago, so absence marking and history reach back over the simulated weeks.
await db.query("UPDATE employee SET created_at = now() - interval '120 days'");

// Shift windows 2.5 h apart starting 00:30 Riyadh time: about three reps are on duty at any hour.
const { rows: reps } = await db.query("SELECT employee_id FROM employee WHERE role = 'sales_rep' AND employee_id LIKE 'ZN-1%' ORDER BY employee_id");
for (const [i, { employee_id }] of reps.entries()) {
  const start = 30 + i * 150;
  const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  await db.query("UPDATE employee SET shift_start = $2, latest_start = $3, weekly_off_days = '{}' WHERE employee_id = $1", [employee_id, hhmm(start), hhmm(start + 120)]);
  const { rows: [d] } = await db.query(
    "INSERT INTO device (employee_id, platform, install_id, model, os_version, app_version) VALUES ($1, 'android', $2, 'Galaxy A55', 'Android 15', '1.1.0') RETURNING device_id",
    [employee_id, `demo-sim-${employee_id}`]);
  await db.query("INSERT INTO tracking_consent (employee_id, consent_version, device_id, app_version) VALUES ($1, '2026-10', $2, '1.1.0')", [employee_id, d.device_id]);
}

const { rows: [ruh] } = await db.query("SELECT b.branch_id, t.team_id FROM branch b JOIN team t ON t.branch_id = b.branch_id WHERE b.code = 'RUH' LIMIT 1");
const passwordHash = await hash(PASSWORD);
for (let i = 1; i <= 5; i++) {
  const id = `DEMO-REP${i}`;
  await db.query(
    `INSERT INTO employee (employee_id, full_name_en, full_name_ar, role, branch_id, team_id, shift_start, latest_start, weekly_off_days)
     VALUES ($1, $2, $3, 'sales_rep', $4, $5, '00:00', '23:59', '{}')`,
    [id, `Demo visitor ${i}`, `زائر تجريبي ${i}`, ruh.branch_id, ruh.team_id]);
  await db.query('INSERT INTO credential (employee_id, password_hash, must_change_password) VALUES ($1, $2, false)', [id, passwordHash]);
  await db.query('INSERT INTO user_preference (employee_id) VALUES ($1)', [id]);
}

await db.query(`
  INSERT INTO sales_target (employee_id, month, visits_target, orders_target, note, set_by)
  SELECT employee_id, (date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh') - interval '1 month')::date, 150, 45, NULL, 'ZN-00001'
  FROM employee WHERE role = 'sales_rep' AND employee_id LIKE 'ZN-1%'
  ON CONFLICT DO NOTHING`);
await db.query(`
  INSERT INTO sales_target (employee_id, month, visits_target, orders_target, note, set_by)
  SELECT employee_id, date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh')::date, 160, 50, 'Push the new laundry gel with every hypermarket visit.', 'ZN-00001'
  FROM employee WHERE role = 'sales_rep' AND employee_id LIKE 'ZN-1%'
  ON CONFLICT (employee_id, month) DO UPDATE SET visits_target = EXCLUDED.visits_target, orders_target = EXCLUDED.orders_target, note = EXCLUDED.note`);

await db.query(`
  INSERT INTO sales_target (employee_id, month, visits_target, orders_target, note, set_by)
  SELECT employee_id, date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh')::date, 20, 6, 'Check in, then try "Log a visit" — it shows up in the admin portal right away.', 'ZN-00001'
  FROM employee WHERE employee_id LIKE 'DEMO-REP%'`);

await db.query("INSERT INTO audit_log (actor_type, action, entity, entity_id, reason) VALUES ('system', 'seed', 'database', 'demo', 'Public demo seed')");
await db.query('COMMIT');
await db.end();
console.log(`✔ demo layer: ${reps.length} simulated reps on round-the-clock shifts, 5 visitor reps (DEMO-REP1…5), shared password ${PASSWORD}`);
