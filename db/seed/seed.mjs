#!/usr/bin/env node
// Development seed: organisation, people, geofences, attendance rules, settings, consent text,
// holidays and a small catalogue. Run on an empty database: `npm run db:reset && npm run db:seed`.
// All sign-ins use the password in SEED_PASSWORD (default below) — development only.
import { hash } from '@node-rs/argon2';
import 'dotenv/config';
import pg from 'pg';

const PASSWORD = process.env.SEED_PASSWORD ?? 'Zona@2026';
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { rows: [{ n }] } = await db.query('SELECT count(*)::int AS n FROM branch');
if (n > 0) {
  console.log('Database already seeded. To start over: npm run db:reset && npm run db:seed');
  await db.end();
  process.exit(0);
}

const one = async (sql, params) => (await db.query(sql, params)).rows[0];

await db.query('BEGIN');

// ── Organisation ──────────────────────────────────────────────────────────────────────────────
const branches = {};
for (const [code, en, ar] of [['RUH', 'Riyadh', 'الرياض'], ['JED', 'Jeddah', 'جدة'], ['DMM', 'Dammam', 'الدمام']]) {
  branches[code] = (await one('INSERT INTO branch (code, name_en, name_ar) VALUES ($1, $2, $3) RETURNING branch_id', [code, en, ar])).branch_id;
}
const teams = {};
for (const [key, branch, en, ar] of [
  ['RN', 'RUH', 'Riyadh North', 'شمال الرياض'],
  ['JC', 'JED', 'Jeddah Central', 'وسط جدة'],
  ['DE', 'DMM', 'Dammam East', 'شرق الدمام'],
]) {
  teams[key] = (await one('INSERT INTO team (branch_id, name_en, name_ar) VALUES ($1, $2, $3) RETURNING team_id', [branches[branch], en, ar])).team_id;
}

