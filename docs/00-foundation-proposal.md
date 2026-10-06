# SFMS: Foundation Proposal

**Status:** Approved to proceed 2026-10-05, with one amendment: the **8-hour working day** (§5.5) ·
**SRS baseline:** SFMS-SRS.md v1.1

This covers what the inputs contain, the brand palette, the stack, the repository layout, and the
Phase 1 data model. Items marked **⚑** were open questions. Their resolutions are in §7.

---

## 1. Findings from the inputs

### 1.1 logo.png: blocking for brand assets ⚑

`logo.png` is a **brand-guidelines sheet** ("01 LOGO SYSTEM"), not a logo file:

- 1448 × 1086 px, RGB with **no alpha channel**, on a solid white page.
- It contains every variant (primary, Arabic, bilingual lockup, three icon forms, monochrome, reverse,
  clear-space and minimum-size rules, core colors), but each one is small:

| Variant on the sheet | Size on the sheet | What we must produce from it |
|---|---|---|
| Primary wordmark "ZONA" | 468 × 102 px | Login / sidebar / header lockups, report header (print ≥ 300 dpi) |
| Arabic wordmark "زونة" | 276 × 151 px | Arabic lockups |
| Bilingual lockup | 401 × 85 px | Portal header, exported reports |
| Brand icon (Z, square, circle) | ~110 × 110 px | iOS 1024 × 1024, Play Store 512 × 512, Android adaptive 432 × 432, splash, favicon |

Using these would mean **cropping** the sheet (not allowed) and **upscaling the icon 5–10×** (blurry).
There is a second sign that the sheet is a rendered presentation, not an export from the master files:
the hex values printed on it don't match its own artwork (§2.1).

The sheet already defines a **reverse version** (white letters and orange dot on navy) and three
icon containers. Once we have masters, dark-mode logos use the brand's own reverse artwork. No
recoloring or improvised badges are needed.

**Needed:** vector masters (SVG preferred; AI / EPS / PDF fine) of the primary wordmark, Arabic
wordmark, bilingual lockup, brand icon (bare Z), plus the reverse and monochrome versions of each,
and the official color values if they exist.

### 1.2 SRS

- `SRS_Sales_Force_Management_System.pdf` and `SFMS-SRS.md` contain the same v1.1 text. There is no conflict.
- `HRMS-SRS.md` is referenced but not in the repo. SFMS only touches it through the outbound summary
  API (FR-ASM-05), so it isn't needed now.
- A few requirements are ambiguous or conflict in ways that change the schema. They are listed in §7 with a proposed default for each.

---

## 2. Brand palette

### 2.1 Measured vs. labelled values ⚑

Each value below is the median of the solid-fill pixels in every logo variant on the sheet. The
values agree across all six color variants (±2 per channel).

| Role | Label printed on the sheet | Measured in the logo artwork | Difference |
|---|---|---|---|
| Navy | `#111B27` | **`#07193C`** | The label is a greyer, near-black navy (OKLCH chroma 0.028). The artwork is a saturated deep blue (chroma 0.072). The swatch next to the label renders as `#031028`, a third value. |
| Orange | `#F15A24` | **`#FD5813`** | Close. The artwork is slightly brighter and more saturated. |

**Recommendation:** build on the measured artwork values, because the shipped logo sits right next to
the UI. If official agency values exist, those win, and the scales regenerate from a script in minutes.

### 2.2 Tonal scales

The scales are generated in OKLCH with hue locked to the brand color. Navy is anchored at **900**,
orange at **500**, and the neutrals are cool greys tinted toward the navy hue.

| Step | Navy (primary) | Orange (accent) | Neutral |
|---|---|---|---|
| 50  | `#F3F7FE` | `#FFF4F1` | `#F9FAFC` |
| 100 | `#E2ECFC` | `#FEE7E0` | `#F2F3F7` |
| 200 | `#C7D8F6` | `#FECEBF` | `#E3E6EC` |
| 300 | `#A0BBEB` | `#FFAD92` | `#D0D4DC` |
| 400 | `#7498D9` | `#FE825A` | `#9FA5AF` |
| 500 | `#4A73BD` | **`#FD5813`** (logo) | `#747B87` |
| 600 | `#2F559D` | `#D9490A` | `#575E6A` |
| 700 | `#1B3C7B` | `#B63E0C` | `#414855` |
| 800 | `#0E285A` | `#90320E` | `#272E3B` |
| 900 | **`#07193C`** (logo) | `#6F2911` | `#161D29` |
| 950 | `#020C28` | `#491B0C` | `#0C121C` |

