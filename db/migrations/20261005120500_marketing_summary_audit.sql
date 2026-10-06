-- migrate:up
-- Marketing catalogue + share log (FR-MKT-*, FR-MKM-*), monthly attendance summary and HRMS API
-- clients (FR-ASM-*), tracking consent (SRS §5.6), notifications (FR-NOT-01), immutable audit log
-- with a hash chain (SRS §5.2). No price/currency fields by design.

CREATE TABLE product_category (
  category_id uuid PRIMARY KEY DEFAULT uuidv7(),
  name_en     text NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ar     text NOT NULL CHECK (length(trim(name_ar)) > 0),
  sort_order  integer NOT NULL DEFAULT 0,
  status      record_status NOT NULL DEFAULT 'active'
);

CREATE TABLE product (
  product_id     uuid PRIMARY KEY DEFAULT uuidv7(),
  item_type      item_type NOT NULL DEFAULT 'product',
  category_id    uuid REFERENCES product_category,
  name_en        text NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ar        text NOT NULL CHECK (length(trim(name_ar)) > 0),
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  valid_from     date,
  valid_to       date,
  status         content_status NOT NULL DEFAULT 'draft',
  share_slug     text NOT NULL UNIQUE DEFAULT left(replace(gen_random_uuid()::text, '-', ''), 12)
                 CHECK (share_slug ~ '^[A-Za-z0-9_-]{6,32}$'),
  published_at   timestamptz,
  published_by   text REFERENCES employee,
  created_by     text REFERENCES employee,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from),
  CHECK ((status = 'published') <= (published_at IS NOT NULL))
);
CREATE INDEX product_published_idx ON product (category_id, published_at) WHERE status = 'published';
CREATE TRIGGER product_touch BEFORE UPDATE ON product FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE product_media (
  media_id    uuid PRIMARY KEY DEFAULT uuidv7(),
  product_id  uuid NOT NULL REFERENCES product ON DELETE CASCADE,
  kind        media_kind NOT NULL DEFAULT 'image',
  storage_key text NOT NULL,
  alt_en      text NOT NULL DEFAULT '',
  alt_ar      text NOT NULL DEFAULT '',
  width       integer CHECK (width > 0),
  height      integer CHECK (height > 0),
  sort_order  integer NOT NULL DEFAULT 0
);
CREATE INDEX product_media_product_idx ON product_media (product_id, sort_order);

