-- Public demo only: schedules the demo deployment's background jobs and the rep simulator (every 3 min).
-- Separate secret (Vault) and job names from production; safe to re-run.
--   psql "<postgres DB URL>" -v base_url=https://<demo>.vercel.app -v jobs_secret=<demo JOBS_SECRET> -f infra/supabase/schedule-demo.sql
\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT vault.update_secret(id, :'jobs_secret') FROM vault.secrets WHERE name = 'sfms_demo_jobs_secret';
SELECT vault.create_secret(:'jobs_secret', 'sfms_demo_jobs_secret', 'SFMS public demo: x-jobs-secret header')
WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'sfms_demo_jobs_secret');

CREATE OR REPLACE FUNCTION public.sfms_demo_call(base_url text, path text) RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT net.http_post(
    url := base_url || '/api/v1/' || path,
    headers := jsonb_build_object('content-type', 'application/json',
      'x-jobs-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sfms_demo_jobs_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000)
$$;
REVOKE ALL ON FUNCTION public.sfms_demo_call(text, text) FROM PUBLIC;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
  REVOKE ALL ON FUNCTION public.sfms_demo_call(text, text) FROM anon, authenticated;
END IF; END $$;

SELECT cron.schedule('sfms-demo-' || job, sched, format('SELECT public.sfms_demo_call(%L, %L)', :'base_url', path))
FROM (VALUES ('tick',          '*/3 * * * *',  'internal/demo/tick'),
             ('shift-timeout', '*/5 * * * *',  'internal/jobs/shift-timeout'),
             ('reminders',     '*/15 * * * *', 'internal/jobs/reminders'),
             ('absences',      '7 * * * *',    'internal/jobs/absences'),
             ('partitions',    '27 */6 * * *', 'internal/jobs/partitions')) AS j(job, sched, path);

SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'sfms-demo-%' ORDER BY jobname;
