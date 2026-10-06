-- Schedules SFMS background jobs on Supabase: pg_cron fires, pg_net calls the API over HTTPS.
-- The jobs secret lives in Supabase Vault (encrypted), never in cron.job.command.
-- Run (idempotent):
--   psql "<session-pooler URL>" -v base_url=https://<your-deployment>.vercel.app -v jobs_secret=<JOBS_SECRET> -f infra/supabase/schedule-jobs.sql
\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT vault.update_secret(id, :'jobs_secret') FROM vault.secrets WHERE name = 'sfms_jobs_secret';
SELECT vault.create_secret(:'jobs_secret', 'sfms_jobs_secret', 'SFMS: x-jobs-secret header for /api/v1/internal/jobs/*')
WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'sfms_jobs_secret');

CREATE OR REPLACE FUNCTION public.sfms_call_job(base_url text, job text) RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT net.http_post(
    url := base_url || '/api/v1/internal/jobs/' || job,
    headers := jsonb_build_object('content-type', 'application/json',
      'x-jobs-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sfms_jobs_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000)
$$;
REVOKE ALL ON FUNCTION public.sfms_call_job(text, text) FROM PUBLIC;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
  REVOKE ALL ON FUNCTION public.sfms_call_job(text, text) FROM anon, authenticated;
END IF; END $$;

SELECT cron.schedule('sfms-' || job, sched, format('SELECT public.sfms_call_job(%L, %L)', :'base_url', job))
FROM (VALUES ('shift-timeout', '* * * * *'),
             ('reminders',     '*/5 * * * *'),
             ('absences',      '*/30 * * * *'),
             ('partitions',    '17 */6 * * *'),
             ('retention',     '43 0 * * *')) AS j(job, sched);

SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'sfms-%' ORDER BY jobname;
