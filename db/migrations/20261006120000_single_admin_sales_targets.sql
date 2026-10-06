-- migrate:up
-- Operating model (2026-10-06): ONE administrator does all portal work and sees everything; every other
-- account is a sales rep created by that administrator (no self-signup, no supervisor/HR tiers).
-- Plus monthly sales targets counted in visits and orders (no money/currency fields), which reps
-- work towards by logging each visit or order in the app while checked in.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM employee WHERE role NOT IN ('super_admin', 'sales_rep')) THEN
    RAISE EXCEPTION 'Convert or remove HR/supervisor accounts before applying the single-admin model';
  END IF;
END $$;

ALTER TABLE team DROP CONSTRAINT team_supervisor_fk;
ALTER TABLE team DROP COLUMN supervisor_id;
DROP INDEX employee_supervisor_idx;
ALTER TABLE employee DROP COLUMN supervisor_id;
ALTER TABLE employee ADD CONSTRAINT employee_role_admin_or_rep CHECK (role IN ('super_admin', 'sales_rep'));
-- Exactly one administrator account may exist.
CREATE UNIQUE INDEX employee_single_admin_idx ON employee ((true)) WHERE role = 'super_admin';

CREATE TABLE sales_target (
  target_id     uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id   text NOT NULL REFERENCES employee,
  month         date NOT NULL CHECK (month = date_trunc('month', month)::date),
  visits_target integer NOT NULL DEFAULT 0 CHECK (visits_target BETWEEN 0 AND 100000),
  orders_target integer NOT NULL DEFAULT 0 CHECK (orders_target BETWEEN 0 AND 100000),
  note          text CHECK (length(note) <= 500),
  set_by        text NOT NULL REFERENCES employee,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, month),
  CHECK (visits_target > 0 OR orders_target > 0)
);
CREATE INDEX sales_target_month_idx ON sales_target (month);
CREATE TRIGGER sales_target_touch BEFORE UPDATE ON sales_target FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TYPE sales_activity_kind AS ENUM ('visit', 'order');
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'target_set'; -- enum values can't be dropped; harmless on rollback

CREATE TABLE sales_activity (
  activity_id         uuid PRIMARY KEY,           -- generated on the device (safe to retry)
  employee_id         text NOT NULL REFERENCES employee,
  attendance_event_id uuid NOT NULL REFERENCES attendance_event,
  work_date           date NOT NULL,
  kind                sales_activity_kind NOT NULL,
  customer_name       text NOT NULL CHECK (length(trim(customer_name)) BETWEEN 1 AND 120),
  note                text CHECK (length(note) <= 500),
  occurred_at         timestamptz NOT NULL DEFAULT now(),
  lat                 double precision CHECK (lat BETWEEN -90 AND 90),
  lng                 double precision CHECK (lng BETWEEN -180 AND 180),
  accuracy_m          real CHECK (accuracy_m >= 0),
  voided_at           timestamptz,
  voided_by           text REFERENCES employee,
  void_reason         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CHECK ((lat IS NULL) = (lng IS NULL)),
  CHECK ((voided_at IS NULL) = (voided_by IS NULL)),
  CHECK (voided_at IS NULL OR length(trim(void_reason)) > 0)
);
CREATE INDEX sales_activity_employee_date_idx ON sales_activity (employee_id, work_date) WHERE voided_at IS NULL;
CREATE INDEX sales_activity_date_idx ON sales_activity (work_date);

-- Visits/orders are logged only during the rep's open shift (and so location is only ever captured
-- on duty, FR-LOC-03). Rows are never deleted; the administrator voids mistakes with a reason.
CREATE FUNCTION sales_activity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
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
CREATE TRIGGER sales_activity_guard BEFORE INSERT OR UPDATE OR DELETE ON sales_activity
  FOR EACH ROW EXECUTE FUNCTION sales_activity_guard();

-- Supabase: keep new tables out of the auto-generated Data API (see 20261006090000).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    ALTER TABLE sales_target ENABLE ROW LEVEL SECURITY;
    ALTER TABLE sales_activity ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON sales_target, sales_activity FROM anon, authenticated;
    REVOKE ALL ON FUNCTION sales_activity_guard() FROM anon, authenticated;
  END IF;
END $$;

-- migrate:down
DROP TABLE IF EXISTS sales_activity;
DROP FUNCTION IF EXISTS sales_activity_guard();
DROP TYPE IF EXISTS sales_activity_kind;
DROP TABLE IF EXISTS sales_target;
DROP INDEX IF EXISTS employee_single_admin_idx;
ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_role_admin_or_rep;
ALTER TABLE employee ADD COLUMN supervisor_id text REFERENCES employee CHECK (supervisor_id IS DISTINCT FROM employee_id);
CREATE INDEX employee_supervisor_idx ON employee (supervisor_id);
ALTER TABLE team ADD COLUMN supervisor_id text;
ALTER TABLE team ADD CONSTRAINT team_supervisor_fk FOREIGN KEY (supervisor_id) REFERENCES employee;
