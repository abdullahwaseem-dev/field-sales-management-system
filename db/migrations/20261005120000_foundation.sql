-- migrate:up
-- SFMS Phase 1 — foundation: extensions, enum types, shared helpers.
-- Conventions: docs/00-foundation-proposal.md §5.1. No monetary columns anywhere (enforced by tests).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE employee_role AS ENUM ('super_admin', 'hr_admin', 'sales_supervisor', 'sales_rep');
CREATE TYPE record_status AS ENUM ('active', 'inactive');
CREATE TYPE theme_pref AS ENUM ('system', 'light', 'dark');
CREATE TYPE locale_pref AS ENUM ('system', 'en', 'ar');
CREATE TYPE digits_pref AS ENUM ('western', 'arabic_indic');
CREATE TYPE device_platform AS ENUM ('android', 'ios');
CREATE TYPE client_kind AS ENUM ('mobile', 'portal');
CREATE TYPE otp_purpose AS ENUM ('login', 'password_reset');
CREATE TYPE geofence_type AS ENUM ('circle', 'polygon');
CREATE TYPE config_scope AS ENUM ('global', 'team');
CREATE TYPE outside_geofence_action AS ENUM ('block', 'flag');
CREATE TYPE holiday_kind AS ENUM ('public_holiday', 'company_off_day');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'suspected_fake', 'confirmed_fake', 'on_leave');
CREATE TYPE check_out_source AS ENUM ('employee', 'shift_timeout', 'correction');
CREATE TYPE attendance_phase AS ENUM ('check_in', 'check_out');
CREATE TYPE fraud_phase AS ENUM ('check_in', 'check_out', 'tracking');
CREATE TYPE fraud_signal_type AS ENUM ('mock_location', 'gps_network_mismatch', 'impossible_speed', 'rooted_device', 'outside_geofence');
CREATE TYPE status_change_cause AS ENUM (
  'check_in', 'check_out', 'fraud_flagged', 'review_confirmed', 'review_cleared',
  'correction_approved', 'leave_approved', 'leave_cancelled', 'absent_marked', 'month_correction'
);
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE location_provider AS ENUM ('gps', 'network', 'fused');
CREATE TYPE leave_type AS ENUM ('leave', 'off_day');
CREATE TYPE item_type AS ENUM ('product', 'offer', 'promo');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE media_kind AS ENUM ('image', 'document');
CREATE TYPE share_channel AS ENUM ('whatsapp', 'sms', 'email', 'link', 'other');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE period_status AS ENUM ('open', 'draft', 'finalized', 'reopened');
CREATE TYPE summary_status AS ENUM ('draft', 'finalized');
CREATE TYPE notification_type AS ENUM (
  'check_in', 'check_out', 'late_warning', 'geofence_exit', 'leave_decided',
  'correction_decided', 'new_content', 'fraud_flagged', 'hours_completed'
);
CREATE TYPE actor_type AS ENUM ('employee', 'system', 'api_client');

-- Keeps updated_at honest without relying on every code path.
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Append-only tables (audit trail, status trail, effective-dated config) reject UPDATE/DELETE/TRUNCATE
-- regardless of the database role used (defence in depth on top of grants).
CREATE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP USING ERRCODE = 'P0001';
END $$;

-- migrate:down
DROP FUNCTION IF EXISTS forbid_mutation();
DROP FUNCTION IF EXISTS touch_updated_at();
DROP TYPE IF EXISTS actor_type, notification_type, summary_status, period_status, job_status, share_channel,
  media_kind, content_status, item_type, leave_type, location_provider, request_status, status_change_cause,
  fraud_signal_type, fraud_phase, attendance_phase, check_out_source, attendance_status, holiday_kind,
  outside_geofence_action, config_scope, geofence_type, otp_purpose, client_kind, device_platform,
  digits_pref, locale_pref, theme_pref, record_status, employee_role;