### 2.3 Semantic roles

The numbers in brackets are contrast ratios against the role's main surface (`surface`).

| Token | Light | Dark |
|---|---|---|
| `background` | `#F9FAFC` | `#090F1C` (navy-tinted, never `#000`) |
| `surface` | `#FFFFFF` | `#0F1725` |
| `surface-raised` | `#FFFFFF` + shadow | `#171F2F` (lighter = higher) |
| `border` (decorative) | `#E3E6EC` | `#2D3645` |
| `border-strong` (inputs, 3:1) | `#747B87` [4.26] | `#6B7587` [3.86] |
| `text-primary` | `#161D29` [16.9] | `#F2F3F7` [16.2] (never `#FFF`) |
| `text-secondary` | `#575E6A` [6.53] | `#9FA5AF` [7.25] |
| `text-disabled` | `#9FA5AF` (WCAG-exempt) | `#575E6A` (WCAG-exempt) |
| `brand` / `on-brand` | `#07193C` / `#FFFFFF` [17.3] | `#A0BBEB` / `#020C28` [9.95] |
| `brand-text` (links) | `#1B3C7B` [10.6] | `#A0BBEB` [9.24] |
| `accent` (icons, dot) | `#FD5813` [3.19] | `#FB8861` [7.52] (softened) |
| `accent-strong` / `on-accent-strong` | `#B63E0C` / `#FFFFFF` [5.70] | `#FB8861` / `#020C28` [8.10] |
| `accent-text` | `#B63E0C` [5.70] | `#FD9976` [8.55] |
| `focus-ring` | `#2F559D` [7.22] | `#FB8861` [7.52] |

### 2.4 Attendance status tokens

Every status has a color, an icon and a label, so it is never shown by color alone. The Lucide icon
set exists for both React and Flutter, so the icons match across platforms.

| Status | Icon | EN | AR | Light fg / bg | Dark fg / bg |
|---|---|---|---|---|---|
| Present | `circle-check` | Present | حاضر | `#046E30` / `#E8F9EB` | `#92DCA1` / `#142E1A` |
| Late | `clock-alert` | Late | متأخر | `#7A5103` / `#FEF2E1` | `#F1BD73` / `#362407` |
| Absent | `circle-x` | Absent | غائب | `#963538` / `#FFEFEE` | `#FFAFAC` / `#3D1D1C` |
| Suspected Fake | `shield-question` | Suspected fake | اشتباه تلاعب ⚑ | `#674698` / `#F5F1FF` | `#D1B9FE` / `#2B223C` |
| Confirmed Fake | `shield-x` | Confirmed fake | تلاعب مؤكد ⚑ | `#90355E` / `#FFEEF4` | `#FFAACB` / `#3B1D29` |
| On Leave | `calendar-days` | On leave | في إجازة | `#08686C` / `#E1F9FA` | `#61DDE3` / `#012E30` |
| *info (semantic)* | `info` | n/a | n/a | `#056190` / `#EAF5FE` | `#8ED0FF` / `#0C2B3E` |

`success` uses the Present color, `warning` uses Late, and `danger` uses Absent. Each status also has
`border` and `solid` (map-marker fill) values. The Arabic labels marked ⚑ need a native speaker to
review the wording.

### 2.5 Rules that come out of the contrast check

I checked 102 text/icon/border pairs across both themes. All of them pass WCAG AA: 4.5:1 for text,
3:1 for icons, borders and focus rings.

- **White text on the logo orange is 3.19:1, which fails AA.** Orange buttons with text use either
  `accent-strong` (`#B63E0C`, 5.70:1 with white) or navy text on true orange (5.42:1). The true orange
  `#FD5813` is kept for the logo dot, icons and decorative marks, and only on white or `#F9FAFC`.
