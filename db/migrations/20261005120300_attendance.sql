-- migrate:up
-- Attendance: leave requests, the month lock, one attendance row per employee per working day
-- (8-hour rule, fraud evidence, review), the immutable status trail, corrections, breaks, photos.
-- FR-ATT-*, FR-ATM-02/04, FR-LVE-01, FR-ASM-06, BR-ATT-01/02/04, proposal §5.2 D/F/H, §5.3–5.5.

CREATE EXTENSION IF NOT EXISTS btree_gist; -- for the "no overlapping leave" exclusion constraint

CREATE TABLE leave_request (
  request_id      uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id     text NOT NULL REFERENCES employee,
  type            leave_type NOT NULL DEFAULT 'leave',
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  reason          text NOT NULL CHECK (length(trim(reason)) > 0),
  status          request_status NOT NULL DEFAULT 'pending',
  decided_by      text REFERENCES employee, -- SRS "approved_by"; also records who rejected
  decided_at      timestamptz,
  decision_remark text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK ((status IN ('approved', 'rejected')) = (decided_by IS NOT NULL AND decided_at IS NOT NULL)),
  CHECK (status <> 'rejected' OR length(trim(decision_remark)) > 0),
  CHECK (decided_by IS DISTINCT FROM employee_id),
  -- An employee cannot have two live (pending/approved) requests covering the same day.
  EXCLUDE USING gist (employee_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
    WHERE (status IN ('pending', 'approved'))
);
CREATE INDEX leave_request_employee_idx ON leave_request (employee_id, start_date);
CREATE TRIGGER leave_request_touch BEFORE UPDATE ON leave_request FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Company-wide month lock (BR-ATT-04). A finalized month freezes its attendance rows until an HR
-- Admin re-opens it (audited).
CREATE TABLE attendance_period (
  period_id     uuid PRIMARY KEY DEFAULT uuidv7(),
  year          smallint NOT NULL CHECK (year BETWEEN 2024 AND 2100),
  month         smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  status        period_status NOT NULL DEFAULT 'open',
  computed_at   timestamptz,
  finalized_by  text REFERENCES employee,
  finalized_at  timestamptz,
  reopened_by   text REFERENCES employee,
  reopened_at   timestamptz,
  reopen_reason text,
  UNIQUE (year, month),
  CHECK (status <> 'finalized' OR (finalized_by IS NOT NULL AND finalized_at IS NOT NULL)),
  CHECK (status <> 'reopened' OR (reopened_by IS NOT NULL AND reopened_at IS NOT NULL AND length(trim(reopen_reason)) > 0))
);

CREATE FUNCTION attendance_month_locked(p_date date) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM attendance_period
    WHERE year = extract(year FROM p_date) AND month = extract(month FROM p_date) AND status = 'finalized'
  )
$$;

