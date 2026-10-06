-- migrate:up
-- PostgreSQL 18 has uuidv7() built in; managed Postgres 17 (e.g. Supabase) does not. Provide an
-- equivalent (RFC 9562 v7: 48-bit Unix-ms timestamp + random) only where it is missing.
DO $$
BEGIN
  IF to_regprocedure('uuidv7()') IS NULL THEN
    CREATE FUNCTION public.uuidv7() RETURNS uuid LANGUAGE sql VOLATILE AS $f$
      SELECT encode(
        set_bit(set_bit(
          overlay(uuid_send(gen_random_uuid())
                  PLACING substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
                  FROM 1 FOR 6),
          52, 1), 53, 1), 'hex')::uuid
    $f$;
  END IF;
END $$;

-- migrate:down
-- Left in place: tables depend on it as a column default.