- **The brand orange sits close to danger red.** Brand orange is at OKLCH hue 39°, so danger/Absent
  is pushed toward crimson (hue 22°) and Late toward amber (hue 75°). Status icons and labels carry
  the meaning on their own.
- **Dark mode is designed, not inverted.** Surfaces are layered navy-tinted greys, never pure black
  or white. Brand and accent are lightened and desaturated, and every brand color has a dark-mode
  value of its own.

### 2.6 Typography

- **Latin:** Inter (variable font, tabular figures for timers and tables).
- **Arabic:** IBM Plex Sans Arabic (7 weights, includes Arabic-Indic digits).
- Both fonts are OFL and self-hosted: woff2 for the portal, bundled font files in the Flutter app.
- Arabic gets more line height than Latin (body text about 1.7 vs 1.5) and never gets letter-spacing,
  enforced by a `:lang(ar)` rule and an Arabic text-theme override.
- "ZONA" and "زونة" are custom lettering. They are only ever shown as logo artwork, never typed in a font.

---

## 3. Tech stack

All choices are within the options in the brief.

| Layer | Choice | Reason |
|---|---|---|
| Mobile | **Flutter** 3.47 (installed) | Switching locale, `Directionality` and theme at runtime needs no restart. ARB files are ICU natively. Material 3 sits under our own token `ThemeExtension`. |
| Mobile internals | Riverpod, go_router, Drift (SQLite) | Drift holds the offline queue for pings and shares (FR-LOC-04). |
| Portal | **React 19 + Vite + TypeScript** | |
| Portal UI | Tailwind v4 (logical `ms-/me-/ps-/pe-/start-/end-` utilities built in), `dark` class over CSS-variable tokens, Radix primitives as shadcn-style owned components | RTL and theming come from one place. |
| Portal data | TanStack Query, Table, Router | Dense tables: sort, filter, column control, sticky header, bulk select. |
| i18n | FormatJS (portal) / gen-l10n ARB (mobile), both from one ICU source | Arabic plurals come from `Intl.PluralRules` / CLDR. Hijri uses the `islamic-umalqura` calendar (Saudi official). Arabic-Indic digits use `-u-nu-arab`. |
| No theme/language flash | An inline `<head>` script applies the cached `class`, `dir` and `lang` before first paint, then syncs from the server preference after login | |
| Backend | **Node.js 24 LTS + TypeScript, NestJS on its Express adapter** | Modules and guards fit the RBAC model. OpenAPI is generated from the code. |
| Data access | Kysely (typed SQL) + SQL-first migrations | PostGIS, partitioning and triggers are plain SQL, so there is no fight with an ORM. |
| Jobs | pg-boss (queue stored in Postgres) | Absent marking, shift timeout, monthly summary, retention purge. No Redis needed for V1. |
| Live map | Server-Sent Events + Postgres `LISTEN/NOTIFY` | A ping reaches the map in seconds, well inside the 30 s target, and fans out across API instances. |
| Database | **PostgreSQL 18 + PostGIS** | Native `uuidv7()`. Geofences use `ST_Covers`/`ST_DWithin`. Pings are partitioned by month. |
| Maps | Google Maps Platform | Light and dark map IDs, `@googlemaps/markerclusterer` on the portal, `google_maps_flutter` on mobile. Maps are never mirrored in RTL. |
| Push | FCM (Android) + APNs (through FCM) | |
| Auth | Argon2id passwords, 15-minute JWT access token, rotating device-bound refresh token (stored hashed) | FR-AUTH-03 is enforced at login. |
| Contracts | OpenAPI → generated TS client (portal) and Dart client (mobile) | |
| Tokens | W3C DTCG JSON → a dependency-free build script (`packages/tokens/scripts/build.mjs`) → CSS variables, Tailwind theme, JS and Dart `ThemeExtension`s | One source of truth. The build fails on any WCAG AA contrast miss. (Style Dictionary was dropped because its multi-theme config cost more than a small script.) |

Load estimate: 2,000 reps sending one ping every 2–5 minutes is about 7–17 pings per second. That is
light. Partitioning the ping table is for retention and query speed, not throughput.