CREATE TABLE attendance_event (
  event_id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id              text NOT NULL REFERENCES employee,
  work_date                date NOT NULL,
  -- Rules in force that day, copied at creation so later config/shift edits never rewrite history.
  config_id                uuid NOT NULL REFERENCES attendance_config,
  window_start_at          timestamptz NOT NULL,
  latest_start_at          timestamptz NOT NULL,
  required_work_minutes    integer NOT NULL CHECK (required_work_minutes BETWEEN 60 AND 720),

  check_in_at              timestamptz,
  check_in_lat             double precision CHECK (check_in_lat BETWEEN -90 AND 90),
  check_in_lng             double precision CHECK (check_in_lng BETWEEN -180 AND 180),
  check_in_accuracy_m      real CHECK (check_in_accuracy_m >= 0),
  check_in_point           geography(Point, 4326) GENERATED ALWAYS AS (
                             CASE WHEN check_in_lat IS NULL OR check_in_lng IS NULL THEN NULL
                                  ELSE ST_SetSRID(ST_MakePoint(check_in_lng, check_in_lat), 4326)::geography END) STORED,
  check_in_device_id       uuid REFERENCES device,
  check_in_geofence_id     uuid REFERENCES geofence,
  check_in_inside_geofence boolean,
  check_in_distance_m      real CHECK (check_in_distance_m >= 0),

  check_out_at             timestamptz,
  check_out_lat            double precision CHECK (check_out_lat BETWEEN -90 AND 90),
  check_out_lng            double precision CHECK (check_out_lng BETWEEN -180 AND 180),
  check_out_accuracy_m     real CHECK (check_out_accuracy_m >= 0),
  check_out_point          geography(Point, 4326) GENERATED ALWAYS AS (
                             CASE WHEN check_out_lat IS NULL OR check_out_lng IS NULL THEN NULL
                                  ELSE ST_SetSRID(ST_MakePoint(check_out_lng, check_out_lat), 4326)::geography END) STORED,
  check_out_inside_geofence boolean,
  check_out_source         check_out_source,

  -- Punctuality kept apart from status, so clearing a Suspected Fake restores Present or Late.
  is_late                  boolean NOT NULL DEFAULT false,
  late_minutes             integer NOT NULL DEFAULT 0 CHECK (late_minutes >= 0),
  -- 8-hour rule (§5.5).
  worked_minutes           integer CHECK (worked_minutes >= 0),
  shortfall_minutes        integer GENERATED ALWAYS AS (
                             CASE WHEN check_out_at IS NULL OR worked_minutes IS NULL THEN NULL
                                  ELSE greatest(required_work_minutes - worked_minutes, 0) END) STORED,
  is_short_hours           boolean GENERATED ALWAYS AS (
                             check_out_at IS NOT NULL AND worked_minutes IS NOT NULL
                             AND worked_minutes < required_work_minutes) STORED,

  status                   attendance_status NOT NULL,
  review_notes             text,
  reviewed_by              text REFERENCES employee,
  reviewed_at              timestamptz,
  leave_request_id         uuid REFERENCES leave_request,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),

  UNIQUE (employee_id, work_date), -- one attendance record per shift (FR-ATT-01)
  CHECK (latest_start_at >= window_start_at),
  CHECK ((check_in_lat IS NULL) = (check_in_lng IS NULL)),
  CHECK ((check_out_lat IS NULL) = (check_out_lng IS NULL)),
  CHECK (check_in_at IS NOT NULL OR check_in_lat IS NULL),
  CHECK (check_out_at IS NULL OR (check_in_at IS NOT NULL AND check_out_at >= check_in_at)),
  CHECK ((check_out_at IS NULL) = (check_out_source IS NULL)),
  CHECK ((check_out_at IS NULL) = (worked_minutes IS NULL)),
  CHECK ((status IN ('absent', 'on_leave')) = (check_in_at IS NULL)),
  CHECK (status <> 'on_leave' OR leave_request_id IS NOT NULL),
  CHECK ((reviewed_by IS NULL) = (reviewed_at IS NULL)),
  CHECK (status <> 'confirmed_fake' OR (reviewed_by IS NOT NULL AND length(trim(review_notes)) > 0)),
  CHECK (reviewed_by IS DISTINCT FROM employee_id) -- nobody reviews their own attendance
);
CREATE INDEX attendance_event_date_status_idx ON attendance_event (work_date, status);
CREATE INDEX attendance_event_suspected_idx ON attendance_event (work_date) WHERE status = 'suspected_fake';
CREATE INDEX attendance_event_open_shift_idx ON attendance_event (employee_id) WHERE check_in_at IS NOT NULL AND check_out_at IS NULL;
CREATE TRIGGER attendance_event_touch BEFORE UPDATE ON attendance_event FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Evidence behind a Suspected Fake. Immutable once written.
CREATE TABLE fraud_signal (
  signal_id   uuid PRIMARY KEY DEFAULT uuidv7(),
  event_id    uuid NOT NULL REFERENCES attendance_event,
  ping_id     uuid, -- location_ping is partitioned; the ping is identified by (ping_id, its recorded_at in evidence)
  phase       fraud_phase NOT NULL,
  type        fraud_signal_type NOT NULL,
  evidence    jsonb NOT NULL DEFAULT '{}',
  detected_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fraud_signal_event_idx ON fraud_signal (event_id);
CREATE TRIGGER fraud_signal_append_only BEFORE UPDATE OR DELETE ON fraud_signal FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TABLE attendance_correction_request (
  request_id             uuid PRIMARY KEY DEFAULT uuidv7(),
  event_id               uuid NOT NULL REFERENCES attendance_event,
  employee_id            text NOT NULL REFERENCES employee,
  requested_check_in_at  timestamptz,
  requested_check_out_at timestamptz,
  reason                 text NOT NULL CHECK (length(trim(reason)) > 0),
  status                 request_status NOT NULL DEFAULT 'pending',
  decided_by             text REFERENCES employee,
  decided_at             timestamptz,
  decision_remark        text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(requested_check_in_at, requested_check_out_at) >= 1),
  CHECK (requested_check_out_at IS NULL OR requested_check_in_at IS NULL OR requested_check_out_at > requested_check_in_at),
  CHECK ((status IN ('approved', 'rejected')) = (decided_by IS NOT NULL AND decided_at IS NOT NULL)),
  CHECK (status <> 'rejected' OR length(trim(decision_remark)) > 0),
  CHECK (decided_by IS DISTINCT FROM employee_id)
);
CREATE INDEX correction_request_pending_idx ON attendance_correction_request (employee_id) WHERE status = 'pending';

