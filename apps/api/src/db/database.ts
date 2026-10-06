import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Kysely, PostgresDialect, sql, type Transaction } from 'kysely';
import pg from 'pg';
import { CONFIG, type Config } from '../config';
import type { DB } from './schema';

// `date` columns stay 'YYYY-MM-DD' strings (never shifted by a JS timezone); bigint/numeric as numbers.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(20, (v) => Number(v));
pg.types.setTypeParser(1700, (v) => Number(v));

/**
 * Connection options with verified TLS when a CA certificate is configured. (sslmode in the URL
 * would override an explicit `ssl` object in node-postgres, so it is removed in that case.)
 */
export function pgOptions(url: string, ca?: string): pg.ClientConfig {
  if (!ca) return { connectionString: url };
  const u = new URL(url);
  u.searchParams.delete('sslmode');
  u.searchParams.delete('sslrootcert');
  return { connectionString: u.toString(), ssl: { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true } };
}

export const KYSELY = Symbol('KYSELY');
export const PG_POOL = Symbol('PG_POOL');
export type Db = Kysely<DB>;
export type Tx = Transaction<DB>;
export const InjectDb = () => Inject(KYSELY);

/** Why an attendance status is changing — required by the attendance_status_trail trigger. */
export interface ChangeCause {
  cause:
    | 'check_in' | 'check_out' | 'fraud_flagged' | 'review_confirmed' | 'review_cleared'
    | 'correction_approved' | 'leave_approved' | 'leave_cancelled' | 'absent_marked' | 'month_correction';
  actorId?: string | null;
  reason?: string | null;
  fraudSignalId?: string | null;
  correctionRequestId?: string | null;
  leaveRequestId?: string | null;
}

/** Declares the cause for status changes made later in this transaction (transaction-local). */
export async function declareCause(trx: Tx, c: ChangeCause) {
  await sql`SELECT
    set_config('sfms.change_cause', ${c.cause}, true),
    set_config('sfms.actor_id', ${c.actorId ?? ''}, true),
    set_config('sfms.reason', ${c.reason ?? ''}, true),
    set_config('sfms.fraud_signal_id', ${c.fraudSignalId ?? ''}, true),
    set_config('sfms.correction_request_id', ${c.correctionRequestId ?? ''}, true),
    set_config('sfms.leave_request_id', ${c.leaveRequestId ?? ''}, true)`.execute(trx);
}

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [CONFIG],
      useFactory: (config: Config) => new pg.Pool({ ...pgOptions(config.DATABASE_URL, config.DATABASE_CA_CERT), max: config.DB_POOL_MAX, application_name: 'sfms-api', idleTimeoutMillis: 10_000 }),
    },
    {
      provide: KYSELY,
      inject: [PG_POOL],
      useFactory: (pool: pg.Pool) => new Kysely<DB>({ dialect: new PostgresDialect({ pool }) }),
    },
  ],
  exports: [KYSELY, PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(KYSELY) private readonly db: Db) {}
  async onApplicationShutdown() {
    await this.db.destroy();
  }
}
