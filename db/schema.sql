\restrict dbmate

-- Dumped from database version 18.6 (Homebrew)
-- Dumped by pg_dump version 18.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: actor_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.actor_type AS ENUM (
    'employee',
    'system',
    'api_client'
);


--
-- Name: attendance_phase; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_phase AS ENUM (
    'check_in',
    'check_out'
);


--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'late',
    'absent',
    'suspected_fake',
    'confirmed_fake',
    'on_leave'
);


--
-- Name: check_out_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.check_out_source AS ENUM (
    'employee',
    'shift_timeout',
    'correction'
);


--
-- Name: client_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_kind AS ENUM (
    'mobile',
    'portal'
);


--
-- Name: config_scope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.config_scope AS ENUM (
    'global',
    'team'
);


--
-- Name: content_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_status AS ENUM (
    'draft',
    'published',
    'archived'
);


--
-- Name: device_platform; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.device_platform AS ENUM (
    'android',
    'ios'
);


--
-- Name: digits_pref; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.digits_pref AS ENUM (
    'western',
    'arabic_indic'
);


--
-- Name: employee_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employee_role AS ENUM (
    'super_admin',
    'hr_admin',
    'sales_supervisor',
    'sales_rep'
);


--
-- Name: fraud_phase; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fraud_phase AS ENUM (
    'check_in',
    'check_out',
    'tracking'
);


--
-- Name: fraud_signal_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fraud_signal_type AS ENUM (
    'mock_location',
    'gps_network_mismatch',
    'impossible_speed',
    'rooted_device',
    'outside_geofence'
);


--
-- Name: geofence_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.geofence_type AS ENUM (
    'circle',
    'polygon'
);


--
-- Name: holiday_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.holiday_kind AS ENUM (
    'public_holiday',
    'company_off_day'
);


--
-- Name: item_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_type AS ENUM (
    'product',
    'offer',
    'promo'
);


--
-- Name: job_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.job_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed'
);


--
-- Name: leave_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_type AS ENUM (
    'leave',
    'off_day'
);


--
-- Name: locale_pref; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.locale_pref AS ENUM (
    'system',
    'en',
    'ar'
);


--
-- Name: location_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.location_provider AS ENUM (
    'gps',
    'network',
    'fused'
);


--
-- Name: media_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.media_kind AS ENUM (
    'image',
    'document'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'check_in',
    'check_out',
    'late_warning',
    'geofence_exit',
    'leave_decided',
    'correction_decided',
    'new_content',
    'fraud_flagged',
    'hours_completed',
    'target_set'
);


--
-- Name: otp_purpose; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.otp_purpose AS ENUM (
    'login',
    'password_reset'
);


--
-- Name: outside_geofence_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.outside_geofence_action AS ENUM (
    'block',
    'flag'
);


--
-- Name: period_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.period_status AS ENUM (
    'open',
    'draft',
    'finalized',
    'reopened'
);


--
-- Name: record_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.record_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: sales_activity_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sales_activity_kind AS ENUM (
    'visit',
    'order'
);


--
-- Name: share_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.share_channel AS ENUM (
    'whatsapp',
    'sms',
    'email',
    'link',
    'other'
);


--
-- Name: status_change_cause; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_change_cause AS ENUM (
    'check_in',
    'check_out',
    'fraud_flagged',
    'review_confirmed',
    'review_cleared',
    'correction_approved',
    'leave_approved',
    'leave_cancelled',
    'absent_marked',
    'month_correction'
);


--
-- Name: summary_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.summary_status AS ENUM (
    'draft',
    'finalized'
);


--
-- Name: theme_pref; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.theme_pref AS ENUM (
    'system',
    'light',
    'dark'
);


--
-- Name: attendance_event_guard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.attendance_event_guard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (TG_OP <> 'INSERT' AND attendance_month_locked(OLD.work_date))
     OR (TG_OP <> 'DELETE' AND attendance_month_locked(NEW.work_date)) THEN
    RAISE EXCEPTION 'attendance for % is in a finalized month; an HR Admin must re-open it first',
      to_char(coalesce(NEW.work_date, OLD.work_date), 'YYYY-MM') USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'attendance records are never deleted' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.status = 'confirmed_fake' AND (TG_OP = 'INSERT' OR OLD.status <> 'confirmed_fake') THEN
    IF TG_OP = 'INSERT' OR OLD.status <> 'suspected_fake' THEN
      RAISE EXCEPTION 'confirmed_fake can only follow suspected_fake (BR-ATT-01)' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  -- Leaving Suspected Fake (either way) is a fresh human review: new reviewer timestamp + remark.
  IF TG_OP = 'UPDATE' AND OLD.status = 'suspected_fake' AND NEW.status <> 'suspected_fake'
     AND (NEW.reviewed_by IS NULL OR NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at
          OR coalesce(trim(NEW.review_notes), '') = '') THEN
    RAISE EXCEPTION 'a suspected fake check-in needs a human review with a remark before its status changes (FR-ATM-02)'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;


--
-- Name: attendance_month_locked(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.attendance_month_locked(p_date date) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM attendance_period
    WHERE year = extract(year FROM p_date) AND month = extract(month FROM p_date) AND status = 'finalized'
  )
$$;