---

## 4. Project structure

```
SFMS ZONA/
├── apps/
│   ├── api/                 NestJS REST API + pg-boss workers
│   │   └── src/modules/     auth · org · employees · geofences · attendance · location · fraud ·
│   │                        leave · catalogue · summary · hrms-api · notifications · audit · settings
│   ├── portal/              React admin portal
│   │   └── src/             app/ · features/<area>/ · components/ui/ · lib/{i18n,theme,api}/
│   └── mobile/              Flutter app
│       └── lib/             app/ · features/<area>/ · design_system/ · services/{location,queue}/ · l10n/
├── packages/
│   ├── tokens/              DTCG token JSON → generated CSS / Tailwind / Dart
│   ├── i18n/                en.json · ar.json (ICU, source of truth) → portal JSON + Flutter ARB
│   ├── brand/               logo masters (SVG) + generator for every icon, splash, favicon and lockup
│   └── api-contract/        openapi.yaml → TS + Dart clients
├── db/
│   ├── migrations/          numbered SQL files
│   └── seed/                dev data: branches, teams, geofences, holidays, sample reps
├── tools/                   contrast checker · "no money fields" schema lint · screenshot runner
├── docs/
│   ├── 00-foundation-proposal.md
│   ├── design-system/       Phase 0 review page + EN/AR × light/dark screenshots
│   └── adr/                 one-page decision records
└── infra/                   local compose file, CI workflows
```

The JavaScript side uses npm workspaces. The Flutter app consumes the generated Dart tokens, strings
and API client as path packages. Screenshots of all four combinations come from Playwright (portal)
and Flutter integration/golden tests (mobile).

---

## 5. Database schema (Phase 1)

### 5.1 Conventions

- Table names are the SRS §8 entity names in singular `snake_case`. Primary keys keep the SRS names
  (`event_id`, `ping_id`, …) and are **UUIDv7**. UUIDv7 is time-ordered and can be generated on the
  device, so a retried offline upload never creates a duplicate.
- **`employee.employee_id` is the HR-issued code** (text). It is the key shared with HRMS (§2.1) and the foreign key everywhere.
- `timestamptz` (UTC) is used for instants. `work_date date` is in the branch timezone (default `Asia/Riyadh`).
- Content in both languages uses `_en` / `_ar` column pairs. UI strings are never stored in the
  database: notifications store a message key and parameters, rendered in the recipient's language.
- Latitude and longitude are stored as `double precision` columns (as the SRS names them), plus a
  generated `geography(Point)` column for PostGIS.
- **No monetary columns.** A CI schema lint fails the build if any table or column name matches
  `salary|payroll|deduction|payslip|wage|currency|price|amount|cost`.

### 5.2 Tables

**A. Organization & people**

| Table | Columns |
|---|---|
| `branch` | branch_id, code (unique), name_en, name_ar, timezone, status, created_at, updated_at |
| `team` | team_id, branch_id → branch, name_en, name_ar, supervisor_id → employee, status, timestamps |
| `employee` | **employee_id** (text PK), full_name_en, full_name_ar, email (unique, nullable), mobile_e164 (unique, OTP target), role `super_admin \| hr_admin \| sales_supervisor \| sales_rep`, branch_id, team_id, supervisor_id → employee, shift_start `time` (opening of the sign-in window, default 09:00), latest_start `time` (last on-time sign-in, default 12:00; replaces the SRS `shift_end`, because the day now ends when the required hours are worked, see §5.5), weekly_off_days `smallint[]` default `{5,6}` (Fri, Sat) ⚑, status `active \| inactive`, deactivated_at, timestamps |
| `user_preference` | employee_id (PK), theme `system \| light \| dark`, locale `system \| en \| ar`, digits `western \| arabic_indic`, show_hijri, updated_at |

**B. Auth & devices**

