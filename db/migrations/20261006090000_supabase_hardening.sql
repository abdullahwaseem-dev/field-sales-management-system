-- migrate:up
-- On Supabase, the `public` schema is reachable through the auto-generated Data API with the public
-- anon/authenticated roles. SFMS never uses that API — all access goes through the SFMS API (which
-- connects as the table owner and enforces roles, scope and audit). So: no privileges for those
-- roles, and row-level security on every table (no policies = deny) as a second wall.
-- A no-op on plain PostgreSQL where these roles don't exist.
DO $$
DECLARE r record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated';
    FOR r IN SELECT c.oid::regclass AS t FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname <> 'spatial_ref_sys' LOOP
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', r.t);
    END LOOP;
  END IF;
END $$;

-- New monthly location partitions get RLS too.
CREATE OR REPLACE FUNCTION ensure_location_ping_partitions(months_ahead integer DEFAULT 2) RETURNS integer
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
      EXECUTE format('CREATE TABLE %I PARTITION OF location_ping FOR VALUES FROM (%L) TO (%L)', part, m::timestamptz, (m + interval '1 month')::timestamptz);
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', part);
      created := created + 1;
    END IF;
  END LOOP;
  RETURN created;
END $$;

-- migrate:down
SELECT 1;