// ── People ────────────────────────────────────────────────────────────────────────────────────
// [id, name_en, name_ar, role, branch, team, mobile] — one administrator; everyone else is a sales rep.
const people = [
  ['ZN-00001', 'Ahmed Al-Rashid', 'أحمد الراشد', 'super_admin', 'RUH', null, '+966500000001'],
  ['ZN-10427', 'Faisal Al-Harbi', 'فيصل الحربي', 'sales_rep', 'RUH', 'RN', '+966551234567'],
  ['ZN-10388', 'Noura Al-Qahtani', 'نورة القحطاني', 'sales_rep', 'RUH', 'RN', '+966551234568'],
  ['ZN-10471', 'Reem Al-Zahrani', 'ريم الزهراني', 'sales_rep', 'RUH', 'RN', '+966551234569'],
  ['ZN-10512', 'Abdullah Al-Otaibi', 'عبدالله العتيبي', 'sales_rep', 'JED', 'JC', '+966551234570'],
  ['ZN-10633', 'Khalid Al-Shehri', 'خالد الشهري', 'sales_rep', 'JED', 'JC', '+966551234571'],
  ['ZN-10590', 'Lama Al-Mutairi', 'لمى المطيري', 'sales_rep', 'JED', 'JC', '+966551234572'],
  ['ZN-10295', 'Sara Al-Dosari', 'سارة الدوسري', 'sales_rep', 'DMM', 'DE', '+966551234573'],
  ['ZN-10219', 'Omar Al-Ghamdi', 'عمر الغامدي', 'sales_rep', 'DMM', 'DE', '+966551234574'],
];
const passwordHash = await hash(PASSWORD);
for (const [id, en, ar, role, branch, team, mobile] of people) {
  const email = `${en.toLowerCase().replace(/[^a-z]+/g, '.')}@zona.example`;
  await db.query(
    `INSERT INTO employee (employee_id, full_name_en, full_name_ar, email, mobile_e164, role, branch_id, team_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, en, ar, email, mobile, role, branches[branch], team ? teams[team] : null]);
  // Development convenience: no forced reset, except one rep to exercise the first-login flow (FR-AUTH-02).
  await db.query('INSERT INTO credential (employee_id, password_hash, must_change_password) VALUES ($1, $2, $3)', [id, passwordHash, id === 'ZN-10633']);
  await db.query('INSERT INTO user_preference (employee_id) VALUES ($1)', [id]);
}

// Sales targets for the current month (visits and orders — counts, never money).
for (const [id, visits, orders] of [['ZN-10427', 60, 20], ['ZN-10388', 50, 15], ['ZN-10471', 50, 15], ['ZN-10512', 55, 18], ['ZN-10633', 40, 10], ['ZN-10590', 45, 12], ['ZN-10295', 50, 15], ['ZN-10219', 50, 15]]) {
  await db.query(
    "INSERT INTO sales_target (employee_id, month, visits_target, orders_target, set_by) VALUES ($1, date_trunc('month', now() AT TIME ZONE 'Asia/Riyadh')::date, $2, $3, 'ZN-00001')",
    [id, visits, orders]);
}

// ── Geofences (one per office, assigned to the branch) ───────────────────────────────────────
const geofences = [
  ['RUH', 'Olaya branch', 'فرع العليا', 'circle', 'POINT(46.6850 24.6935)', 200],
  ['JED', 'Tahlia office', 'مكتب التحلية', 'circle', 'POINT(39.1600 21.5450)', 200],
  ['DMM', 'King Saud Street office', 'مكتب شارع الملك سعود', 'polygon',
    'POLYGON((50.1020 26.4325, 50.1042 26.4325, 50.1042 26.4340, 50.1020 26.4340, 50.1020 26.4325))', null],
];
for (const [branch, en, ar, type, wkt, radius] of geofences) {
  const g = await one(
    type === 'circle'
      ? `INSERT INTO geofence (name_en, name_ar, type, center, radius_m, created_by) VALUES ($1, $2, 'circle', ST_GeogFromText('SRID=4326;' || $3), $4, 'ZN-00001') RETURNING geofence_id`
      : `INSERT INTO geofence (name_en, name_ar, type, area, created_by) VALUES ($1, $2, 'polygon', ST_GeogFromText('SRID=4326;' || $3), 'ZN-00001') RETURNING geofence_id`,
    type === 'circle' ? [en, ar, wkt, radius] : [en, ar, wkt]);
  await db.query("INSERT INTO geofence_assignment (geofence_id, branch_id, valid_from) VALUES ($1, $2, '2026-01-01')", [g.geofence_id, branches[branch]]);
}

// ── Attendance rules, settings, consent, holidays ────────────────────────────────────────────
await db.query("INSERT INTO attendance_config (scope, effective_from, created_by) VALUES ('global', '2026-01-01', 'ZN-00001')");

const settings = {
  'auth.max_active_mobile_sessions': 1,
  'auth.otp_ttl_seconds': 300,
  'location.retention_months': 12,
  'fraud.gps_network_mismatch_m': 1000,
  'fraud.max_speed_kmh': 160,
  'fraud.max_accuracy_m': 150,
  'consent.current_version': '2026-10',
};
for (const [key, value] of Object.entries(settings)) {
  await db.query('INSERT INTO system_setting (key, value, updated_by) VALUES ($1, $2, $3)', [key, JSON.stringify(value), 'ZN-00001']);
}

// Draft consent text — must be reviewed by legal counsel against Saudi PDPL before go-live (SRS §5.6).
await db.query('INSERT INTO consent_document (version, body_en, body_ar) VALUES ($1, $2, $3)', [
  '2026-10',
  'ZONA Sales records your location from the moment you check in until you check out, so the ZONA administrator can see where the team is working. Location is never collected when you are off duty. Location history is kept for 12 months and then deleted. You can read the full privacy notice in Profile → Privacy.',
  'يسجّل تطبيق زونة للمبيعات موقعك من لحظة تسجيل الحضور حتى تسجيل الانصراف، ليتمكن مسؤول النظام في زونة من معرفة أماكن عمل الفريق. لا يُجمع موقعك أبدًا خارج ساعات العمل. يُحتفظ بسجل المواقع لمدة 12 شهرًا ثم يُحذف. يمكنك قراءة إشعار الخصوصية كاملًا من حسابي ← الخصوصية.',
]);

// Sample 2026 holidays — dates of Eid are approximate; HR must confirm the official calendar.
for (const [date, en, ar] of [
  ['2026-02-22', 'Founding Day', 'يوم التأسيس'],
  ['2026-03-19', 'Eid al-Fitr holiday', 'إجازة عيد الفطر'],
  ['2026-03-22', 'Eid al-Fitr holiday', 'إجازة عيد الفطر'],
  ['2026-03-23', 'Eid al-Fitr holiday', 'إجازة عيد الفطر'],
  ['2026-05-26', 'Eid al-Adha holiday', 'إجازة عيد الأضحى'],
  ['2026-05-27', 'Eid al-Adha holiday', 'إجازة عيد الأضحى'],
  ['2026-05-28', 'Eid al-Adha holiday', 'إجازة عيد الأضحى'],
  ['2026-09-23', 'Saudi National Day', 'اليوم الوطني السعودي'],
]) {
  await db.query("INSERT INTO holiday (date, name_en, name_ar, kind) VALUES ($1, $2, $3, 'public_holiday')", [date, en, ar]);
}

// ── Catalogue (no prices by design) ──────────────────────────────────────────────────────────
const categories = {};
for (const [key, en, ar, order] of [['cleaning', 'Home care', 'العناية بالمنزل', 1], ['personal', 'Personal care', 'العناية الشخصية', 2], ['offers', 'Current offers', 'العروض الحالية', 3]]) {
  categories[key] = (await one('INSERT INTO product_category (name_en, name_ar, sort_order) VALUES ($1, $2, $3) RETURNING category_id', [en, ar, order])).category_id;
}
for (const [cat, type, en, ar, den, dar] of [
  ['cleaning', 'product', 'ZONA Multi-surface Cleaner 1L', 'منظف زونة متعدد الأسطح 1 لتر', 'Cuts through grease on kitchen and bathroom surfaces. Fresh citrus scent.', 'يزيل الدهون عن أسطح المطبخ والحمام برائحة الحمضيات المنعشة.'],
  ['cleaning', 'product', 'ZONA Laundry Gel 3L', 'جل غسيل زونة 3 لتر', 'Concentrated gel for front- and top-loading machines. 60 washes.', 'جل مركّز للغسالات الأمامية والعلوية، يكفي 60 غسلة.'],
  ['personal', 'product', 'ZONA Hand Wash 500ml', 'غسول يدين زونة 500 مل', 'Gentle on skin, with aloe vera.', 'لطيف على البشرة بخلاصة الصبار.'],
  ['offers', 'offer', 'Back-to-school bundle', 'باقة العودة إلى المدارس', 'Buy any two home-care products and get a hand wash free, until 31 October.', 'اشترِ أي منتجين للعناية بالمنزل واحصل على غسول يدين مجانًا حتى 31 أكتوبر.'],
]) {
  await db.query(
    `INSERT INTO product (item_type, category_id, name_en, name_ar, description_en, description_ar, status, published_at, published_by, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'published', now(), 'ZN-00001', 'ZN-00001')`,
    [type, categories[cat], en, ar, den, dar]);
}

await db.query("INSERT INTO audit_log (actor_type, action, entity, entity_id, reason) VALUES ('system', 'seed', 'database', 'dev', 'Development seed')");
await db.query('COMMIT');
await db.end();

console.log(`✔ seeded ${people.length} employees, 3 branches/teams, 3 geofences, rules, settings, consent, holidays, catalogue`);
console.log(`  Sign in with any employee ID (e.g. ZN-10427 rep, ZN-00001 admin) and password ${PASSWORD}`);
