import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { type AttendanceStatus, STATUS_ICON } from './status-chip';

export const SOLID: Record<AttendanceStatus, string> = {
  present: 'bg-status-present-solid',
  late: 'bg-status-late-solid',
  absent: 'bg-status-absent-solid',
  suspected_fake: 'bg-status-suspected-fake-solid',
  confirmed_fake: 'bg-status-confirmed-fake-solid',
  on_leave: 'bg-status-on-leave-solid',
};

/**
 * Live-map marker for an on-duty rep: initials disc in the status colour, a 2px surface ring so
 * overlapping markers stay separable, a status glyph badge at the top corner (never colour alone),
 * and a pointer tip.
 * Rendered as HTML for Google Maps AdvancedMarkerElement in Phase 4.
 */
export function EmployeeMarker({ initials, name, status, time, selected, onSelect }: {
  initials: string; name: string; status: AttendanceStatus; time: string; selected?: boolean; onSelect?: () => void;
}) {
  const { t } = useT();
  const Icon = STATUS_ICON[status];
  return (
    <div className="relative flex flex-col items-center">
      {/* Visual name label for the selected marker sits outside the button; the button's accessible
          name already carries the name, and includes the visible initials (WCAG 2.5.3 Label in Name). */}
      {selected ? (
        <span aria-hidden className="absolute bottom-full mb-2 whitespace-nowrap rounded-md border border-line bg-overlay px-2.5 py-1 text-label-sm text-fg shadow-md">
          {name}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={t('map.marker', { name, initials, status: t(`status.${status}`), time })}
        className="group flex flex-col items-center focus-visible:outline-none"
      >
        <span
          className={cn(
            'relative inline-flex items-center justify-center rounded-full font-semibold text-on-solid ring-2 ring-surface shadow-md',
            'transition-transform duration-(--zona-motion-duration-fast) ease-standard',
            'group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus',
            selected ? 'size-12 text-label' : 'size-10 text-label-sm',
            SOLID[status],
          )}
        >
          {initials}
          <span className="absolute -end-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-surface text-fg ring-2 ring-surface">
            <Icon aria-hidden className="size-3.5" />
          </span>
        </span>
        <span aria-hidden className={cn('-mt-1 size-2.5 rotate-45 rounded-[2px] ring-2 ring-surface', SOLID[status])} />
      </button>
    </div>
  );
}

export function ClusterMarker({ count, label }: { count: number; label: string }) {
  const { t } = useT();
  return (
    <button
      type="button"
      aria-label={t('map.cluster', { count })}
      className="inline-flex size-14 items-center justify-center rounded-full bg-brand/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-brand text-label text-on-brand ring-2 ring-surface shadow-md">{label}</span>
    </button>
  );
}
