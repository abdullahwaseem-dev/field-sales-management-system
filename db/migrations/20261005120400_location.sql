-- migrate:up
-- Live location: pings partitioned by month (retention = drop a partition, SRS §5.6), the latest
-- position per on-duty rep for the live map, and the "never off-shift" rule in the database
-- (FR-LOC-01..05, §5.2 "location tracking strictly limited to active checked-in duty hours").

CREATE TABLE location_ping (
  ping_id             uuid NOT NULL,          -- generated on the device: retried uploads are idempotent
  employee_id         text NOT NULL REFERENCES employee,
  attendance_event_id uuid NOT NULL REFERENCES attendance_event, -- no shift, no ping
  recorded_at         timestamptz NOT NULL,   -- device fix time
  received_at         timestamptz NOT NULL DEFAULT now(),
  lat                 double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng                 double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  accuracy_m          real CHECK (accuracy_m >= 0),
  speed_mps           real CHECK (speed_mps >= 0),
  heading_deg         real CHECK (heading_deg >= 0 AND heading_deg < 360),
  provider            location_provider,
  is_mock             boolean NOT NULL DEFAULT false,
  PRIMARY KEY (ping_id, recorded_at)
) PARTITION BY RANGE (recorded_at);
CREATE INDEX location_ping_employee_time_idx ON location_ping (employee_id, recorded_at);
CREATE INDEX location_ping_event_idx ON location_ping (attendance_event_id, recorded_at);
-- Catches anything outside the pre-created monthly partitions (should stay empty).
CREATE TABLE location_ping_default PARTITION OF location_ping DEFAULT;

-- Creates monthly partitions from the current month to `months_ahead` months ahead (idempotent).
CREATE FUNCTION ensure_location_ping_partitions(months_ahead integer DEFAULT 2) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  m date;
  created integer := 0;
  part text;
BEGIN
  FOR i IN 0..months_ahead LOOP
    m := (date_trunc('month', now() AT TIME ZONE 'UTC') + make_interval(months => i))::date;
    part := format('location_ping_%s', to_char(m, 'YYYY_MM'));
    IF to_regclass(part) IS NULL THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF location_ping FOR VALUES FROM (%L) TO (%L)',
        part, m::timestamptz, (m + interval '1 month')::timestamptz);
      created := created + 1;
    END IF;
  END LOOP;
  RETURN created;
END $$;

-- Retention (SRS §5.6): drops whole monthly partitions older than `keep_months`.
CREATE FUNCTION drop_location_ping_partitions_older_than(keep_months integer) RETURNS integer
LANGUAGE plpgsql AS $$
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
END $$;

SELECT ensure_location_ping_partitions(2);

-- Never off-shift: a ping must belong to the employee's event and fall inside check-in → check-out
-- (or check-in → shift timeout while the shift is open). Small clock skew is tolerated.
CREATE FUNCTION location_ping_in_shift() RETURNS trigger LANGUAGE plpgsql AS $$
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
CREATE TRIGGER location_ping_in_shift BEFORE INSERT ON location_ping FOR EACH ROW EXECUTE FUNCTION location_ping_in_shift();

-- Latest fix per on-duty rep; the live map reads only this table.
CREATE TABLE employee_live_location (
  employee_id         text PRIMARY KEY REFERENCES employee,
  attendance_event_id uuid NOT NULL REFERENCES attendance_event,
  ping_id             uuid NOT NULL,
  recorded_at         timestamptz NOT NULL,
  lat                 double precision NOT NULL,
  lng                 double precision NOT NULL,
  accuracy_m          real,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- At check-out the live position disappears, so the map can never show an off-shift location.
CREATE FUNCTION clear_live_location_on_check_out() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.check_out_at IS NOT NULL AND OLD.check_out_at IS NULL THEN
    DELETE FROM employee_live_location WHERE employee_id = NEW.employee_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER attendance_event_clear_live AFTER UPDATE OF check_out_at ON attendance_event
  FOR EACH ROW EXECUTE FUNCTION clear_live_location_on_check_out();

-- migrate:down
DROP TRIGGER IF EXISTS attendance_event_clear_live ON attendance_event;
DROP FUNCTION IF EXISTS clear_live_location_on_check_out();
DROP TABLE IF EXISTS employee_live_location;
DROP TABLE IF EXISTS location_ping CASCADE;
DROP FUNCTION IF EXISTS location_ping_in_shift();
DROP FUNCTION IF EXISTS drop_location_ping_partitions_older_than(integer);
DROP FUNCTION IF EXISTS ensure_location_ping_partitions(integer);
