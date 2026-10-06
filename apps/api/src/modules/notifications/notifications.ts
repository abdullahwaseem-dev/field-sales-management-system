import { Controller, Get, HttpCode, Inject, Injectable, Module, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser, type Principal } from '../../common/auth/principal';
import { type Db, KYSELY, type Tx } from '../../db/database';

export type NotificationType =
  | 'check_in' | 'check_out' | 'late_warning' | 'geofence_exit' | 'leave_decided'
  | 'correction_decided' | 'new_content' | 'fraud_flagged' | 'hours_completed' | 'target_set';

export interface NewNotification {
  recipientId: string;
  type: NotificationType;
  /** i18n key rendered in the recipient's language by the client (packages/i18n). */
  messageKey: string;
  params?: Record<string, string | number>;
  data?: Record<string, unknown>;
}

/**
 * Stores notifications (FR-NOT-01, FR-FRAUD-02). Delivery by push (FCM/APNs) is wired in when a
 * Firebase project is configured; the in-app inbox works without it.
 */
@Injectable()
export class NotificationService {
  constructor(@Inject(KYSELY) private readonly db: Db) {}

  async notify(n: NewNotification | NewNotification[], trx: Db | Tx = this.db) {
    const list = Array.isArray(n) ? n : [n];
    if (!list.length) return;
    await trx
      .insertInto('notification')
      .values(list.map((x) => ({
        recipient_id: x.recipientId,
        type: x.type,
        message_key: x.messageKey,
        params: JSON.stringify(x.params ?? {}),
        data: JSON.stringify(x.data ?? {}),
      })))
      .execute();
  }

  /** The single administrator, who receives every alert meant for management. */
  async administrator(trx: Db | Tx = this.db): Promise<string | null> {
    const row = await trx.selectFrom('employee').select('employee_id').where('role', '=', 'super_admin').where('status', '=', 'active').executeTakeFirst();
    return row?.employee_id ?? null;
  }
}

@Controller('notifications')
export class NotificationController {
  constructor(@Inject(KYSELY) private readonly db: Db) {}

  @Get()
  async list(@CurrentUser() user: Principal) {
    const rows = await this.db
      .selectFrom('notification')
      .select(['notification_id', 'type', 'message_key', 'params', 'data', 'created_at', 'read_at'])
      .where('recipient_id', '=', user.employeeId)
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();
    return {
      unread: rows.filter((r) => !r.read_at).length,
      items: rows.map((r) => ({
        id: r.notification_id, type: r.type, messageKey: r.message_key, params: r.params, data: r.data, createdAt: r.created_at, readAt: r.read_at,
      })),
    };
  }

  @Post(':id/read')
  @HttpCode(204)
  async read(@CurrentUser() user: Principal, @Param('id', ParseUUIDPipe) id: string) {
    await this.db.updateTable('notification').set({ read_at: new Date() }).where('notification_id', '=', id).where('recipient_id', '=', user.employeeId).where('read_at', 'is', null).execute();
  }

  @Post('read-all')
  @HttpCode(204)
  async readAll(@CurrentUser() user: Principal) {
    await this.db.updateTable('notification').set({ read_at: new Date() }).where('recipient_id', '=', user.employeeId).where('read_at', 'is', null).execute();
  }
}

@Module({ controllers: [NotificationController], providers: [NotificationService], exports: [NotificationService] })
export class NotificationsModule {}
