import { sql } from 'kysely';
import { ApiError } from '../../common/errors';
import type { Db, Tx } from '../../db/database';

/** Everything that decides how a given employee's day is judged, resolved at `now` in the branch timezone. */
export interface DayContext {
  employeeId: string;
  role: string;
  teamId: string | null;
  branchId: string;
  timezone: string;
  utcOffsetMinutes: number;
  workDate: string;
  windowStartAt: Date;
  latestStartAt: Date;
  configId: string;
  requiredWorkMinutes: number;
  graceMinutes: number;
  pingIntervalSeconds: number;
  outsideGeofenceAction: 'block' | 'flag';
  shiftTimeoutHours: number;
  photoRequired: boolean;
  isOffDay: boolean;
  holidayEn: string | null;
  holidayAr: string | null;
}

/** Resolves the day for `employeeId` at `at` (server time), or for an explicit local `workDate`. */
export async function dayContext(db: Db | Tx, employeeId: string, at: Date, workDate?: string): Promise<DayContext> {
  const { rows: [r] } = await sql<DayContext & { configIdNull: boolean }>`
    WITH emp AS (
      SELECT e.employee_id, e.role, e.team_id, e.branch_id, b.timezone, e.shift_start, e.latest_start, e.weekly_off_days,
             coalesce(${workDate ?? null}::date, (${at}::timestamptz AT TIME ZONE b.timezone)::date) AS work_date
      FROM employee e JOIN branch b ON b.branch_id = e.branch_id
      WHERE e.employee_id = ${employeeId}
    )
    SELECT emp.employee_id AS "employeeId", emp.role, emp.team_id AS "teamId", emp.branch_id AS "branchId",
           emp.timezone, emp.work_date::text AS "workDate",
           (extract(epoch FROM ((${at}::timestamptz AT TIME ZONE emp.timezone) - (${at}::timestamptz AT TIME ZONE 'UTC'))) / 60)::int AS "utcOffsetMinutes",
           (emp.work_date + emp.shift_start) AT TIME ZONE emp.timezone AS "windowStartAt",
           (emp.work_date + emp.latest_start) AT TIME ZONE emp.timezone AS "latestStartAt",
           c.config_id AS "configId", c.required_work_minutes AS "requiredWorkMinutes", c.grace_minutes AS "graceMinutes",
           c.ping_interval_seconds AS "pingIntervalSeconds", c.outside_geofence_action AS "outsideGeofenceAction",
           c.shift_timeout_hours AS "shiftTimeoutHours", c.photo_required AS "photoRequired",
           extract(isodow FROM emp.work_date)::int = ANY (emp.weekly_off_days) AS "isOffDay",
           h.name_en AS "holidayEn", h.name_ar AS "holidayAr"
    FROM emp
    CROSS JOIN LATERAL effective_attendance_config(emp.team_id, emp.work_date) c
    LEFT JOIN LATERAL (
      SELECT name_en, name_ar FROM holiday
      WHERE date = emp.work_date AND (branch_id IS NULL OR branch_id = emp.branch_id) LIMIT 1
    ) h ON true`.execute(db);
  if (!r) throw new ApiError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found');
  if (!r.configId) throw new ApiError(500, 'NO_ATTENDANCE_CONFIG', 'No attendance configuration is in effect');
  return r;
}

export interface NearestGeofence {
  geofenceId: string;
  nameEn: string;
  nameAr: string;
  distanceM: number;
}

/** Closest geofence assigned to the employee for the day, with the distance to its edge (0 = inside). */
export async function nearestGeofence(db: Db | Tx, employeeId: string, workDate: string, lat: number, lng: number): Promise<NearestGeofence | null> {
  const { rows: [g] } = await sql<NearestGeofence>`
    SELECT g.geofence_id AS "geofenceId", g.name_en AS "nameEn", g.name_ar AS "nameAr",
           geofence_distance_m(g.geofence_id, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS "distanceM"
    FROM employee_geofences(${employeeId}, ${workDate}::date) AS eg(geofence_id)
    JOIN geofence g ON g.geofence_id = eg.geofence_id
    ORDER BY 4
    LIMIT 1`.execute(db);
  return g ?? null;
}

/** GPS accuracy tolerance at the geofence edge: honour the reported accuracy, capped at 50 m. */
export const insideGeofence = (distanceM: number, accuracyM: number | undefined) => distanceM <= Math.min(accuracyM ?? 0, 50);
