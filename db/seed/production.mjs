#!/usr/bin/env node
// Production bootstrap — real configuration only, NO sample people or data. Idempotent.
//   DATABASE_URL=<prod url> node db/seed/production.mjs
// Creates: system settings, the global attendance rule (8-hour day), the consent text, fixed-date
// Saudi holidays, a "Head office" branch (rename it in Settings) and ONE super-admin account with a
// random temporary password that must be changed at first sign-in. Everything else (branches,
// teams, employees, work areas, catalogue, Eid dates) is entered by your admins in the portal.
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import pg from 'pg';

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const one = async (q, p) => (await db.query(q, p)).rows[0];
await db.query('BEGIN');

for (const [key, value] of Object.entries({
  'auth.max_active_mobile_sessions': 1,
  'auth.otp_ttl_seconds': 300,
  'location.retention_months': 12,
  'fraud.gps_network_mismatch_m': 1000,
  'fraud.max_speed_kmh': 160,
  'fraud.max_accuracy_m': 150,
  'consent.current_version': '2026-10',
})) {
  await db.query('INSERT INTO system_setting (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, JSON.stringify(value)]);
}

await db.query(`INSERT INTO consent_document (version, body_en, body_ar) VALUES ($1, $2, $3) ON CONFLICT (version) DO NOTHING`, [
  '2026-10',
  'ZONA Sales records your location from the moment you check in until you check out, so the ZONA administrator can see where the team is working. Location is never collected when you are off duty. Location history is kept for 12 months and then deleted. You can read the full privacy notice in Profile → Privacy.',
  'يسجّل تطبيق زونة للمبيعات موقعك من لحظة تسجيل الحضور حتى تسجيل الانصراف، ليتمكن مسؤول النظام في زونة من معرفة أماكن عمل الفريق. لا يُجمع موقعك أبدًا خارج ساعات العمل. يُحتفظ بسجل المواقع لمدة 12 شهرًا ثم يُحذف. يمكنك قراءة إشعار الخصوصية كاملًا من حسابي ← الخصوصية.',
]);

const { n } = await one("SELECT count(*)::int AS n FROM attendance_config WHERE scope = 'global'");
if (n === 0) await db.query("INSERT INTO attendance_config (scope, effective_from) VALUES ('global', '2026-01-01')");

// Fixed-date official days (Eid dates follow the Hijri calendar and are entered by HR each year).
for (const [date, en, ar] of [
  ['2026-09-23', 'Saudi National Day', 'اليوم الوطني السعودي'],
  ['2027-02-22', 'Founding Day', 'يوم التأسيس'],
  ['2027-09-23', 'Saudi National Day', 'اليوم الوطني السعودي'],
]) {
  await db.query("INSERT INTO holiday (date, name_en, name_ar, kind) VALUES ($1, $2, $3, 'public_holiday') ON CONFLICT DO NOTHING", [date, en, ar]);
}

let branch = await one("SELECT branch_id FROM branch ORDER BY created_at LIMIT 1");
branch ??= await one("INSERT INTO branch (code, name_en, name_ar) VALUES ('HQ', 'Head office', 'المكتب الرئيسي') RETURNING branch_id");

let password = null;
const admin = await one("SELECT employee_id FROM employee WHERE role = 'super_admin' LIMIT 1");
if (!admin) {
  password = `Zona-${randomBytes(12).toString('base64url')}`;
  await db.query("INSERT INTO employee (employee_id, full_name_en, full_name_ar, role, branch_id) VALUES ('ADMIN', 'System administrator', 'مدير النظام', 'super_admin', $1)", [branch.branch_id]);
  await db.query('INSERT INTO credential (employee_id, password_hash, must_change_password) VALUES ($1, $2, true)', ['ADMIN', await hash(password)]);
  await db.query('INSERT INTO user_preference (employee_id) VALUES ($1)', ['ADMIN']);
}
await db.query("INSERT INTO audit_log (actor_type, action, entity, entity_id, reason) VALUES ('system', 'bootstrap', 'database', 'production', 'Production bootstrap')");
await db.query('COMMIT');
await db.end();

console.log('✔ production bootstrap complete');
if (password) console.log(`  Super admin: employee ID ADMIN, temporary password ${password} (must be changed at first sign-in)`);
else console.log('  A super admin already exists — no account created.');