--
-- Name: attendance_status_trail(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.attendance_status_trail() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_cause text := nullif(current_setting('sfms.change_cause', true), '');
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NULL;
  END IF;
  IF v_cause IS NULL THEN
    RAISE EXCEPTION 'attendance status change without a declared cause (set sfms.change_cause in the transaction)'
      USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO attendance_status_change
    (event_id, from_status, to_status, cause, actor_id, reason, fraud_signal_id, correction_request_id, leave_request_id)
  VALUES (
    NEW.event_id,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status END,
    NEW.status,
    v_cause::status_change_cause,
    nullif(current_setting('sfms.actor_id', true), ''),
    nullif(current_setting('sfms.reason', true), ''),
    nullif(current_setting('sfms.fraud_signal_id', true), '')::uuid,
    nullif(current_setting('sfms.correction_request_id', true), '')::uuid,
    nullif(current_setting('sfms.leave_request_id', true), '')::uuid
  );
  RETURN NULL;
END $$;


--
-- Name: audit_log_chain(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_log_chain() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit_log_chain')); -- one link at a time
  SELECT hash INTO NEW.prev_hash FROM audit_log ORDER BY log_id DESC LIMIT 1;
  NEW.hash := audit_log_row_digest(NEW);
  RETURN NEW;
END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    log_id bigint NOT NULL,
    actor_id text,
    actor_type public.actor_type NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text NOT NULL,
    before_value jsonb,
    after_value jsonb,
    reason text,
    request_id text,
    ip inet,
    user_agent text,
    occurred_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    prev_hash bytea,
    hash bytea NOT NULL,
    CONSTRAINT audit_log_check CHECK (((actor_type = 'employee'::public.actor_type) = (actor_id IS NOT NULL)))
);


--
-- Name: audit_log_row_digest(public.audit_log); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_log_row_digest(r public.audit_log) RETURNS bytea
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT sha256(convert_to(concat_ws('|',
    coalesce(encode(r.prev_hash, 'hex'), ''), r.actor_id, r.actor_type, r.action, r.entity, r.entity_id,
    r.before_value::text, r.after_value::text, r.reason, r.request_id, r.ip::text, r.user_agent,
    to_char(r.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')), 'UTF8'))
$$;


--
-- Name: audit_log_verify(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_log_verify() RETURNS bigint
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  r audit_log;
  prev bytea := NULL;
BEGIN
  FOR r IN SELECT * FROM audit_log ORDER BY log_id LOOP
    IF r.prev_hash IS DISTINCT FROM prev OR r.hash <> audit_log_row_digest(r) THEN
      RETURN r.log_id;
    END IF;
    prev := r.hash;
  END LOOP;
  RETURN NULL;
END $$;


--
-- Name: clear_live_location_on_check_out(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clear_live_location_on_check_out() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.check_out_at IS NOT NULL AND OLD.check_out_at IS NULL THEN
    DELETE FROM employee_live_location WHERE employee_id = NEW.employee_id;
  END IF;
  RETURN NULL;
END $$;


--
-- Name: drop_location_ping_partitions_older_than(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.drop_location_ping_partitions_older_than(keep_months integer) RETURNS integer
    LANGUAGE plpgsql
    AS $_$
DECLARE
  r record;
  cutoff date := (date_trunc('month', now() AT TIME ZONE 'UTC') - make_interval(months => keep_months))::date;
  dropped integer := 0;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = 'location_ping' AND c.relname ~ '^location_ping_\d{4}_\d{2}$'
  LOOP
    IF to_date(substr(r.relname, 15), 'YYYY_MM') < cutoff THEN
      EXECUTE format('DROP TABLE %I', r.relname);
      dropped := dropped + 1;
    END IF;
  END LOOP;
  RETURN dropped;
END $_$;


--
-- Name: attendance_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_config (
    config_id uuid DEFAULT uuidv7() NOT NULL,
    scope public.config_scope NOT NULL,
    team_id uuid,
    required_work_minutes integer DEFAULT 480 NOT NULL,
    grace_minutes integer DEFAULT 15 NOT NULL,
    ping_interval_seconds integer DEFAULT 180 NOT NULL,
    outside_geofence_action public.outside_geofence_action DEFAULT 'flag'::public.outside_geofence_action NOT NULL,
    photo_required boolean DEFAULT false NOT NULL,
    shift_timeout_hours integer DEFAULT 12 NOT NULL,
    effective_from date NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_config_check CHECK (((scope = 'team'::public.config_scope) = (team_id IS NOT NULL))),
    CONSTRAINT attendance_config_grace_minutes_check CHECK (((grace_minutes >= 0) AND (grace_minutes <= 240))),
    CONSTRAINT attendance_config_ping_interval_seconds_check CHECK (((ping_interval_seconds >= 120) AND (ping_interval_seconds <= 300))),
    CONSTRAINT attendance_config_required_work_minutes_check CHECK (((required_work_minutes >= 60) AND (required_work_minutes <= 720))),
    CONSTRAINT attendance_config_shift_timeout_hours_check CHECK (((shift_timeout_hours >= 8) AND (shift_timeout_hours <= 16)))
);


--
-- Name: effective_attendance_config(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.effective_attendance_config(p_team uuid, p_date date) RETURNS public.attendance_config
    LANGUAGE sql STABLE
    AS $$
  SELECT c.* FROM attendance_config c
  WHERE c.effective_from <= p_date
    AND ((c.scope = 'team' AND c.team_id = p_team) OR c.scope = 'global')
  ORDER BY (c.scope = 'team') DESC, c.effective_from DESC
  LIMIT 1
$$;


--
-- Name: employee_geofences(text, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.employee_geofences(p_employee text, p_date date) RETURNS SETOF uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT DISTINCT a.geofence_id
  FROM employee e
  JOIN geofence_assignment a
    ON a.employee_id = e.employee_id OR a.team_id = e.team_id OR a.branch_id = e.branch_id
  JOIN geofence g ON g.geofence_id = a.geofence_id AND g.status = 'active'
  WHERE e.employee_id = p_employee
    AND a.valid_from <= p_date AND (a.valid_to IS NULL OR a.valid_to >= p_date)
$$;


--
-- Name: ensure_location_ping_partitions(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_location_ping_partitions(months_ahead integer DEFAULT 2) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  m date;
  created integer := 0;
  part text;
BEGIN
  FOR i IN 0..months_ahead LOOP
    m := (date_trunc('month', now() AT TIME ZONE 'UTC') + make_interval(months => i))::date;
    part := format('location_ping_%s', to_char(m, 'YYYY_MM'));
    IF to_regclass(part) IS NULL THEN
      EXECUTE format('CREATE TABLE %I PARTITION OF location_ping FOR VALUES FROM (%L) TO (%L)', part, m::timestamptz, (m + interval '1 month')::timestamptz);
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', part);
      created := created + 1;
    END IF;
  END LOOP;
  RETURN created;
END $$;


--
-- Name: forbid_mutation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.forbid_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP USING ERRCODE = 'P0001';
END $$;


--
-- Name: geofence_distance_m(uuid, public.geography); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.geofence_distance_m(p_geofence uuid, p_point public.geography) RETURNS double precision
    LANGUAGE sql STABLE
    AS $$
  SELECT CASE g.type
    WHEN 'circle' THEN greatest(ST_Distance(g.center, p_point) - g.radius_m, 0)
    ELSE ST_Distance(g.area, p_point)
  END
  FROM geofence g WHERE g.geofence_id = p_geofence
$$;


--
-- Name: location_ping_in_shift(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.location_ping_in_shift() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  e attendance_event%ROWTYPE;
  timeout_h integer;
  skew constant interval := interval '2 minutes';
BEGIN
  SELECT * INTO e FROM attendance_event WHERE event_id = NEW.attendance_event_id;
  IF e.employee_id IS DISTINCT FROM NEW.employee_id THEN
    RAISE EXCEPTION 'ping employee does not match its attendance record' USING ERRCODE = 'P0001';
  END IF;
  SELECT shift_timeout_hours INTO timeout_h FROM attendance_config WHERE config_id = e.config_id;
  IF e.check_in_at IS NULL
     OR NEW.recorded_at < e.check_in_at - skew
     OR NEW.recorded_at > coalesce(e.check_out_at, e.check_in_at + make_interval(hours => timeout_h)) + skew THEN
    RAISE EXCEPTION 'location ping outside the checked-in shift is not accepted (FR-LOC-03)' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;


--
-- Name: sales_activity_guard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sales_activity_guard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE e attendance_event%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'sales activity is never deleted; void it instead' USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.activity_id, NEW.employee_id, NEW.attendance_event_id, NEW.work_date, NEW.kind, NEW.customer_name, NEW.note, NEW.occurred_at, NEW.lat, NEW.lng)
       IS DISTINCT FROM (OLD.activity_id, OLD.employee_id, OLD.attendance_event_id, OLD.work_date, OLD.kind, OLD.customer_name, OLD.note, OLD.occurred_at, OLD.lat, OLD.lng)
       OR OLD.voided_at IS NOT NULL THEN
      RAISE EXCEPTION 'sales activity can only be voided, once' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO e FROM attendance_event WHERE event_id = NEW.attendance_event_id;
  IF e.employee_id IS DISTINCT FROM NEW.employee_id OR e.work_date IS DISTINCT FROM NEW.work_date THEN
    RAISE EXCEPTION 'sales activity does not match its attendance record' USING ERRCODE = 'P0001';
  END IF;
  IF e.check_in_at IS NULL OR e.check_out_at IS NOT NULL OR NEW.occurred_at < e.check_in_at THEN
    RAISE EXCEPTION 'visits and orders are logged only while checked in' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;


--
-- Name: api_client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_client (
    client_id uuid DEFAULT uuidv7() NOT NULL,
    name text NOT NULL,
    key_hash text NOT NULL,
    scopes text[] DEFAULT '{summary:read}'::text[] NOT NULL,
    allowed_ips cidr[],
    status public.record_status DEFAULT 'active'::public.record_status NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: attendance_break; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_break (
    break_id uuid DEFAULT uuidv7() NOT NULL,
    event_id uuid NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    CONSTRAINT attendance_break_check CHECK (((ended_at IS NULL) OR (ended_at >= started_at)))
);


--
-- Name: attendance_correction_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_correction_request (
    request_id uuid DEFAULT uuidv7() NOT NULL,
    event_id uuid NOT NULL,
    employee_id text NOT NULL,
    requested_check_in_at timestamp with time zone,
    requested_check_out_at timestamp with time zone,
    reason text NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    decided_by text,
    decided_at timestamp with time zone,
    decision_remark text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_correction_request_check CHECK ((num_nonnulls(requested_check_in_at, requested_check_out_at) >= 1)),
    CONSTRAINT attendance_correction_request_check1 CHECK (((requested_check_out_at IS NULL) OR (requested_check_in_at IS NULL) OR (requested_check_out_at > requested_check_in_at))),
    CONSTRAINT attendance_correction_request_check2 CHECK (((status = ANY (ARRAY['approved'::public.request_status, 'rejected'::public.request_status])) = ((decided_by IS NOT NULL) AND (decided_at IS NOT NULL)))),
    CONSTRAINT attendance_correction_request_check3 CHECK (((status <> 'rejected'::public.request_status) OR (length(TRIM(BOTH FROM decision_remark)) > 0))),
    CONSTRAINT attendance_correction_request_check4 CHECK ((decided_by IS DISTINCT FROM employee_id)),
    CONSTRAINT attendance_correction_request_reason_check CHECK ((length(TRIM(BOTH FROM reason)) > 0))
);


--
-- Name: attendance_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_event (
    event_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    work_date date NOT NULL,
    config_id uuid NOT NULL,
    window_start_at timestamp with time zone NOT NULL,
    latest_start_at timestamp with time zone NOT NULL,
    required_work_minutes integer NOT NULL,
    check_in_at timestamp with time zone,
    check_in_lat double precision,
    check_in_lng double precision,
    check_in_accuracy_m real,
    check_in_point public.geography(Point,4326) GENERATED ALWAYS AS (
CASE
    WHEN ((check_in_lat IS NULL) OR (check_in_lng IS NULL)) THEN NULL::public.geography
    ELSE (public.st_setsrid(public.st_makepoint(check_in_lng, check_in_lat), 4326))::public.geography
END) STORED,
    check_in_device_id uuid,
    check_in_geofence_id uuid,
    check_in_inside_geofence boolean,
    check_in_distance_m real,
    check_out_at timestamp with time zone,
    check_out_lat double precision,
    check_out_lng double precision,
    check_out_accuracy_m real,
    check_out_point public.geography(Point,4326) GENERATED ALWAYS AS (
CASE
    WHEN ((check_out_lat IS NULL) OR (check_out_lng IS NULL)) THEN NULL::public.geography
    ELSE (public.st_setsrid(public.st_makepoint(check_out_lng, check_out_lat), 4326))::public.geography
END) STORED,
    check_out_inside_geofence boolean,
    check_out_source public.check_out_source,
    is_late boolean DEFAULT false NOT NULL,
    late_minutes integer DEFAULT 0 NOT NULL,
    worked_minutes integer,
    shortfall_minutes integer GENERATED ALWAYS AS (
CASE
    WHEN ((check_out_at IS NULL) OR (worked_minutes IS NULL)) THEN NULL::integer
    ELSE GREATEST((required_work_minutes - worked_minutes), 0)
END) STORED,
    is_short_hours boolean GENERATED ALWAYS AS (((check_out_at IS NOT NULL) AND (worked_minutes IS NOT NULL) AND (worked_minutes < required_work_minutes))) STORED,
    status public.attendance_status NOT NULL,
    review_notes text,
    reviewed_by text,
    reviewed_at timestamp with time zone,
    leave_request_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_event_check CHECK ((latest_start_at >= window_start_at)),
    CONSTRAINT attendance_event_check1 CHECK (((check_in_lat IS NULL) = (check_in_lng IS NULL))),
    CONSTRAINT attendance_event_check10 CHECK (((status <> 'confirmed_fake'::public.attendance_status) OR ((reviewed_by IS NOT NULL) AND (length(TRIM(BOTH FROM review_notes)) > 0)))),
    CONSTRAINT attendance_event_check11 CHECK ((reviewed_by IS DISTINCT FROM employee_id)),
    CONSTRAINT attendance_event_check2 CHECK (((check_out_lat IS NULL) = (check_out_lng IS NULL))),
    CONSTRAINT attendance_event_check3 CHECK (((check_in_at IS NOT NULL) OR (check_in_lat IS NULL))),
    CONSTRAINT attendance_event_check4 CHECK (((check_out_at IS NULL) OR ((check_in_at IS NOT NULL) AND (check_out_at >= check_in_at)))),
    CONSTRAINT attendance_event_check5 CHECK (((check_out_at IS NULL) = (check_out_source IS NULL))),
    CONSTRAINT attendance_event_check6 CHECK (((check_out_at IS NULL) = (worked_minutes IS NULL))),
    CONSTRAINT attendance_event_check7 CHECK (((status = ANY (ARRAY['absent'::public.attendance_status, 'on_leave'::public.attendance_status])) = (check_in_at IS NULL))),
    CONSTRAINT attendance_event_check8 CHECK (((status <> 'on_leave'::public.attendance_status) OR (leave_request_id IS NOT NULL))),
    CONSTRAINT attendance_event_check9 CHECK (((reviewed_by IS NULL) = (reviewed_at IS NULL))),
    CONSTRAINT attendance_event_check_in_accuracy_m_check CHECK ((check_in_accuracy_m >= (0)::double precision)),
    CONSTRAINT attendance_event_check_in_distance_m_check CHECK ((check_in_distance_m >= (0)::double precision)),
    CONSTRAINT attendance_event_check_in_lat_check CHECK (((check_in_lat >= ('-90'::integer)::double precision) AND (check_in_lat <= (90)::double precision))),
    CONSTRAINT attendance_event_check_in_lng_check CHECK (((check_in_lng >= ('-180'::integer)::double precision) AND (check_in_lng <= (180)::double precision))),
    CONSTRAINT attendance_event_check_out_accuracy_m_check CHECK ((check_out_accuracy_m >= (0)::double precision)),
    CONSTRAINT attendance_event_check_out_lat_check CHECK (((check_out_lat >= ('-90'::integer)::double precision) AND (check_out_lat <= (90)::double precision))),
    CONSTRAINT attendance_event_check_out_lng_check CHECK (((check_out_lng >= ('-180'::integer)::double precision) AND (check_out_lng <= (180)::double precision))),
    CONSTRAINT attendance_event_late_minutes_check CHECK ((late_minutes >= 0)),
    CONSTRAINT attendance_event_required_work_minutes_check CHECK (((required_work_minutes >= 60) AND (required_work_minutes <= 720))),
    CONSTRAINT attendance_event_worked_minutes_check CHECK ((worked_minutes >= 0))
);


--
-- Name: attendance_period; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_period (
    period_id uuid DEFAULT uuidv7() NOT NULL,
    year smallint NOT NULL,
    month smallint NOT NULL,
    status public.period_status DEFAULT 'open'::public.period_status NOT NULL,
    computed_at timestamp with time zone,
    finalized_by text,
    finalized_at timestamp with time zone,
    reopened_by text,
    reopened_at timestamp with time zone,
    reopen_reason text,
    CONSTRAINT attendance_period_check CHECK (((status <> 'finalized'::public.period_status) OR ((finalized_by IS NOT NULL) AND (finalized_at IS NOT NULL)))),
    CONSTRAINT attendance_period_check1 CHECK (((status <> 'reopened'::public.period_status) OR ((reopened_by IS NOT NULL) AND (reopened_at IS NOT NULL) AND (length(TRIM(BOTH FROM reopen_reason)) > 0)))),
    CONSTRAINT attendance_period_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT attendance_period_year_check CHECK (((year >= 2024) AND (year <= 2100)))
);


--
-- Name: attendance_photo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_photo (
    photo_id uuid DEFAULT uuidv7() NOT NULL,
    event_id uuid NOT NULL,
    phase public.attendance_phase NOT NULL,
    storage_key text NOT NULL,
    liveness_passed boolean,
    liveness_score real,
    captured_at timestamp with time zone NOT NULL,
    CONSTRAINT attendance_photo_liveness_score_check CHECK (((liveness_score >= (0)::double precision) AND (liveness_score <= (1)::double precision)))
);


--
-- Name: attendance_status_change; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_status_change (
    change_id uuid DEFAULT uuidv7() NOT NULL,
    event_id uuid NOT NULL,
    from_status public.attendance_status,
    to_status public.attendance_status NOT NULL,
    cause public.status_change_cause NOT NULL,
    actor_id text,
    reason text,
    fraud_signal_id uuid,
    correction_request_id uuid,
    leave_request_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_status_change_check CHECK (((cause <> ALL (ARRAY['review_confirmed'::public.status_change_cause, 'review_cleared'::public.status_change_cause, 'correction_approved'::public.status_change_cause, 'month_correction'::public.status_change_cause])) OR ((actor_id IS NOT NULL) AND (length(TRIM(BOTH FROM reason)) > 0)))),
    CONSTRAINT attendance_status_change_check1 CHECK (((cause <> 'fraud_flagged'::public.status_change_cause) OR (fraud_signal_id IS NOT NULL)))
);


--
-- Name: attendance_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_summary (
    summary_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    year smallint NOT NULL,
    month smallint NOT NULL,
    present_days smallint DEFAULT 0 NOT NULL,
    absent_days smallint DEFAULT 0 NOT NULL,
    late_count smallint DEFAULT 0 NOT NULL,
    confirmed_fake_count smallint DEFAULT 0 NOT NULL,
    leave_days smallint DEFAULT 0 NOT NULL,
    short_hours_count smallint DEFAULT 0 NOT NULL,
    status public.summary_status DEFAULT 'draft'::public.summary_status NOT NULL,
    finalized_by text,
    finalized_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_summary_absent_days_check CHECK ((absent_days >= 0)),
    CONSTRAINT attendance_summary_check CHECK ((late_count <= present_days)),
    CONSTRAINT attendance_summary_check1 CHECK ((short_hours_count <= (present_days + confirmed_fake_count))),
    CONSTRAINT attendance_summary_check2 CHECK (((status = 'finalized'::public.summary_status) = ((finalized_by IS NOT NULL) AND (finalized_at IS NOT NULL)))),
    CONSTRAINT attendance_summary_confirmed_fake_count_check CHECK ((confirmed_fake_count >= 0)),
    CONSTRAINT attendance_summary_late_count_check CHECK ((late_count >= 0)),
    CONSTRAINT attendance_summary_leave_days_check CHECK ((leave_days >= 0)),
    CONSTRAINT attendance_summary_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT attendance_summary_present_days_check CHECK ((present_days >= 0)),
    CONSTRAINT attendance_summary_short_hours_count_check CHECK ((short_hours_count >= 0)),
    CONSTRAINT attendance_summary_version_check CHECK ((version >= 1)),
    CONSTRAINT attendance_summary_year_check CHECK (((year >= 2024) AND (year <= 2100)))
);


--
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ALTER COLUMN log_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_log_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_session (
    session_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    device_id uuid,
    client public.client_kind NOT NULL,
    refresh_token_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    revoke_reason text,
    CONSTRAINT auth_session_check CHECK (((client = 'mobile'::public.client_kind) = (device_id IS NOT NULL))),
    CONSTRAINT auth_session_check1 CHECK ((expires_at > created_at))
);


--
-- Name: branch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch (
    branch_id uuid DEFAULT uuidv7() NOT NULL,
    code text NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    timezone text DEFAULT 'Asia/Riyadh'::text NOT NULL,
    status public.record_status DEFAULT 'active'::public.record_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT branch_code_check CHECK ((code ~ '^[A-Z0-9-]{2,16}$'::text)),
    CONSTRAINT branch_name_ar_check CHECK ((length(TRIM(BOTH FROM name_ar)) > 0)),
    CONSTRAINT branch_name_en_check CHECK ((length(TRIM(BOTH FROM name_en)) > 0))
);


--
-- Name: consent_document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_document (
    version text NOT NULL,
    body_en text NOT NULL,
    body_ar text NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credential (
    employee_id text NOT NULL,
    password_hash text NOT NULL,
    must_change_password boolean DEFAULT true NOT NULL,
    password_changed_at timestamp with time zone,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    CONSTRAINT credential_failed_attempts_check CHECK ((failed_attempts >= 0)),
    CONSTRAINT credential_password_hash_check CHECK ((password_hash ~~ '$argon2id$%'::text))
);


--
-- Name: customer_visit_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_visit_note (
    note_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    product_id uuid,
    share_id uuid,
    customer_name text,
    note text NOT NULL,
    visited_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_visit_note_note_check CHECK ((length(TRIM(BOTH FROM note)) > 0))
);


--
-- Name: device; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device (
    device_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    platform public.device_platform NOT NULL,
    install_id text NOT NULL,
    model text,
    os_version text,
    app_version text,
    push_token text,
    integrity jsonb DEFAULT '{}'::jsonb NOT NULL,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee (
    employee_id text NOT NULL,
    full_name_en text NOT NULL,
    full_name_ar text NOT NULL,
    email public.citext,
    mobile_e164 text,
    role public.employee_role NOT NULL,
    branch_id uuid NOT NULL,
    team_id uuid,
    shift_start time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    latest_start time without time zone DEFAULT '12:00:00'::time without time zone NOT NULL,
    weekly_off_days smallint[] DEFAULT '{5,6}'::smallint[] NOT NULL,
    status public.record_status DEFAULT 'active'::public.record_status NOT NULL,
    deactivated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_check CHECK ((latest_start >= shift_start)),
    CONSTRAINT employee_check2 CHECK (((status = 'inactive'::public.record_status) = (deactivated_at IS NOT NULL))),
    CONSTRAINT employee_employee_id_check CHECK ((employee_id ~ '^[A-Za-z0-9][A-Za-z0-9-]{1,31}$'::text)),
    CONSTRAINT employee_full_name_ar_check CHECK ((length(TRIM(BOTH FROM full_name_ar)) > 0)),
    CONSTRAINT employee_full_name_en_check CHECK ((length(TRIM(BOTH FROM full_name_en)) > 0)),
    CONSTRAINT employee_mobile_e164_check CHECK ((mobile_e164 ~ '^\+[1-9][0-9]{7,14}$'::text)),
    CONSTRAINT employee_role_admin_or_rep CHECK ((role = ANY (ARRAY['super_admin'::public.employee_role, 'sales_rep'::public.employee_role]))),
    CONSTRAINT employee_weekly_off_days_check CHECK ((weekly_off_days <@ '{1,2,3,4,5,6,7}'::smallint[]))
);


--
-- Name: employee_live_location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_live_location (
    employee_id text NOT NULL,
    attendance_event_id uuid NOT NULL,
    ping_id uuid NOT NULL,
    recorded_at timestamp with time zone NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    accuracy_m real,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fraud_signal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fraud_signal (
    signal_id uuid DEFAULT uuidv7() NOT NULL,
    event_id uuid NOT NULL,
    ping_id uuid,
    phase public.fraud_phase NOT NULL,
    type public.fraud_signal_type NOT NULL,
    evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
    detected_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: geofence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geofence (
    geofence_id uuid DEFAULT uuidv7() NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    type public.geofence_type NOT NULL,
    center public.geography(Point,4326),
    radius_m integer,
    area public.geography(Polygon,4326),
    status public.record_status DEFAULT 'active'::public.record_status NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT geofence_check CHECK ((((type = 'circle'::public.geofence_type) AND (center IS NOT NULL) AND ((radius_m >= 10) AND (radius_m <= 5000)) AND (area IS NULL)) OR ((type = 'polygon'::public.geofence_type) AND (area IS NOT NULL) AND (center IS NULL) AND (radius_m IS NULL)))),
    CONSTRAINT geofence_name_ar_check CHECK ((length(TRIM(BOTH FROM name_ar)) > 0)),
    CONSTRAINT geofence_name_en_check CHECK ((length(TRIM(BOTH FROM name_en)) > 0))
);


--
-- Name: geofence_assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geofence_assignment (
    assignment_id uuid DEFAULT uuidv7() NOT NULL,
    geofence_id uuid NOT NULL,
    employee_id text,
    team_id uuid,
    branch_id uuid,
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT geofence_assignment_check CHECK ((num_nonnulls(employee_id, team_id, branch_id) = 1)),
    CONSTRAINT geofence_assignment_check1 CHECK (((valid_to IS NULL) OR (valid_to >= valid_from)))
);


--
-- Name: holiday; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.holiday (
    holiday_id uuid DEFAULT uuidv7() NOT NULL,
    date date NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    kind public.holiday_kind NOT NULL,
    branch_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leave_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_request (
    request_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    type public.leave_type DEFAULT 'leave'::public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    decided_by text,
    decided_at timestamp with time zone,
    decision_remark text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT leave_request_check CHECK ((end_date >= start_date)),
    CONSTRAINT leave_request_check1 CHECK (((status = ANY (ARRAY['approved'::public.request_status, 'rejected'::public.request_status])) = ((decided_by IS NOT NULL) AND (decided_at IS NOT NULL)))),
    CONSTRAINT leave_request_check2 CHECK (((status <> 'rejected'::public.request_status) OR (length(TRIM(BOTH FROM decision_remark)) > 0))),
    CONSTRAINT leave_request_check3 CHECK ((decided_by IS DISTINCT FROM employee_id)),
    CONSTRAINT leave_request_reason_check CHECK ((length(TRIM(BOTH FROM reason)) > 0))
);


--
-- Name: location_ping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_ping (
    ping_id uuid NOT NULL,
    employee_id text NOT NULL,
    attendance_event_id uuid NOT NULL,
    recorded_at timestamp with time zone NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    accuracy_m real,
    speed_mps real,
    heading_deg real,
    provider public.location_provider,
    is_mock boolean DEFAULT false NOT NULL,
    CONSTRAINT location_ping_accuracy_m_check CHECK ((accuracy_m >= (0)::double precision)),
    CONSTRAINT location_ping_heading_deg_check CHECK (((heading_deg >= (0)::double precision) AND (heading_deg < (360)::double precision))),
    CONSTRAINT location_ping_lat_check CHECK (((lat >= ('-90'::integer)::double precision) AND (lat <= (90)::double precision))),
    CONSTRAINT location_ping_lng_check CHECK (((lng >= ('-180'::integer)::double precision) AND (lng <= (180)::double precision))),
    CONSTRAINT location_ping_speed_mps_check CHECK ((speed_mps >= (0)::double precision))
)
PARTITION BY RANGE (recorded_at);


--
-- Name: location_ping_2026_10; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_ping_2026_10 (
    ping_id uuid CONSTRAINT location_ping_ping_id_not_null NOT NULL,
    employee_id text CONSTRAINT location_ping_employee_id_not_null NOT NULL,
    attendance_event_id uuid CONSTRAINT location_ping_attendance_event_id_not_null NOT NULL,
    recorded_at timestamp with time zone CONSTRAINT location_ping_recorded_at_not_null NOT NULL,
    received_at timestamp with time zone DEFAULT now() CONSTRAINT location_ping_received_at_not_null NOT NULL,
    lat double precision CONSTRAINT location_ping_lat_not_null NOT NULL,
    lng double precision CONSTRAINT location_ping_lng_not_null NOT NULL,
    accuracy_m real,
    speed_mps real,
    heading_deg real,
    provider public.location_provider,
    is_mock boolean DEFAULT false CONSTRAINT location_ping_is_mock_not_null NOT NULL,
    CONSTRAINT location_ping_accuracy_m_check CHECK ((accuracy_m >= (0)::double precision)),
    CONSTRAINT location_ping_heading_deg_check CHECK (((heading_deg >= (0)::double precision) AND (heading_deg < (360)::double precision))),
    CONSTRAINT location_ping_lat_check CHECK (((lat >= ('-90'::integer)::double precision) AND (lat <= (90)::double precision))),
    CONSTRAINT location_ping_lng_check CHECK (((lng >= ('-180'::integer)::double precision) AND (lng <= (180)::double precision))),
    CONSTRAINT location_ping_speed_mps_check CHECK ((speed_mps >= (0)::double precision))
);


--
-- Name: location_ping_2026_11; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_ping_2026_11 (
    ping_id uuid CONSTRAINT location_ping_ping_id_not_null NOT NULL,
    employee_id text CONSTRAINT location_ping_employee_id_not_null NOT NULL,
    attendance_event_id uuid CONSTRAINT location_ping_attendance_event_id_not_null NOT NULL,
    recorded_at timestamp with time zone CONSTRAINT location_ping_recorded_at_not_null NOT NULL,
    received_at timestamp with time zone DEFAULT now() CONSTRAINT location_ping_received_at_not_null NOT NULL,
    lat double precision CONSTRAINT location_ping_lat_not_null NOT NULL,
    lng double precision CONSTRAINT location_ping_lng_not_null NOT NULL,
    accuracy_m real,
    speed_mps real,
    heading_deg real,
    provider public.location_provider,
    is_mock boolean DEFAULT false CONSTRAINT location_ping_is_mock_not_null NOT NULL,
    CONSTRAINT location_ping_accuracy_m_check CHECK ((accuracy_m >= (0)::double precision)),
    CONSTRAINT location_ping_heading_deg_check CHECK (((heading_deg >= (0)::double precision) AND (heading_deg < (360)::double precision))),
    CONSTRAINT location_ping_lat_check CHECK (((lat >= ('-90'::integer)::double precision) AND (lat <= (90)::double precision))),
    CONSTRAINT location_ping_lng_check CHECK (((lng >= ('-180'::integer)::double precision) AND (lng <= (180)::double precision))),
    CONSTRAINT location_ping_speed_mps_check CHECK ((speed_mps >= (0)::double precision))
);


--
-- Name: location_ping_2026_12; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_ping_2026_12 (
    ping_id uuid CONSTRAINT location_ping_ping_id_not_null NOT NULL,
    employee_id text CONSTRAINT location_ping_employee_id_not_null NOT NULL,
    attendance_event_id uuid CONSTRAINT location_ping_attendance_event_id_not_null NOT NULL,
    recorded_at timestamp with time zone CONSTRAINT location_ping_recorded_at_not_null NOT NULL,
    received_at timestamp with time zone DEFAULT now() CONSTRAINT location_ping_received_at_not_null NOT NULL,
    lat double precision CONSTRAINT location_ping_lat_not_null NOT NULL,
    lng double precision CONSTRAINT location_ping_lng_not_null NOT NULL,
    accuracy_m real,
    speed_mps real,
    heading_deg real,
    provider public.location_provider,
    is_mock boolean DEFAULT false CONSTRAINT location_ping_is_mock_not_null NOT NULL,
    CONSTRAINT location_ping_accuracy_m_check CHECK ((accuracy_m >= (0)::double precision)),
    CONSTRAINT location_ping_heading_deg_check CHECK (((heading_deg >= (0)::double precision) AND (heading_deg < (360)::double precision))),
    CONSTRAINT location_ping_lat_check CHECK (((lat >= ('-90'::integer)::double precision) AND (lat <= (90)::double precision))),
    CONSTRAINT location_ping_lng_check CHECK (((lng >= ('-180'::integer)::double precision) AND (lng <= (180)::double precision))),
    CONSTRAINT location_ping_speed_mps_check CHECK ((speed_mps >= (0)::double precision))
);


--
-- Name: location_ping_default; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_ping_default (
    ping_id uuid CONSTRAINT location_ping_ping_id_not_null NOT NULL,
    employee_id text CONSTRAINT location_ping_employee_id_not_null NOT NULL,
    attendance_event_id uuid CONSTRAINT location_ping_attendance_event_id_not_null NOT NULL,
    recorded_at timestamp with time zone CONSTRAINT location_ping_recorded_at_not_null NOT NULL,
    received_at timestamp with time zone DEFAULT now() CONSTRAINT location_ping_received_at_not_null NOT NULL,
    lat double precision CONSTRAINT location_ping_lat_not_null NOT NULL,
    lng double precision CONSTRAINT location_ping_lng_not_null NOT NULL,
    accuracy_m real,
    speed_mps real,
    heading_deg real,
    provider public.location_provider,
    is_mock boolean DEFAULT false CONSTRAINT location_ping_is_mock_not_null NOT NULL,
    CONSTRAINT location_ping_accuracy_m_check CHECK ((accuracy_m >= (0)::double precision)),
    CONSTRAINT location_ping_heading_deg_check CHECK (((heading_deg >= (0)::double precision) AND (heading_deg < (360)::double precision))),
    CONSTRAINT location_ping_lat_check CHECK (((lat >= ('-90'::integer)::double precision) AND (lat <= (90)::double precision))),
    CONSTRAINT location_ping_lng_check CHECK (((lng >= ('-180'::integer)::double precision) AND (lng <= (180)::double precision))),
    CONSTRAINT location_ping_speed_mps_check CHECK ((speed_mps >= (0)::double precision))
);


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    notification_id uuid DEFAULT uuidv7() NOT NULL,
    recipient_id text NOT NULL,
    type public.notification_type NOT NULL,
    message_key text NOT NULL,
    params jsonb DEFAULT '{}'::jsonb NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    read_at timestamp with time zone
);


--
-- Name: otp_challenge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_challenge (
    otp_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    purpose public.otp_purpose NOT NULL,
    code_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT otp_challenge_attempts_check CHECK (((attempts >= 0) AND (attempts <= 10)))
);


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    product_id uuid DEFAULT uuidv7() NOT NULL,
    item_type public.item_type DEFAULT 'product'::public.item_type NOT NULL,
    category_id uuid,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    description_en text DEFAULT ''::text NOT NULL,
    description_ar text DEFAULT ''::text NOT NULL,
    valid_from date,
    valid_to date,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    share_slug text DEFAULT "left"(replace((gen_random_uuid())::text, '-'::text, ''::text), 12) NOT NULL,
    published_at timestamp with time zone,
    published_by text,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_check CHECK (((valid_to IS NULL) OR (valid_from IS NULL) OR (valid_to >= valid_from))),
    CONSTRAINT product_check1 CHECK (((status = 'published'::public.content_status) <= (published_at IS NOT NULL))),
    CONSTRAINT product_name_ar_check CHECK ((length(TRIM(BOTH FROM name_ar)) > 0)),
    CONSTRAINT product_name_en_check CHECK ((length(TRIM(BOTH FROM name_en)) > 0)),
    CONSTRAINT product_share_slug_check CHECK ((share_slug ~ '^[A-Za-z0-9_-]{6,32}$'::text))
);


--
-- Name: product_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_category (
    category_id uuid DEFAULT uuidv7() NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    status public.record_status DEFAULT 'active'::public.record_status NOT NULL,
    CONSTRAINT product_category_name_ar_check CHECK ((length(TRIM(BOTH FROM name_ar)) > 0)),
    CONSTRAINT product_category_name_en_check CHECK ((length(TRIM(BOTH FROM name_en)) > 0))
);


--
-- Name: product_import_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_import_job (
    job_id uuid DEFAULT uuidv7() NOT NULL,
    uploaded_by text NOT NULL,
    file_key text NOT NULL,
    status public.job_status DEFAULT 'pending'::public.job_status NOT NULL,
    total_rows integer,
    imported_rows integer,
    errors jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone
);


--
-- Name: product_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_media (
    media_id uuid DEFAULT uuidv7() NOT NULL,
    product_id uuid NOT NULL,
    kind public.media_kind DEFAULT 'image'::public.media_kind NOT NULL,
    storage_key text NOT NULL,
    alt_en text DEFAULT ''::text NOT NULL,
    alt_ar text DEFAULT ''::text NOT NULL,
    width integer,
    height integer,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT product_media_height_check CHECK ((height > 0)),
    CONSTRAINT product_media_width_check CHECK ((width > 0))
);


--
-- Name: sales_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_activity (
    activity_id uuid NOT NULL,
    employee_id text NOT NULL,
    attendance_event_id uuid NOT NULL,
    work_date date NOT NULL,
    kind public.sales_activity_kind NOT NULL,
    customer_name text NOT NULL,
    note text,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    lat double precision,
    lng double precision,
    accuracy_m real,
    voided_at timestamp with time zone,
    voided_by text,
    void_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sales_activity_accuracy_m_check CHECK ((accuracy_m >= (0)::double precision)),
    CONSTRAINT sales_activity_check CHECK (((lat IS NULL) = (lng IS NULL))),
    CONSTRAINT sales_activity_check1 CHECK (((voided_at IS NULL) = (voided_by IS NULL))),
    CONSTRAINT sales_activity_check2 CHECK (((voided_at IS NULL) OR (length(TRIM(BOTH FROM void_reason)) > 0))),
    CONSTRAINT sales_activity_customer_name_check CHECK (((length(TRIM(BOTH FROM customer_name)) >= 1) AND (length(TRIM(BOTH FROM customer_name)) <= 120))),
    CONSTRAINT sales_activity_lat_check CHECK (((lat >= ('-90'::integer)::double precision) AND (lat <= (90)::double precision))),
    CONSTRAINT sales_activity_lng_check CHECK (((lng >= ('-180'::integer)::double precision) AND (lng <= (180)::double precision))),
    CONSTRAINT sales_activity_note_check CHECK ((length(note) <= 500))
);


--
-- Name: sales_target; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_target (
    target_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    month date NOT NULL,
    visits_target integer DEFAULT 0 NOT NULL,
    orders_target integer DEFAULT 0 NOT NULL,
    note text,
    set_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sales_target_check CHECK (((visits_target > 0) OR (orders_target > 0))),
    CONSTRAINT sales_target_month_check CHECK ((month = (date_trunc('month'::text, (month)::timestamp with time zone))::date)),
    CONSTRAINT sales_target_note_check CHECK ((length(note) <= 500)),
    CONSTRAINT sales_target_orders_target_check CHECK (((orders_target >= 0) AND (orders_target <= 100000))),
    CONSTRAINT sales_target_visits_target_check CHECK (((visits_target >= 0) AND (visits_target <= 100000)))
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: share_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.share_event (
    share_id uuid NOT NULL,
    employee_id text NOT NULL,
    product_id uuid NOT NULL,
    channel public.share_channel NOT NULL,
    recipient text,
    shared_at timestamp with time zone NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: system_setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_setting (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_by text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT system_setting_key_check CHECK ((key ~ '^[a-z][a-z0-9_.]+$'::text))
);


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    team_id uuid DEFAULT uuidv7() NOT NULL,
    branch_id uuid NOT NULL,
    name_en text NOT NULL,
    name_ar text NOT NULL,
    status public.record_status DEFAULT 'active'::public.record_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT team_name_ar_check CHECK ((length(TRIM(BOTH FROM name_ar)) > 0)),
    CONSTRAINT team_name_en_check CHECK ((length(TRIM(BOTH FROM name_en)) > 0))
);


--
-- Name: tracking_consent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracking_consent (
    consent_id uuid DEFAULT uuidv7() NOT NULL,
    employee_id text NOT NULL,
    consent_version text NOT NULL,
    device_id uuid,
    app_version text,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT tracking_consent_check CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at)))
);


--
-- Name: user_preference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preference (
    employee_id text NOT NULL,
    theme public.theme_pref DEFAULT 'system'::public.theme_pref NOT NULL,
    locale public.locale_pref DEFAULT 'system'::public.locale_pref NOT NULL,
    digits public.digits_pref DEFAULT 'western'::public.digits_pref NOT NULL,
    show_hijri boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: location_ping_2026_10; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping ATTACH PARTITION public.location_ping_2026_10 FOR VALUES FROM ('2026-10-01 00:00:00+03') TO ('2026-11-01 00:00:00+03');


--
-- Name: location_ping_2026_11; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping ATTACH PARTITION public.location_ping_2026_11 FOR VALUES FROM ('2026-11-01 00:00:00+03') TO ('2026-12-01 00:00:00+03');


--
-- Name: location_ping_2026_12; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping ATTACH PARTITION public.location_ping_2026_12 FOR VALUES FROM ('2026-12-01 00:00:00+03') TO ('2027-01-01 00:00:00+03');


--
-- Name: location_ping_default; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping ATTACH PARTITION public.location_ping_default DEFAULT;


--
-- Name: api_client api_client_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_client
    ADD CONSTRAINT api_client_key_hash_key UNIQUE (key_hash);


--
-- Name: api_client api_client_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_client
    ADD CONSTRAINT api_client_name_key UNIQUE (name);


--
-- Name: api_client api_client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_client
    ADD CONSTRAINT api_client_pkey PRIMARY KEY (client_id);


--
-- Name: attendance_break attendance_break_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_break
    ADD CONSTRAINT attendance_break_pkey PRIMARY KEY (break_id);


--
-- Name: attendance_config attendance_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_config
    ADD CONSTRAINT attendance_config_pkey PRIMARY KEY (config_id);


--
-- Name: attendance_config attendance_config_scope_team_id_effective_from_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_config
    ADD CONSTRAINT attendance_config_scope_team_id_effective_from_key UNIQUE NULLS NOT DISTINCT (scope, team_id, effective_from);


--
-- Name: attendance_correction_request attendance_correction_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_correction_request
    ADD CONSTRAINT attendance_correction_request_pkey PRIMARY KEY (request_id);


--
-- Name: attendance_event attendance_event_employee_id_work_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_employee_id_work_date_key UNIQUE (employee_id, work_date);


--
-- Name: attendance_event attendance_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_pkey PRIMARY KEY (event_id);


--
-- Name: attendance_period attendance_period_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_period
    ADD CONSTRAINT attendance_period_pkey PRIMARY KEY (period_id);


--
-- Name: attendance_period attendance_period_year_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_period
    ADD CONSTRAINT attendance_period_year_month_key UNIQUE (year, month);


--
-- Name: attendance_photo attendance_photo_event_id_phase_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_photo
    ADD CONSTRAINT attendance_photo_event_id_phase_key UNIQUE (event_id, phase);


--
-- Name: attendance_photo attendance_photo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_photo
    ADD CONSTRAINT attendance_photo_pkey PRIMARY KEY (photo_id);


--
-- Name: attendance_status_change attendance_status_change_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_status_change
    ADD CONSTRAINT attendance_status_change_pkey PRIMARY KEY (change_id);


--
-- Name: attendance_summary attendance_summary_employee_id_year_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_summary
    ADD CONSTRAINT attendance_summary_employee_id_year_month_key UNIQUE (employee_id, year, month);


--
-- Name: attendance_summary attendance_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_summary
    ADD CONSTRAINT attendance_summary_pkey PRIMARY KEY (summary_id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: auth_session auth_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_session
    ADD CONSTRAINT auth_session_pkey PRIMARY KEY (session_id);


--
-- Name: auth_session auth_session_refresh_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_session
    ADD CONSTRAINT auth_session_refresh_token_hash_key UNIQUE (refresh_token_hash);


--
-- Name: branch branch_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_code_key UNIQUE (code);


--
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (branch_id);


--
-- Name: consent_document consent_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_document
    ADD CONSTRAINT consent_document_pkey PRIMARY KEY (version);


--
-- Name: credential credential_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT credential_pkey PRIMARY KEY (employee_id);


--
-- Name: customer_visit_note customer_visit_note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visit_note
    ADD CONSTRAINT customer_visit_note_pkey PRIMARY KEY (note_id);


--
-- Name: device device_employee_id_install_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_employee_id_install_id_key UNIQUE (employee_id, install_id);


--
-- Name: device device_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_pkey PRIMARY KEY (device_id);


--
-- Name: employee employee_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_email_key UNIQUE (email);


--
-- Name: employee_live_location employee_live_location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_live_location
    ADD CONSTRAINT employee_live_location_pkey PRIMARY KEY (employee_id);


--
-- Name: employee employee_mobile_e164_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_mobile_e164_key UNIQUE (mobile_e164);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (employee_id);


--
-- Name: fraud_signal fraud_signal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_signal
    ADD CONSTRAINT fraud_signal_pkey PRIMARY KEY (signal_id);


--
-- Name: geofence_assignment geofence_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofence_assignment
    ADD CONSTRAINT geofence_assignment_pkey PRIMARY KEY (assignment_id);


--
-- Name: geofence geofence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofence
    ADD CONSTRAINT geofence_pkey PRIMARY KEY (geofence_id);


--
-- Name: holiday holiday_date_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holiday
    ADD CONSTRAINT holiday_date_branch_id_key UNIQUE NULLS NOT DISTINCT (date, branch_id);


--
-- Name: holiday holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holiday
    ADD CONSTRAINT holiday_pkey PRIMARY KEY (holiday_id);


--
-- Name: leave_request leave_request_employee_id_daterange_excl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_request
    ADD CONSTRAINT leave_request_employee_id_daterange_excl EXCLUDE USING gist (employee_id WITH =, daterange(start_date, end_date, '[]'::text) WITH &&) WHERE ((status = ANY (ARRAY['pending'::public.request_status, 'approved'::public.request_status])));


--
-- Name: leave_request leave_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_request
    ADD CONSTRAINT leave_request_pkey PRIMARY KEY (request_id);


--
-- Name: location_ping location_ping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping
    ADD CONSTRAINT location_ping_pkey PRIMARY KEY (ping_id, recorded_at);


--
-- Name: location_ping_2026_10 location_ping_2026_10_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping_2026_10
    ADD CONSTRAINT location_ping_2026_10_pkey PRIMARY KEY (ping_id, recorded_at);


--
-- Name: location_ping_2026_11 location_ping_2026_11_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping_2026_11
    ADD CONSTRAINT location_ping_2026_11_pkey PRIMARY KEY (ping_id, recorded_at);


--
-- Name: location_ping_2026_12 location_ping_2026_12_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping_2026_12
    ADD CONSTRAINT location_ping_2026_12_pkey PRIMARY KEY (ping_id, recorded_at);


--
-- Name: location_ping_default location_ping_default_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_ping_default
    ADD CONSTRAINT location_ping_default_pkey PRIMARY KEY (ping_id, recorded_at);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (notification_id);


--
-- Name: otp_challenge otp_challenge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_challenge
    ADD CONSTRAINT otp_challenge_pkey PRIMARY KEY (otp_id);


--
-- Name: product_category product_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_pkey PRIMARY KEY (category_id);


--
-- Name: product_import_job product_import_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_import_job
    ADD CONSTRAINT product_import_job_pkey PRIMARY KEY (job_id);


--
-- Name: product_media product_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_media
    ADD CONSTRAINT product_media_pkey PRIMARY KEY (media_id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- Name: product product_share_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_share_slug_key UNIQUE (share_slug);


--
-- Name: sales_activity sales_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_activity
    ADD CONSTRAINT sales_activity_pkey PRIMARY KEY (activity_id);


--
-- Name: sales_target sales_target_employee_id_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_target
    ADD CONSTRAINT sales_target_employee_id_month_key UNIQUE (employee_id, month);


--
-- Name: sales_target sales_target_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_target
    ADD CONSTRAINT sales_target_pkey PRIMARY KEY (target_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: share_event share_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_event
    ADD CONSTRAINT share_event_pkey PRIMARY KEY (share_id);


--
-- Name: system_setting system_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_pkey PRIMARY KEY (key);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (team_id);


--
-- Name: tracking_consent tracking_consent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_consent
    ADD CONSTRAINT tracking_consent_pkey PRIMARY KEY (consent_id);


--
-- Name: user_preference user_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_pkey PRIMARY KEY (employee_id);


--
-- Name: attendance_break_one_open; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX attendance_break_one_open ON public.attendance_break USING btree (event_id) WHERE (ended_at IS NULL);


--
-- Name: attendance_event_date_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_event_date_status_idx ON public.attendance_event USING btree (work_date, status);


--
-- Name: attendance_event_open_shift_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_event_open_shift_idx ON public.attendance_event USING btree (employee_id) WHERE ((check_in_at IS NOT NULL) AND (check_out_at IS NULL));


--
-- Name: attendance_event_suspected_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_event_suspected_idx ON public.attendance_event USING btree (work_date) WHERE (status = 'suspected_fake'::public.attendance_status);


--
-- Name: attendance_status_change_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_status_change_event_idx ON public.attendance_status_change USING btree (event_id, created_at);


--
-- Name: attendance_summary_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_summary_period_idx ON public.attendance_summary USING btree (year, month, status);


--
-- Name: audit_log_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_entity_idx ON public.audit_log USING btree (entity, entity_id, occurred_at);


--
-- Name: auth_session_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_session_active_idx ON public.auth_session USING btree (employee_id, client) WHERE (revoked_at IS NULL);


--
-- Name: correction_request_pending_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX correction_request_pending_idx ON public.attendance_correction_request USING btree (employee_id) WHERE (status = 'pending'::public.request_status);


--
-- Name: employee_branch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_branch_idx ON public.employee USING btree (branch_id);


--
-- Name: employee_single_admin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_single_admin_idx ON public.employee USING btree ((true)) WHERE (role = 'super_admin'::public.employee_role);


--
-- Name: employee_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_team_idx ON public.employee USING btree (team_id);


--
-- Name: fraud_signal_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fraud_signal_event_idx ON public.fraud_signal USING btree (event_id);


--
-- Name: geofence_area_gix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geofence_area_gix ON public.geofence USING gist (area);


--
-- Name: geofence_assignment_branch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geofence_assignment_branch_idx ON public.geofence_assignment USING btree (branch_id);


--
-- Name: geofence_assignment_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geofence_assignment_employee_idx ON public.geofence_assignment USING btree (employee_id);


--
-- Name: geofence_assignment_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geofence_assignment_team_idx ON public.geofence_assignment USING btree (team_id);


--
-- Name: geofence_center_gix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX geofence_center_gix ON public.geofence USING gist (center);


--
-- Name: leave_request_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_request_employee_idx ON public.leave_request USING btree (employee_id, start_date);


--
-- Name: location_ping_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_event_idx ON ONLY public.location_ping USING btree (attendance_event_id, recorded_at);


--
-- Name: location_ping_2026_10_attendance_event_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_2026_10_attendance_event_id_recorded_at_idx ON public.location_ping_2026_10 USING btree (attendance_event_id, recorded_at);


--
-- Name: location_ping_employee_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_employee_time_idx ON ONLY public.location_ping USING btree (employee_id, recorded_at);


--
-- Name: location_ping_2026_10_employee_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_2026_10_employee_id_recorded_at_idx ON public.location_ping_2026_10 USING btree (employee_id, recorded_at);


--
-- Name: location_ping_2026_11_attendance_event_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_2026_11_attendance_event_id_recorded_at_idx ON public.location_ping_2026_11 USING btree (attendance_event_id, recorded_at);


--
-- Name: location_ping_2026_11_employee_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_2026_11_employee_id_recorded_at_idx ON public.location_ping_2026_11 USING btree (employee_id, recorded_at);


--
-- Name: location_ping_2026_12_attendance_event_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_2026_12_attendance_event_id_recorded_at_idx ON public.location_ping_2026_12 USING btree (attendance_event_id, recorded_at);


--
-- Name: location_ping_2026_12_employee_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_2026_12_employee_id_recorded_at_idx ON public.location_ping_2026_12 USING btree (employee_id, recorded_at);


--
-- Name: location_ping_default_attendance_event_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_default_attendance_event_id_recorded_at_idx ON public.location_ping_default USING btree (attendance_event_id, recorded_at);


--
-- Name: location_ping_default_employee_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX location_ping_default_employee_id_recorded_at_idx ON public.location_ping_default USING btree (employee_id, recorded_at);


--
-- Name: notification_inbox_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_inbox_idx ON public.notification USING btree (recipient_id, created_at DESC);


--
-- Name: otp_challenge_open_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otp_challenge_open_idx ON public.otp_challenge USING btree (employee_id, purpose) WHERE (consumed_at IS NULL);


--
-- Name: product_media_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_media_product_idx ON public.product_media USING btree (product_id, sort_order);


--
-- Name: product_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_published_idx ON public.product USING btree (category_id, published_at) WHERE (status = 'published'::public.content_status);


--
-- Name: sales_activity_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sales_activity_date_idx ON public.sales_activity USING btree (work_date);


--
-- Name: sales_activity_employee_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sales_activity_employee_date_idx ON public.sales_activity USING btree (employee_id, work_date) WHERE (voided_at IS NULL);


--
-- Name: sales_target_month_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sales_target_month_idx ON public.sales_target USING btree (month);


--
-- Name: share_event_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_event_employee_idx ON public.share_event USING btree (employee_id, shared_at);


--
-- Name: share_event_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX share_event_product_idx ON public.share_event USING btree (product_id, shared_at);


--
-- Name: tracking_consent_one_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tracking_consent_one_active ON public.tracking_consent USING btree (employee_id, consent_version) WHERE (revoked_at IS NULL);


--
-- Name: location_ping_2026_10_attendance_event_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_event_idx ATTACH PARTITION public.location_ping_2026_10_attendance_event_id_recorded_at_idx;


--
-- Name: location_ping_2026_10_employee_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_employee_time_idx ATTACH PARTITION public.location_ping_2026_10_employee_id_recorded_at_idx;


--
-- Name: location_ping_2026_10_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_pkey ATTACH PARTITION public.location_ping_2026_10_pkey;


--
-- Name: location_ping_2026_11_attendance_event_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_event_idx ATTACH PARTITION public.location_ping_2026_11_attendance_event_id_recorded_at_idx;


--
-- Name: location_ping_2026_11_employee_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_employee_time_idx ATTACH PARTITION public.location_ping_2026_11_employee_id_recorded_at_idx;


--
-- Name: location_ping_2026_11_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_pkey ATTACH PARTITION public.location_ping_2026_11_pkey;


--
-- Name: location_ping_2026_12_attendance_event_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_event_idx ATTACH PARTITION public.location_ping_2026_12_attendance_event_id_recorded_at_idx;


--
-- Name: location_ping_2026_12_employee_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_employee_time_idx ATTACH PARTITION public.location_ping_2026_12_employee_id_recorded_at_idx;


--
-- Name: location_ping_2026_12_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_pkey ATTACH PARTITION public.location_ping_2026_12_pkey;


--
-- Name: location_ping_default_attendance_event_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_event_idx ATTACH PARTITION public.location_ping_default_attendance_event_id_recorded_at_idx;


--
-- Name: location_ping_default_employee_id_recorded_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_employee_time_idx ATTACH PARTITION public.location_ping_default_employee_id_recorded_at_idx;


--
-- Name: location_ping_default_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.location_ping_pkey ATTACH PARTITION public.location_ping_default_pkey;


--
-- Name: attendance_config attendance_config_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attendance_config_append_only BEFORE DELETE OR UPDATE ON public.attendance_config FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();


--
-- Name: attendance_event attendance_event_clear_live; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attendance_event_clear_live AFTER UPDATE OF check_out_at ON public.attendance_event FOR EACH ROW EXECUTE FUNCTION public.clear_live_location_on_check_out();


--
-- Name: attendance_event attendance_event_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attendance_event_guard BEFORE INSERT OR DELETE OR UPDATE ON public.attendance_event FOR EACH ROW EXECUTE FUNCTION public.attendance_event_guard();


--
-- Name: attendance_event attendance_event_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attendance_event_touch BEFORE UPDATE ON public.attendance_event FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: attendance_status_change attendance_status_change_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attendance_status_change_append_only BEFORE DELETE OR UPDATE ON public.attendance_status_change FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();


--
-- Name: attendance_status_change attendance_status_change_no_truncate; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attendance_status_change_no_truncate BEFORE TRUNCATE ON public.attendance_status_change FOR EACH STATEMENT EXECUTE FUNCTION public.forbid_mutation();


--
-- Name: attendance_event attendance_status_trail; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER attendance_status_trail AFTER INSERT OR UPDATE OF status ON public.attendance_event FOR EACH ROW EXECUTE FUNCTION public.attendance_status_trail();


--
-- Name: audit_log audit_log_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_log_append_only BEFORE DELETE OR UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();


--
-- Name: audit_log audit_log_chain; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_log_chain BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.audit_log_chain();


--
-- Name: audit_log audit_log_no_truncate; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON public.audit_log FOR EACH STATEMENT EXECUTE FUNCTION public.forbid_mutation();


--
-- Name: branch branch_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER branch_touch BEFORE UPDATE ON public.branch FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: employee employee_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER employee_touch BEFORE UPDATE ON public.employee FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: fraud_signal fraud_signal_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fraud_signal_append_only BEFORE DELETE OR UPDATE ON public.fraud_signal FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();


--
-- Name: geofence geofence_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER geofence_touch BEFORE UPDATE ON public.geofence FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: leave_request leave_request_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER leave_request_touch BEFORE UPDATE ON public.leave_request FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: location_ping location_ping_in_shift; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER location_ping_in_shift BEFORE INSERT ON public.location_ping FOR EACH ROW EXECUTE FUNCTION public.location_ping_in_shift();


--
-- Name: product product_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER product_touch BEFORE UPDATE ON public.product FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: sales_activity sales_activity_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sales_activity_guard BEFORE INSERT OR DELETE OR UPDATE ON public.sales_activity FOR EACH ROW EXECUTE FUNCTION public.sales_activity_guard();


--
-- Name: sales_target sales_target_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sales_target_touch BEFORE UPDATE ON public.sales_target FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: system_setting system_setting_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER system_setting_touch BEFORE UPDATE ON public.system_setting FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: team team_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER team_touch BEFORE UPDATE ON public.team FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: user_preference user_preference_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_preference_touch BEFORE UPDATE ON public.user_preference FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: api_client api_client_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_client
    ADD CONSTRAINT api_client_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employee(employee_id);


--
-- Name: attendance_break attendance_break_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_break
    ADD CONSTRAINT attendance_break_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: attendance_config attendance_config_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_config
    ADD CONSTRAINT attendance_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employee(employee_id);


--
-- Name: attendance_config attendance_config_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_config
    ADD CONSTRAINT attendance_config_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id);


--
-- Name: attendance_correction_request attendance_correction_request_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_correction_request
    ADD CONSTRAINT attendance_correction_request_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.employee(employee_id);


--
-- Name: attendance_correction_request attendance_correction_request_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_correction_request
    ADD CONSTRAINT attendance_correction_request_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: attendance_correction_request attendance_correction_request_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_correction_request
    ADD CONSTRAINT attendance_correction_request_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: attendance_event attendance_event_check_in_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_check_in_device_id_fkey FOREIGN KEY (check_in_device_id) REFERENCES public.device(device_id);


--
-- Name: attendance_event attendance_event_check_in_geofence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_check_in_geofence_id_fkey FOREIGN KEY (check_in_geofence_id) REFERENCES public.geofence(geofence_id);


--
-- Name: attendance_event attendance_event_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.attendance_config(config_id);


--
-- Name: attendance_event attendance_event_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: attendance_event attendance_event_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_request(request_id);


--
-- Name: attendance_event attendance_event_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_event
    ADD CONSTRAINT attendance_event_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.employee(employee_id);


--
-- Name: attendance_period attendance_period_finalized_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_period
    ADD CONSTRAINT attendance_period_finalized_by_fkey FOREIGN KEY (finalized_by) REFERENCES public.employee(employee_id);


--
-- Name: attendance_period attendance_period_reopened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_period
    ADD CONSTRAINT attendance_period_reopened_by_fkey FOREIGN KEY (reopened_by) REFERENCES public.employee(employee_id);


--
-- Name: attendance_photo attendance_photo_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_photo
    ADD CONSTRAINT attendance_photo_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: attendance_status_change attendance_status_change_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_status_change
    ADD CONSTRAINT attendance_status_change_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.employee(employee_id);


--
-- Name: attendance_status_change attendance_status_change_correction_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_status_change
    ADD CONSTRAINT attendance_status_change_correction_request_id_fkey FOREIGN KEY (correction_request_id) REFERENCES public.attendance_correction_request(request_id);


--
-- Name: attendance_status_change attendance_status_change_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_status_change
    ADD CONSTRAINT attendance_status_change_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: attendance_status_change attendance_status_change_fraud_signal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_status_change
    ADD CONSTRAINT attendance_status_change_fraud_signal_id_fkey FOREIGN KEY (fraud_signal_id) REFERENCES public.fraud_signal(signal_id);


--
-- Name: attendance_status_change attendance_status_change_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_status_change
    ADD CONSTRAINT attendance_status_change_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_request(request_id);


--
-- Name: attendance_summary attendance_summary_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_summary
    ADD CONSTRAINT attendance_summary_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: attendance_summary attendance_summary_finalized_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_summary
    ADD CONSTRAINT attendance_summary_finalized_by_fkey FOREIGN KEY (finalized_by) REFERENCES public.employee(employee_id);


--
-- Name: audit_log audit_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.employee(employee_id);


--
-- Name: auth_session auth_session_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_session
    ADD CONSTRAINT auth_session_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.device(device_id);


--
-- Name: auth_session auth_session_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_session
    ADD CONSTRAINT auth_session_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: credential credential_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT credential_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON DELETE CASCADE;


--
-- Name: customer_visit_note customer_visit_note_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visit_note
    ADD CONSTRAINT customer_visit_note_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: customer_visit_note customer_visit_note_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visit_note
    ADD CONSTRAINT customer_visit_note_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- Name: customer_visit_note customer_visit_note_share_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visit_note
    ADD CONSTRAINT customer_visit_note_share_id_fkey FOREIGN KEY (share_id) REFERENCES public.share_event(share_id);


--
-- Name: device device_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: employee employee_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- Name: employee_live_location employee_live_location_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_live_location
    ADD CONSTRAINT employee_live_location_attendance_event_id_fkey FOREIGN KEY (attendance_event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: employee_live_location employee_live_location_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_live_location
    ADD CONSTRAINT employee_live_location_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: employee employee_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id);


--
-- Name: fraud_signal fraud_signal_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_signal
    ADD CONSTRAINT fraud_signal_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: geofence_assignment geofence_assignment_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofence_assignment
    ADD CONSTRAINT geofence_assignment_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- Name: geofence_assignment geofence_assignment_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofence_assignment
    ADD CONSTRAINT geofence_assignment_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: geofence_assignment geofence_assignment_geofence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofence_assignment
    ADD CONSTRAINT geofence_assignment_geofence_id_fkey FOREIGN KEY (geofence_id) REFERENCES public.geofence(geofence_id);


--
-- Name: geofence_assignment geofence_assignment_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofence_assignment
    ADD CONSTRAINT geofence_assignment_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id);


--
-- Name: geofence geofence_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofence
    ADD CONSTRAINT geofence_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employee(employee_id);


--
-- Name: holiday holiday_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holiday
    ADD CONSTRAINT holiday_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- Name: leave_request leave_request_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_request
    ADD CONSTRAINT leave_request_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.employee(employee_id);


--
-- Name: leave_request leave_request_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_request
    ADD CONSTRAINT leave_request_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: location_ping location_ping_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.location_ping
    ADD CONSTRAINT location_ping_attendance_event_id_fkey FOREIGN KEY (attendance_event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: location_ping location_ping_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.location_ping
    ADD CONSTRAINT location_ping_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: notification notification_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.employee(employee_id);


--
-- Name: otp_challenge otp_challenge_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_challenge
    ADD CONSTRAINT otp_challenge_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: product product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_category(category_id);


--
-- Name: product product_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employee(employee_id);


--
-- Name: product_import_job product_import_job_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_import_job
    ADD CONSTRAINT product_import_job_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.employee(employee_id);


--
-- Name: product_media product_media_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_media
    ADD CONSTRAINT product_media_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: product product_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.employee(employee_id);


--
-- Name: sales_activity sales_activity_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_activity
    ADD CONSTRAINT sales_activity_attendance_event_id_fkey FOREIGN KEY (attendance_event_id) REFERENCES public.attendance_event(event_id);


--
-- Name: sales_activity sales_activity_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_activity
    ADD CONSTRAINT sales_activity_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: sales_activity sales_activity_voided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_activity
    ADD CONSTRAINT sales_activity_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES public.employee(employee_id);


--
-- Name: sales_target sales_target_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_target
    ADD CONSTRAINT sales_target_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: sales_target sales_target_set_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_target
    ADD CONSTRAINT sales_target_set_by_fkey FOREIGN KEY (set_by) REFERENCES public.employee(employee_id);


--
-- Name: share_event share_event_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_event
    ADD CONSTRAINT share_event_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: share_event share_event_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_event
    ADD CONSTRAINT share_event_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- Name: system_setting system_setting_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.employee(employee_id);


--
-- Name: team team_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- Name: tracking_consent tracking_consent_consent_version_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_consent
    ADD CONSTRAINT tracking_consent_consent_version_fkey FOREIGN KEY (consent_version) REFERENCES public.consent_document(version);


--
-- Name: tracking_consent tracking_consent_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_consent
    ADD CONSTRAINT tracking_consent_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.device(device_id);


--
-- Name: tracking_consent tracking_consent_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_consent
    ADD CONSTRAINT tracking_consent_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id);


--
-- Name: user_preference user_preference_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dbmate


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20261005115900'),
    ('20261005120000'),
    ('20261005120100'),
    ('20261005120200'),
    ('20261005120300'),
    ('20261005120400'),
    ('20261005120500'),
    ('20261006090000'),
    ('20261006120000');