-- The classification trail (FR-ASM-06, BR-ATT-01/02): every status change, why, by whom, and the
-- record that triggered it. Written only by the trigger below; append-only.
CREATE TABLE attendance_status_change (
  change_id             uuid PRIMARY KEY DEFAULT uuidv7(),
  event_id              uuid NOT NULL REFERENCES attendance_event,
  from_status           attendance_status,
  to_status             attendance_status NOT NULL,
  cause                 status_change_cause NOT NULL,
  actor_id              text REFERENCES employee, -- NULL = system
  reason                text,
  fraud_signal_id       uuid REFERENCES fraud_signal,
  correction_request_id uuid REFERENCES attendance_correction_request,
  leave_request_id      uuid REFERENCES leave_request,
  created_at            timestamptz NOT NULL DEFAULT now(),
  -- Human decisions must name the person and give a reason.
  CHECK (cause NOT IN ('review_confirmed', 'review_cleared', 'correction_approved', 'month_correction')
         OR (actor_id IS NOT NULL AND length(trim(reason)) > 0)),
  CHECK (cause <> 'fraud_flagged' OR fraud_signal_id IS NOT NULL)
);
CREATE INDEX attendance_status_change_event_idx ON attendance_status_change (event_id, created_at);
CREATE TRIGGER attendance_status_change_append_only BEFORE UPDATE OR DELETE ON attendance_status_change
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TABLE attendance_break (
  break_id   uuid PRIMARY KEY DEFAULT uuidv7(),
  event_id   uuid NOT NULL REFERENCES attendance_event,
  started_at timestamptz NOT NULL,
  ended_at   timestamptz,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE UNIQUE INDEX attendance_break_one_open ON attendance_break (event_id) WHERE ended_at IS NULL;

CREATE TABLE attendance_photo (
  photo_id        uuid PRIMARY KEY DEFAULT uuidv7(),
  event_id        uuid NOT NULL REFERENCES attendance_event,
  phase           attendance_phase NOT NULL,
  storage_key     text NOT NULL,
  liveness_passed boolean,
  liveness_score  real CHECK (liveness_score BETWEEN 0 AND 1),
  captured_at     timestamptz NOT NULL,
  UNIQUE (event_id, phase)
);

-- Guards on attendance_event: month lock (BR-ATT-04) and the human-review rule (BR-ATT-01).
CREATE FUNCTION attendance_event_guard() RETURNS trigger LANGUAGE plpgsql AS $$
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
CREATE TRIGGER attendance_event_guard BEFORE INSERT OR UPDATE OR DELETE ON attendance_event
  FOR EACH ROW EXECUTE FUNCTION attendance_event_guard();

-- Every status change writes its trail row in the same transaction. The caller must declare why,
-- with transaction-local settings (set_config(..., true)):
--   sfms.change_cause (required), sfms.actor_id, sfms.reason, sfms.fraud_signal_id,
--   sfms.correction_request_id, sfms.leave_request_id
CREATE FUNCTION attendance_status_trail() RETURNS trigger LANGUAGE plpgsql AS $$
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
CREATE TRIGGER attendance_status_trail AFTER INSERT OR UPDATE OF status ON attendance_event
  FOR EACH ROW EXECUTE FUNCTION attendance_status_trail();

-- migrate:down
DROP TRIGGER IF EXISTS attendance_status_trail ON attendance_event;
DROP TRIGGER IF EXISTS attendance_event_guard ON attendance_event;
DROP FUNCTION IF EXISTS attendance_status_trail();
DROP FUNCTION IF EXISTS attendance_event_guard();
DROP TABLE IF EXISTS attendance_photo, attendance_break, attendance_status_change, attendance_correction_request,
  fraud_signal, attendance_event;
DROP FUNCTION IF EXISTS attendance_month_locked(date);
DROP TABLE IF EXISTS attendance_period, leave_request;
