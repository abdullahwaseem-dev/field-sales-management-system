import { sql } from 'kysely';
import type { Db, Tx } from '../../db/database';

export const LIVE_CHANNEL = 'sfms_live';

/** Keeps the latest fix per on-duty rep (only if newer than what is stored). */
export async function upsertLive(
  trx: Db | Tx,
  employeeId: string,
  eventId: string,
  p: { ping_id: string; recorded_at: Date; lat: number; lng: number; accuracy_m: number | null },
) {
  await trx
    .insertInto('employee_live_location')
    .values({ employee_id: employeeId, attendance_event_id: eventId, ping_id: p.ping_id, recorded_at: p.recorded_at, lat: p.lat, lng: p.lng, accuracy_m: p.accuracy_m })
    .onConflict((oc) =>
      oc.column('employee_id').doUpdateSet((eb) => ({
        attendance_event_id: eb.ref('excluded.attendance_event_id'), ping_id: eb.ref('excluded.ping_id'), recorded_at: eb.ref('excluded.recorded_at'),
        lat: eb.ref('excluded.lat'), lng: eb.ref('excluded.lng'), accuracy_m: eb.ref('excluded.accuracy_m'), updated_at: new Date(),
      })).where('employee_live_location.recorded_at', '<', (eb) => eb.ref('excluded.recorded_at')))
    .execute();
}

/** Tells every API instance (and so every live-map viewer) that this employee changed. Sent on commit. */
export async function publishLive(trx: Db | Tx, employeeId: string) {
  await sql`SELECT pg_notify(${LIVE_CHANNEL}, ${employeeId})`.execute(trx);
}
