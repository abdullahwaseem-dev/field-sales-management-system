-- migrate:up
-- Geofences (circle/polygon) with assignments to an employee, team or branch; effective-dated
-- attendance configuration (FR-ATM-05, 8-hour rule); global settings; holiday calendar (BR-ATT-03).

CREATE TABLE geofence (
  geofence_id uuid PRIMARY KEY DEFAULT uuidv7(),
  name_en     text NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ar     text NOT NULL CHECK (length(trim(name_ar)) > 0),
  type        geofence_type NOT NULL,
  center      geography(Point, 4326),
  radius_m    integer,
  area        geography(Polygon, 4326),
  status      record_status NOT NULL DEFAULT 'active',
  created_by  text REFERENCES employee,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (type = 'circle' AND center IS NOT NULL AND radius_m BETWEEN 10 AND 5000 AND area IS NULL)
    OR (type = 'polygon' AND area IS NOT NULL AND center IS NULL AND radius_m IS NULL)
  )
);
CREATE INDEX geofence_center_gix ON geofence USING gist (center);
CREATE INDEX geofence_area_gix ON geofence USING gist (area);
CREATE TRIGGER geofence_touch BEFORE UPDATE ON geofence FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE geofence_assignment (
  assignment_id uuid PRIMARY KEY DEFAULT uuidv7(),
  geofence_id   uuid NOT NULL REFERENCES geofence,
  employee_id   text REFERENCES employee,
  team_id       uuid REFERENCES team,
  branch_id     uuid REFERENCES branch,
  valid_from    date NOT NULL DEFAULT current_date,
  valid_to      date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(employee_id, team_id, branch_id) = 1),
  CHECK (valid_to IS NULL OR valid_to >= valid_from)
);
CREATE INDEX geofence_assignment_employee_idx ON geofence_assignment (employee_id);
CREATE INDEX geofence_assignment_team_idx ON geofence_assignment (team_id);
CREATE INDEX geofence_assignment_branch_idx ON geofence_assignment (branch_id);

-- Distance in metres from a point to a geofence's edge (0 = inside).
CREATE FUNCTION geofence_distance_m(p_geofence uuid, p_point geography) RETURNS double precision
LANGUAGE sql STABLE AS $$
  SELECT CASE g.type
    WHEN 'circle' THEN greatest(ST_Distance(g.center, p_point) - g.radius_m, 0)
    ELSE ST_Distance(g.area, p_point)
  END
  FROM geofence g WHERE g.geofence_id = p_geofence
$$;

-- Active geofences that apply to an employee on a date: own ∪ team ∪ branch assignments.
CREATE FUNCTION employee_geofences(p_employee text, p_date date) RETURNS SETOF uuid
LANGUAGE sql STABLE AS $$
  SELECT DISTINCT a.geofence_id
  FROM employee e
  JOIN geofence_assignment a
    ON a.employee_id = e.employee_id OR a.team_id = e.team_id OR a.branch_id = e.branch_id
  JOIN geofence g ON g.geofence_id = a.geofence_id AND g.status = 'active'
  WHERE e.employee_id = p_employee
    AND a.valid_from <= p_date AND (a.valid_to IS NULL OR a.valid_to >= p_date)
$$;

-- Effective-dated, insert-only. A change is a new row with a new effective_from, so history (and
-- the rules that applied to any past day) is never lost.
CREATE TABLE attendance_config (
  config_id               uuid PRIMARY KEY DEFAULT uuidv7(),
  scope                   config_scope NOT NULL,
  team_id                 uuid REFERENCES team,
  required_work_minutes   integer NOT NULL DEFAULT 480 CHECK (required_work_minutes BETWEEN 60 AND 720),
  grace_minutes           integer NOT NULL DEFAULT 15 CHECK (grace_minutes BETWEEN 0 AND 240),
  ping_interval_seconds   integer NOT NULL DEFAULT 180 CHECK (ping_interval_seconds BETWEEN 120 AND 300),
  outside_geofence_action outside_geofence_action NOT NULL DEFAULT 'flag',
  photo_required          boolean NOT NULL DEFAULT false,
  shift_timeout_hours     integer NOT NULL DEFAULT 12 CHECK (shift_timeout_hours BETWEEN 8 AND 16),
  effective_from          date NOT NULL,
  created_by              text REFERENCES employee,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope = 'team') = (team_id IS NOT NULL)),
  UNIQUE NULLS NOT DISTINCT (scope, team_id, effective_from)
);
CREATE TRIGGER attendance_config_append_only BEFORE UPDATE OR DELETE ON attendance_config
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- The config that applies to a team on a date: latest team row, else latest global row.
CREATE FUNCTION effective_attendance_config(p_team uuid, p_date date) RETURNS attendance_config
LANGUAGE sql STABLE AS $$
  SELECT c.* FROM attendance_config c
  WHERE c.effective_from <= p_date
    AND ((c.scope = 'team' AND c.team_id = p_team) OR c.scope = 'global')
  ORDER BY (c.scope = 'team') DESC, c.effective_from DESC
  LIMIT 1
$$;

CREATE TABLE system_setting (
  key        text PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_.]+$'),
  value      jsonb NOT NULL,
  updated_by text REFERENCES employee,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER system_setting_touch BEFORE UPDATE ON system_setting FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE holiday (
  holiday_id uuid PRIMARY KEY DEFAULT uuidv7(),
  date       date NOT NULL,
  name_en    text NOT NULL,
  name_ar    text NOT NULL,
  kind       holiday_kind NOT NULL,
  branch_id  uuid REFERENCES branch, -- NULL = company-wide
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (date, branch_id)
);

-- migrate:down
DROP TABLE IF EXISTS holiday, system_setting;
DROP FUNCTION IF EXISTS effective_attendance_config(uuid, date);
DROP TABLE IF EXISTS attendance_config;
DROP FUNCTION IF EXISTS employee_geofences(text, date);
DROP FUNCTION IF EXISTS geofence_distance_m(uuid, geography);
DROP TABLE IF EXISTS geofence_assignment, geofence;