CREATE TABLE share_event (
  share_id    uuid PRIMARY KEY,            -- generated on the device (offline-safe)
  employee_id text NOT NULL REFERENCES employee,
  product_id  uuid NOT NULL REFERENCES product,
  channel     share_channel NOT NULL,
  recipient   text,                        -- optional customer contact: personal data, encrypted at the app layer
  shared_at   timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX share_event_product_idx ON share_event (product_id, shared_at);
CREATE INDEX share_event_employee_idx ON share_event (employee_id, shared_at);

CREATE TABLE customer_visit_note (
  note_id       uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id   text NOT NULL REFERENCES employee,
  product_id    uuid REFERENCES product,
  share_id      uuid REFERENCES share_event,
  customer_name text,
  note          text NOT NULL CHECK (length(trim(note)) > 0),
  visited_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_import_job (
  job_id        uuid PRIMARY KEY DEFAULT uuidv7(),
  uploaded_by   text NOT NULL REFERENCES employee,
  file_key      text NOT NULL,
  status        job_status NOT NULL DEFAULT 'pending',
  total_rows    integer,
  imported_rows integer,
  errors        jsonb NOT NULL DEFAULT '[]',
  created_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);

-- Counts only — the HRMS does any pay-related calculation (FR-ASM-05).
CREATE TABLE attendance_summary (
  summary_id           uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id          text NOT NULL REFERENCES employee,
  year                 smallint NOT NULL CHECK (year BETWEEN 2024 AND 2100),
  month                smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  present_days         smallint NOT NULL DEFAULT 0 CHECK (present_days >= 0),
  absent_days          smallint NOT NULL DEFAULT 0 CHECK (absent_days >= 0),
  late_count           smallint NOT NULL DEFAULT 0 CHECK (late_count >= 0),
  confirmed_fake_count smallint NOT NULL DEFAULT 0 CHECK (confirmed_fake_count >= 0),
  leave_days           smallint NOT NULL DEFAULT 0 CHECK (leave_days >= 0),
  short_hours_count    smallint NOT NULL DEFAULT 0 CHECK (short_hours_count >= 0),
  status               summary_status NOT NULL DEFAULT 'draft',
  finalized_by         text REFERENCES employee,
  finalized_at         timestamptz,
  version              integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  computed_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year, month),
  CHECK (late_count <= present_days),
  CHECK (short_hours_count <= present_days + confirmed_fake_count),
  CHECK ((status = 'finalized') = (finalized_by IS NOT NULL AND finalized_at IS NOT NULL))
);
CREATE INDEX attendance_summary_period_idx ON attendance_summary (year, month, status);

CREATE TABLE api_client (
  client_id    uuid PRIMARY KEY DEFAULT uuidv7(),
  name         text NOT NULL UNIQUE,
  key_hash     text NOT NULL UNIQUE,
  scopes       text[] NOT NULL DEFAULT '{summary:read}',
  allowed_ips  cidr[],
  status       record_status NOT NULL DEFAULT 'active',
  created_by   text REFERENCES employee,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE TABLE consent_document (
  version      text PRIMARY KEY,
  body_en      text NOT NULL,
  body_ar      text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tracking_consent (
  consent_id      uuid PRIMARY KEY DEFAULT uuidv7(),
  employee_id     text NOT NULL REFERENCES employee,
  consent_version text NOT NULL REFERENCES consent_document,
  device_id       uuid REFERENCES device,
  app_version     text,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE UNIQUE INDEX tracking_consent_one_active ON tracking_consent (employee_id, consent_version) WHERE revoked_at IS NULL;

CREATE TABLE notification (
  notification_id uuid PRIMARY KEY DEFAULT uuidv7(),
  recipient_id    text NOT NULL REFERENCES employee,
  type            notification_type NOT NULL,
  message_key     text NOT NULL,           -- rendered in the recipient's language at send time
  params          jsonb NOT NULL DEFAULT '{}',
  data            jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  read_at         timestamptz
);
CREATE INDEX notification_inbox_idx ON notification (recipient_id, created_at DESC);

-- Immutable audit log (SRS §5.2) with a SHA-256 hash chain: each row hashes its content plus the
-- previous row's hash, so any tampering breaks the chain (verify with audit_log_verify()).
CREATE TABLE audit_log (
  log_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id     text REFERENCES employee,
  actor_type   actor_type NOT NULL,
  action       text NOT NULL,
  entity       text NOT NULL,
  entity_id    text NOT NULL,
  before_value jsonb,
  after_value  jsonb,
  reason       text,
  request_id   text,
  ip           inet,
  user_agent   text,
  occurred_at  timestamptz NOT NULL DEFAULT clock_timestamp(),
  prev_hash    bytea,
  hash         bytea NOT NULL,
  CHECK ((actor_type = 'employee') = (actor_id IS NOT NULL))
);
CREATE INDEX audit_log_entity_idx ON audit_log (entity, entity_id, occurred_at);

CREATE FUNCTION audit_log_row_digest(r audit_log) RETURNS bytea LANGUAGE sql IMMUTABLE AS $$
  SELECT sha256(convert_to(concat_ws('|',
    coalesce(encode(r.prev_hash, 'hex'), ''), r.actor_id, r.actor_type, r.action, r.entity, r.entity_id,
    r.before_value::text, r.after_value::text, r.reason, r.request_id, r.ip::text, r.user_agent,
    to_char(r.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')), 'UTF8'))
$$;

CREATE FUNCTION audit_log_chain() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit_log_chain')); -- one link at a time
  SELECT hash INTO NEW.prev_hash FROM audit_log ORDER BY log_id DESC LIMIT 1;
  NEW.hash := audit_log_row_digest(NEW);
  RETURN NEW;
END $$;
CREATE TRIGGER audit_log_chain BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION audit_log_chain();
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();

-- Returns the first log_id whose hash or link does not verify (NULL = chain intact).
CREATE FUNCTION audit_log_verify() RETURNS bigint LANGUAGE plpgsql STABLE AS $$
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

CREATE TRIGGER attendance_status_change_no_truncate BEFORE TRUNCATE ON attendance_status_change
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();

-- migrate:down
DROP TRIGGER IF EXISTS attendance_status_change_no_truncate ON attendance_status_change;
DROP FUNCTION IF EXISTS audit_log_verify();
DROP TRIGGER IF EXISTS audit_log_chain ON audit_log;
DROP FUNCTION IF EXISTS audit_log_chain();
DROP FUNCTION IF EXISTS audit_log_row_digest(audit_log);
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS notification, tracking_consent, consent_document, api_client, attendance_summary,
  product_import_job, customer_visit_note, share_event, product_media, product, product_category;
