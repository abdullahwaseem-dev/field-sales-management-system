-- migrate:up
-- Organisation (branch, team), people (employee + preferences) and authentication (credential,
-- device, session, OTP). FR-AUTH-*, FR-EMP-01/03, proposal §5.2 A–B.

CREATE TABLE branch (
  branch_id  uuid PRIMARY KEY DEFAULT uuidv7(),
  code       text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9-]{2,16}$'),
  name_en    text NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ar    text NOT NULL CHECK (length(trim(name_ar)) > 0),
  timezone   text NOT NULL DEFAULT 'Asia/Riyadh',
  status     record_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE team (
  team_id       uuid PRIMARY KEY DEFAULT uuidv7(),
  branch_id     uuid NOT NULL REFERENCES branch,
  name_en       text NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ar       text NOT NULL CHECK (length(trim(name_ar)) > 0),
  supervisor_id text, -- FK added after employee exists
  status        record_status NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- employee_id is the HR-issued code: the key shared with HRMS and the FK used everywhere.
CREATE TABLE employee (
  employee_id     text PRIMARY KEY CHECK (employee_id ~ '^[A-Za-z0-9][A-Za-z0-9-]{1,31}$'),
  full_name_en    text NOT NULL CHECK (length(trim(full_name_en)) > 0),
  full_name_ar    text NOT NULL CHECK (length(trim(full_name_ar)) > 0),
  email           citext UNIQUE,
  mobile_e164     text UNIQUE CHECK (mobile_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  role            employee_role NOT NULL,
  branch_id       uuid NOT NULL REFERENCES branch,
  team_id         uuid REFERENCES team,
  supervisor_id   text REFERENCES employee,
  -- 8-hour rule (§5.5): on-time sign-in window shift_start..latest_start; the day ends when the
  -- required hours (attendance_config) are worked.
  shift_start     time NOT NULL DEFAULT '09:00',
  latest_start    time NOT NULL DEFAULT '12:00',
  weekly_off_days smallint[] NOT NULL DEFAULT '{5,6}', -- ISO weekday: 5 = Friday, 6 = Saturday
  status          record_status NOT NULL DEFAULT 'active',
  deactivated_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (latest_start >= shift_start),
  CHECK (weekly_off_days <@ '{1,2,3,4,5,6,7}'::smallint[]),
  CHECK (supervisor_id IS DISTINCT FROM employee_id),
  CHECK ((status = 'inactive') = (deactivated_at IS NOT NULL))
);
CREATE INDEX employee_team_idx ON employee (team_id);
CREATE INDEX employee_supervisor_idx ON employee (supervisor_id);
CREATE INDEX employee_branch_idx ON employee (branch_id);

ALTER TABLE team ADD CONSTRAINT team_supervisor_fk FOREIGN KEY (supervisor_id) REFERENCES employee;

CREATE TABLE user_preference (
  employee_id text PRIMARY KEY REFERENCES employee ON DELETE CASCADE,
  theme       theme_pref NOT NULL DEFAULT 'system',
  locale      locale_pref NOT NULL DEFAULT 'system',
  digits      digits_pref NOT NULL DEFAULT 'western',
  show_hijri  boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Secrets live apart from the employee row so they are never selected by accident.
CREATE TABLE credential (
  employee_id          text PRIMARY KEY REFERENCES employee ON DELETE CASCADE,
  password_hash        text NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
  must_change_password boolean NOT NULL DEFAULT true, -- FR-AUTH-02
  password_changed_at  timestamptz,
  failed_attempts      integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until         timestamptz
);

CREATE TABLE device (
  device_id     uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id   text NOT NULL REFERENCES employee,
  platform      device_platform NOT NULL,
  install_id    text NOT NULL, -- stable per-install identifier reported by the app
  model         text,
  os_version    text,
  app_version   text,
  push_token    text,
  integrity     jsonb NOT NULL DEFAULT '{}', -- root/jailbreak, Play Integrity / App Attest verdicts
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, install_id)
);

CREATE TABLE auth_session (
  session_id         uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id        text NOT NULL REFERENCES employee,
  device_id          uuid REFERENCES device,
  client             client_kind NOT NULL,
  refresh_token_hash text NOT NULL UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  last_used_at       timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL,
  revoked_at         timestamptz,
  revoke_reason      text,
  CHECK ((client = 'mobile') = (device_id IS NOT NULL)),
  CHECK (expires_at > created_at)
);
CREATE INDEX auth_session_active_idx ON auth_session (employee_id, client) WHERE revoked_at IS NULL;

CREATE TABLE otp_challenge (
  otp_id      uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id text NOT NULL REFERENCES employee,
  purpose     otp_purpose NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_challenge_open_idx ON otp_challenge (employee_id, purpose) WHERE consumed_at IS NULL;

CREATE TRIGGER branch_touch BEFORE UPDATE ON branch FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER team_touch BEFORE UPDATE ON team FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER employee_touch BEFORE UPDATE ON employee FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER user_preference_touch BEFORE UPDATE ON user_preference FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- migrate:down
DROP TABLE IF EXISTS otp_challenge, auth_session, device, credential, user_preference;
ALTER TABLE IF EXISTS team DROP CONSTRAINT IF EXISTS team_supervisor_fk;
DROP TABLE IF EXISTS employee, team, branch;
