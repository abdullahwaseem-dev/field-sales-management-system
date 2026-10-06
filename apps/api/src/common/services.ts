import { Global, Inject, Injectable, Module } from '@nestjs/common';
import { sql } from 'kysely';
import { type Db, KYSELY, type Tx } from '../db/database';

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

/** Writes to the hash-chained, append-only audit_log (SRS §5.2). */
@Injectable()
export class AuditService {
  constructor(@Inject(KYSELY) private readonly db: Db) {}

  async record(e: AuditEntry, trx: Db | Tx = this.db) {
    await trx
      .insertInto('audit_log')
      .values({
        actor_id: e.actorId,
        actor_type: e.actorId ? 'employee' : 'system',
        action: e.action,
        entity: e.entity,
        entity_id: e.entityId,
        before_value: e.before === undefined ? null : JSON.stringify(e.before),
        after_value: e.after === undefined ? null : JSON.stringify(e.after),
        reason: e.reason ?? null,
        request_id: e.requestId ?? null,
        ip: e.ip ?? null,
        user_agent: e.userAgent ?? null,
        hash: sql`''::bytea`, // replaced by the audit_log_chain trigger
      })
      .execute();
  }
}

/** Global settings (system_setting) with a short cache. */
@Injectable()
export class SettingsService {
  private cache = new Map<string, { value: unknown; at: number }>();
  constructor(@Inject(KYSELY) private readonly db: Db) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < 30_000) return hit.value as T;
    const row = await this.db.selectFrom('system_setting').select('value').where('key', '=', key).executeTakeFirst();
    const value = (row?.value ?? fallback) as T;
    this.cache.set(key, { value, at: Date.now() });
    return value;
  }

  invalidate() {
    this.cache.clear();
  }
}

@Global()
@Module({ providers: [AuditService, SettingsService], exports: [AuditService, SettingsService] })
export class CommonModule {}
