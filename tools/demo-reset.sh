#!/usr/bin/env bash
# Rebuilds the PUBLIC DEMO database from scratch: schema, seed, demo layer, then three weeks of simulated
# activity. Never point this at production.
#   Local:     DATABASE_URL=postgres://localhost/sfms_demo tools/demo-reset.sh        (simulates in-process)
#   Deployed:  DATABASE_URL=… DEMO_BASE_URL=https://… JOBS_SECRET=… tools/demo-reset.sh
#              (simulates through the demo API, which sits next to the database — seconds, not minutes)
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
case "$DATABASE_URL" in *demo*|*localhost*|*127.0.0.1*) ;; *) [ "${I_KNOW_THIS_IS_THE_DEMO:-}" = yes ] || { echo "Refusing: DATABASE_URL doesn't look like a demo database (set I_KNOW_THIS_IS_THE_DEMO=yes)"; exit 1; } ;; esac
cd "$(dirname "$0")/.."

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c 'DROP SCHEMA IF EXISTS public CASCADE' -c 'CREATE SCHEMA public'
DBMATE_NO_DUMP_SCHEMA=true npx dbmate --url "$DATABASE_URL" --migrations-dir db/migrations up
SEED_PASSWORD=ZonaDemo2026 node db/seed/seed.mjs
SEED_PASSWORD=ZonaDemo2026 node db/seed/demo.mjs
DAYS=21
if [ -n "${DEMO_BASE_URL:-}" ] && [ -n "${JOBS_SECRET:-}" ]; then
  step() { curl -fsS -X POST -H "x-jobs-secret: $JOBS_SECRET" "$DEMO_BASE_URL/api/v1/internal/demo/backfill?$1" -o /dev/null; }
  step 'step=start'
  for d in $(seq "$DAYS" -1 0); do step "step=day&daysAgo=$d"; done
  step "step=finish&days=$DAYS"
  echo "✔ demo backfilled through $DEMO_BASE_URL"
else
  DEMO_MODE=true JOBS_ENABLED=false NODE_ENV=production OTP_DEV_ECHO=false JWT_SECRET="${JWT_SECRET:-demo-cli-not-used-for-tokens-000000000}" \
    node apps/api/dist/demo/cli.js "$DAYS"
fi
echo "✔ demo database rebuilt"
