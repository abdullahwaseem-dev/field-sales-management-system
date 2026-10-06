import { CalendarDays, CircleCheck, CircleX, ClockAlert, Hourglass, type LucideIcon, ShieldQuestion, ShieldX } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFormat, useT } from '@/lib/i18n';

export const ATTENDANCE_STATUSES = ['present', 'late', 'absent', 'suspected_fake', 'confirmed_fake', 'on_leave'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** Icon per status — mirrors packages/tokens core.status so web and Flutter use the same glyphs. */
export const STATUS_ICON: Record<AttendanceStatus, LucideIcon> = {
  present: CircleCheck,
  late: ClockAlert,
  absent: CircleX,
  suspected_fake: ShieldQuestion,
  confirmed_fake: ShieldX,
  on_leave: CalendarDays,
};

// Full class names (not string-built) so Tailwind can see them.
const TONE: Record<AttendanceStatus, string> = {
  present: 'bg-status-present-bg text-status-present-fg border-status-present-border',
  late: 'bg-status-late-bg text-status-late-fg border-status-late-border',
  absent: 'bg-status-absent-bg text-status-absent-fg border-status-absent-border',
  // "Pending review" gets a dashed border as a second, non-colour cue.
  suspected_fake: 'bg-status-suspected-fake-bg text-status-suspected-fake-fg border-status-suspected-fake-border border-dashed',
  confirmed_fake: 'bg-status-confirmed-fake-bg text-status-confirmed-fake-fg border-status-confirmed-fake-border',
  on_leave: 'bg-status-on-leave-bg text-status-on-leave-fg border-status-on-leave-border',
};

export function StatusChip({ status, size = 'md', className }: { status: AttendanceStatus; size?: 'sm' | 'md'; className?: string }) {
  const { t } = useT();
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium',
        size === 'sm' ? 'h-6 px-2 text-label-sm' : 'h-7 px-2.5 text-label-sm',
        TONE[status],
        className,
      )}
    >
      <Icon aria-hidden className={size === 'sm' ? 'size-3.5' : 'size-(--zona-size-icon-sm)'} />
      {t(`status.${status}`)}
    </span>
  );
}

/** Second, independent signal for the 8-hour rule: never replaces the status, sits beside it. */
export function ShortHoursBadge({ shortfallMinutes }: { shortfallMinutes: number }) {
  const { t } = useT();
  const f = useFormat();
  return (
    <span className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full border border-line-strong bg-surface px-2 text-label-sm text-fg-muted">
      <Hourglass aria-hidden className="size-3.5" />
      {t('status.shortBy', { duration: f.duration(shortfallMinutes) })}
    </span>
  );
}