| Table | Columns |
|---|---|
| `credential` | employee_id (PK), password_hash (Argon2id), must_change_password (default true, FR-AUTH-02), password_changed_at, failed_attempts, locked_until |
| `device` | device_id, employee_id, platform `android \| ios`, model, os_version, app_version, push_token, integrity `jsonb` (root/jailbreak, Play Integrity / App Attest verdict), first_seen_at, last_seen_at |
| `auth_session` | session_id, employee_id, device_id (null on the portal), client `mobile \| portal`, refresh_token_hash, created_at, last_used_at, expires_at, revoked_at, revoke_reason |
| `otp_challenge` | otp_id, employee_id, purpose `login \| password_reset`, code_hash, expires_at, attempts, consumed_at |

**C. Geofences & configuration**

| Table | Columns |
|---|---|
| `geofence` | geofence_id, name_en, name_ar, type `circle \| polygon`, center `geography(Point)`, radius_m, area `geography(Polygon)`, status, created_by, timestamps. CHECK: a circle needs center + radius, a polygon needs area. |
| `geofence_assignment` | assignment_id, geofence_id, employee_id \| team_id \| branch_id (CHECK exactly one is set), valid_from, valid_to |
| `attendance_config` | config_id, scope `global \| team`, team_id (required when scope = team), **required_work_minutes** (default 480, CHECK 60–720), grace_minutes (default 15, counted after `latest_start`, 0–240), ping_interval_seconds (default 180, CHECK 120–300 per FR-LOC-01), outside_geofence_action `block \| flag`, photo_required (default false), shift_timeout_hours (default 12), effective_from, created_by, created_at. **Insert-only:** a change is a new row with a new `effective_from`. For a given day, the team row with the latest `effective_from` ≤ that day applies; if there is none, the global row applies. |
| `system_setting` | key (PK), value `jsonb`, updated_by, updated_at. Holds max_active_mobile_sessions (1), location_retention_months (12), the fraud thresholds (GPS/network mismatch in metres, maximum plausible speed) and the current consent version. |
| `holiday` | holiday_id, date, name_en, name_ar, kind `public_holiday \| company_off_day`, branch_id (null = company-wide). UNIQUE (date, branch_id) |

**D. Attendance**

| Table | Columns |
|---|---|
| `attendance_event` | **One row per employee per working day.** The SRS name is kept. Absent and leave days get a row too, so the register and the summary read a single table. <br>• event_id, employee_id, work_date. **UNIQUE (employee_id, work_date)** enforces one check-in per shift (FR-ATT-01). <br>• window_start_at, latest_start_at, required_work_minutes, config_id: copied when the row is created, so later shift or config edits never rewrite history. <br>• check_in_at, check_in_lat, check_in_lng, check_in_accuracy_m, check_in_device_id, check_in_geofence_id, check_in_inside_geofence, check_in_distance_m <br>• check_out_at, check_out_lat, check_out_lng, check_out_accuracy_m, check_out_inside_geofence, check_out_source `employee \| shift_timeout \| correction` <br>• is_late, late_minutes: punctuality is stored separately, so clearing a Suspected Fake restores Present or Late correctly.
<br>• worked_minutes (set at check-out), shortfall_minutes (generated: required − worked, never below 0), is_short_hours (generated) <br>• **status** `present \| late \| absent \| suspected_fake \| confirmed_fake \| on_leave` <br>• review_notes, reviewed_by, reviewed_at (FR-ATM-02) <br>• leave_request_id, created_at, updated_at |
| `fraud_signal` | The evidence behind a Suspected Fake. signal_id, event_id, ping_id (nullable), phase `check_in \| check_out \| tracking`, type `mock_location \| gps_network_mismatch \| impossible_speed \| rooted_device \| outside_geofence`, evidence `jsonb` (both fixes and their distance, computed speed, integrity verdict), detected_at |
| `attendance_status_change` | **The classification trail** (FR-ASM-06, BR-ATT-01/02). change_id, event_id, from_status, to_status, cause `check_in \| check_out \| fraud_flagged \| review_confirmed \| review_cleared \| correction_approved \| leave_approved \| leave_cancelled \| absent_marked \| month_correction`, actor_id (null = system), reason (required when a person makes the change), fraud_signal_id / correction_request_id / leave_request_id (whichever caused it), created_at |
| `attendance_correction_request` | request_id, event_id, employee_id, requested_check_in_at, requested_check_out_at, reason, status `pending \| approved \| rejected \| cancelled`, decided_by, decided_at, decision_remark, created_at |
| `attendance_break` ⚑ | break_id, event_id, started_at, ended_at. Only if "On break" (FR-ATT-08) is in scope. |
| `attendance_photo` ⚑ | photo_id, event_id, phase, storage_key (encrypted object storage), liveness_passed, liveness_score, captured_at. Only if photo attendance is enabled (Appendix A). |

**E. Location**

| Table | Columns |
|---|---|
| `location_ping` | **Partitioned by month on `recorded_at`.** ping_id (generated on the device), employee_id, attendance_event_id (**NOT NULL**: a ping cannot exist without a shift), recorded_at, received_at, lat, lng, accuracy_m, speed_mps, heading_deg, provider `gps \| network \| fused`, is_mock. PK (ping_id, recorded_at), index (employee_id, recorded_at). Retention drops whole partitions older than `location_retention_months`. |
| `employee_live_location` | The latest fix per on-duty rep: employee_id (PK), attendance_event_id, ping_id, recorded_at, lat, lng, accuracy_m. Upserted on every ping and **deleted at check-out**. The live map reads only this table, so it can never show an off-shift position. |

**F. Leave**

| Table | Columns |
|---|---|
| `leave_request` | request_id, employee_id, type `leave \| off_day`, start_date, end_date (≥ start), reason, status `pending \| approved \| rejected \| cancelled`, decided_by (the SRS calls this `approved_by`; it records who rejected too) ⚑, decided_at, decision_remark, created_at. No paid/unpaid or balance fields: those drive pay and belong to HRMS. |

**G. Marketing**

| Table | Columns |
|---|---|
| `product_category` | category_id, name_en, name_ar, sort_order, status |
| `product` | product_id, item_type `product \| offer \| promo`, category_id, name_en, name_ar, description_en, description_ar, valid_from, valid_to, status `draft \| published \| archived`, share_slug (public link), published_at, published_by, created_by, timestamps. **No price field** ⚑ |
| `product_media` | media_id, product_id, kind `image \| document`, storage_key, alt_en, alt_ar, width, height, sort_order |
| `share_event` | share_id (generated on the device), employee_id, product_id, channel `whatsapp \| sms \| email \| link \| other`, recipient (optional, encrypted: it is a customer's personal data), shared_at, received_at |
| `customer_visit_note` | note_id, employee_id, product_id, share_id, customer_name, note, visited_at (FR-MKT-04) |
| `product_import_job` | job_id, uploaded_by, file_key, status, total_rows, imported_rows, errors `jsonb`, created_at, finished_at (FR-MKM-03) |

**H. Monthly summary & HRMS**

| Table | Columns |
|---|---|
| `attendance_period` | The company-wide month lock (BR-ATT-04). period_id, year, month, status `open \| draft \| finalized \| reopened`, computed_at, finalized_by, finalized_at, reopened_by, reopened_at, reopen_reason (required on re-open). UNIQUE (year, month) |
| `attendance_summary` | summary_id, employee_id, year, month, present_days, absent_days, late_count, confirmed_fake_count, leave_days, **short_hours_count** (days checked out with fewer than the required hours; §5.5), status `draft \| finalized`, finalized_by, finalized_at, **version** (bumped each time a re-opened month is finalized again, so HRMS can see the change), computed_at. UNIQUE (employee_id, year, month). Counts only. |
| `api_client` | Credentials HRMS uses to pull finalized summaries. client_id, name, key_hash, scopes, allowed_ips, status, created_by, created_at, last_used_at |

HR corrections (FR-ASM-03) are made **on the day rows** with a mandatory reason and recorded in
`attendance_status_change`, then the summary is recomputed. Nobody types counts in by hand, so every
number traces back to the days that produced it. A month **cannot be finalized while any of its days
is still Suspected Fake**.

**I. Consent, notifications, audit**

| Table | Columns |
|---|---|
| `consent_document` | version (PK), body_en, body_ar, published_at |
| `tracking_consent` | consent_id, employee_id, consent_version, device_id, granted_at, revoked_at, app_version. Check-in is refused unless the employee has consented to the current version (SRS §5.6). |
| `notification` | notification_id, recipient_id, type `check_in \| check_out \| late_warning \| geofence_exit \| leave_decided \| correction_decided \| new_content \| fraud_flagged`, message_key, params `jsonb`, data `jsonb`, created_at, sent_at, read_at |
| `audit_log` | log_id, actor_id, actor_type `employee \| system \| api_client`, action, entity, entity_id, before_value `jsonb`, after_value `jsonb`, reason, request_id, ip, user_agent, occurred_at (the SRS calls it `timestamp`), prev_hash, hash |

### 5.3 Rules enforced by the database, not just the API

1. `audit_log` and `attendance_status_change` are **append-only**: a trigger rejects UPDATE and
   DELETE, and the API's database role has no UPDATE or DELETE grant on them. The hash chain on
   `audit_log` makes tampering detectable.
2. **No automatic Confirmed Fake** (BR-ATT-01). `status` can only become `confirmed_fake` from
   `suspected_fake`, and only with `reviewed_by` (a person) and `review_notes` set.
3. Every `status` change on `attendance_event` writes its `attendance_status_change` row inside the
   same transaction, done by a trigger so no code path can skip it.
4. Rows in a finalized month cannot change until an HR Admin re-opens the month, which is audited.
5. `location_ping.attendance_event_id` is NOT NULL, and the API rejects any ping outside that event's
   check-in → check-out window (FR-LOC-03).

### 5.4 How a day gets its status

1. **Check-in:** the geofence check and fraud checks run. Any fraud signal makes the day
   `suspected_fake`. A check-in outside the geofence is blocked or flagged, depending on config ⚑.
   Otherwise the day is `present`, or `late` if the check-in is after `latest_start` + grace
   (12:15 by default). `is_late` is always recorded.
2. **Check-out:** `worked_minutes` is recorded. Checking out before the required hours is allowed,
   but the app first shows the time remaining and asks for confirmation. The day keeps its status and
   is flagged short (§5.5).
3. **During the shift:** pings are checked for mock location and impossible speed. A hit adds a
   `fraud_signal` and flags the day. The supervisor is notified immediately (FR-FRAUD-02).
4. **Review:** confirming sets `confirmed_fake`. Clearing restores `present` or `late` from `is_late`.
   A remark is required either way.
5. **End of shift:** a job marks scheduled working days with no check-in as `absent`. Holidays and
   weekly off days get no row. Days covered by approved leave become `on_leave`.
6. **No check-out by the shift timeout:** tracking stops and `check_out_source = shift_timeout` ⚑.

### 5.5 Amendment: the 8-hour working day (requested 2026-10-05)

> "Per day 8 hours is compulsory, no matter whether they sign in at 9, 10, 11 or 12."

- **Flexible start:** signing in anywhere from `shift_start` to `latest_start` (09:00–12:00) is on
  time. **Late** means signing in after `latest_start` + grace.
- **Required hours:** every working day needs `required_work_minutes` (480) between check-in and
  check-out. The value lives in the effective-dated `attendance_config`, so it can be changed per team
  or for a period without code changes. For example, Saudi Labor Law caps working hours during
  Ramadan, and that can be entered as a dated config row.
- **Short days:** a day checked out with fewer than the required hours keeps its Present or Late
  status. It gets `is_short_hours` and `shortfall_minutes`, and the month counts it in
  `short_hours_count`. The six statuses in the brief are unchanged.
- **Breaks are not deducted:** worked time is check-out minus check-in, consistent with tracking
  staying on during breaks.
- **Mobile:** the hero control shows progress toward 8 hours ("5h 12m worked · 2h 48m to go"). An
  early check-out asks for confirmation. A push notification tells the rep when the 8 hours are reached.
- **Portal:** the register shows worked hours and a "Short by 1h 20m" badge next to the status chip.
- **Shift timeout:** the 12-hour timeout (FR-LOC-03) still stops tracking for anyone who never checks out.

### 5.6 Deviations from SRS §8 (need your approval)

1. `Employee.geofence_id` and `Team.geofence_id` are replaced by `geofence_assignment`. FR-ATT-03 and
   FR-EMP-02 ask for multiple geofences per employee, team *or* branch.
2. "Team / Branch" is split into `branch` and `team`, because FR-DSH-03 filters by both.
3. `AttendanceEvent` keeps its name but becomes one row per employee per working day, including
   absent and leave days. It also gains punctuality fields, a snapshot of the shift and config,
   geofence results, the check-out source and reviewer fields.
4. `AttendanceSummary` gains a `version` column, and there is a new `attendance_period` table for the month lock.
5. `LeaveRequest.approved_by` becomes `decided_by`.
6. New tables that the FRs and NFRs require but §8 doesn't list: credential, device, auth_session,
   otp_challenge, user_preference, geofence_assignment, system_setting, holiday, fraud_signal,
   attendance_status_change, attendance_correction_request, employee_live_location,
   product_category, product_media, customer_visit_note, product_import_job, attendance_period,
   api_client, consent_document, tracking_consent, notification. attendance_break and
   attendance_photo are optional.

---

## 6. Local environment

**Present:** Flutter 3.47.4, Xcode 27, Android Studio + SDK, Node 25, Homebrew.
**Missing:** PostgreSQL and PostGIS (there is no Docker or `psql`). They are needed before the Phase 1 migrations can run. Nothing will be installed without your OK.
The project will pin Node 24 LTS with `.nvmrc`.

---

## 7. Decisions needed

> **Resolution (2026-10-05):** the user said to go ahead. That means: the measured colors, all schema
> defaults below, and the 8-hour amendment (§5.5). Logo vector masters are still outstanding, so
> Phase 0 uses **interim** extractions at native resolution (never upscaled). App-store icons and
> splash screens wait for the masters (see `packages/brand/README.md`).

**Blocking Phase 0**

1. **Logo masters:** please supply vector files (§1.1). If none exist, say so: I can trace vectors
   from the sheet, but that counts as a redraw, so it needs your explicit permission and should be
   treated as temporary.
2. **Colors:** use the measured artwork values (`#07193C` / `#FD5813`, recommended) or the printed
   labels (`#111B27` / `#F15A24`)?

**Schema questions.** A proposed default is given for each. Reply "defaults OK" to accept them all.

3. **`present_days`:** does it include late days? *Default:* present_days = days attended (Present +
   Late), late_count = how many of those were late, and confirmed-fake days count only in
   confirmed_fake_count.
4. **Correction window:** FR-ATT-07 says "same-day" but BR-ATT-02 says "before the month is
   finalized". *Default:* allow requests until the month is finalized.
5. **Outside the geofence when config = flag:** *Default:* the day becomes Suspected Fake with signal
   `outside_geofence`, and it goes to the same review queue.
6. **No check-out by the shift timeout:** *Default:* the day keeps Present or Late, is marked "missing
   check-out" in the register, and the rep can request a correction.
7. **"On break" (FR-ATT-08):** this is the only place breaks appear. *Default:* breaks are in scope as
   a display state, and tracking continues during a break, as FR-LOC-01 requires.
8. **Catalogue prices:** the brief bans currency fields everywhere, so products have no price and
   offers describe discounts in text. Is that intended?
9. **Leave types:** *Default:* only `leave` and `off_day`, as in FR-LVE-01. Annual, sick and other
   categories stay in HRMS.
10. **Weekly off days and overnight shifts:** *Default:* Friday and Saturday off, overnight shifts
    supported (`work_date` = the date the shift starts).

**Later phases (not needed now)**

- **Background location (Phase 3):** I recommend Transistorsoft `flutter_background_geolocation`.
  It is mature, battery-aware and motion-based, but needs a **paid license** for Android release
  builds. The free alternative (`geolocator` + a foreground-task package) means more custom work and
  weaker iOS behavior.
- **Minimum iOS version:** iOS only reports simulated locations (`isSimulatedBySoftware`) from
  **iOS 15**. The SRS minimum is iOS 14, so I propose raising it to 15.
- Still open from Appendix A: selfie or GPS-only check-in, ping retention period, HRMS pull vs. push,
  and whether office staff use the app.
- To decide later: the SMS/OTP gateway (KSA) and the hosting region (Phase 6).
