import { CalendarCheck, ChartColumn, LayoutDashboard, type LucideIcon, MapPinned, Megaphone, PanelLeftClose, PanelLeftOpen, Settings, Target, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { type MessageId, useT } from '@/lib/i18n';
import { DirIcon } from './icon';
import { Logo } from './logo';
import { Tooltip } from './tooltip';

export const PORTAL_NAV: { id: string; label: MessageId; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'nav.employees', icon: Users },
  { id: 'attendance', label: 'nav.attendance', icon: CalendarCheck },
  { id: 'live-map', label: 'nav.liveMap', icon: MapPinned },
  { id: 'targets', label: 'nav.targets', icon: Target },
  { id: 'marketing', label: 'nav.marketing', icon: Megaphone },
  { id: 'reports', label: 'nav.reports', icon: ChartColumn },
  { id: 'settings', label: 'nav.settings', icon: Settings },
];

/** Collapsible left-nav (SRS §4). Collapsed: icon rail with tooltips on the inline-end side. */
export function Sidebar({ active, collapsed, onToggle, badges, onNavigate, hidden = [] }: {
  active: string; collapsed: boolean; onToggle: () => void; badges?: Partial<Record<string, number>>;
  /** Sections the current role cannot use. */
  hidden?: string[];
  /** Client-side navigation; without it (specimens) links do nothing. */
  onNavigate?: (id: string) => void;
}) {
  const { t } = useT();
  return (
    <nav
      aria-label={t('nav.main')}
      className={cn(
        'flex h-full shrink-0 flex-col border-e border-line bg-surface',
        'transition-[width] duration-(--zona-motion-duration-base) ease-standard',
        collapsed ? 'w-(--zona-size-sidebar-collapsed)' : 'w-(--zona-size-sidebar)',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-line', collapsed ? 'justify-center' : 'px-5')}>
        {collapsed ? <Logo kind="mark" height={28} /> : <Logo kind="lockup" height={26} />}
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 p-3">
        {PORTAL_NAV.filter((item) => !hidden.includes(item.id)).map((item) => {
          const isActive = item.id === active;
          const badge = badges?.[item.id];
          const link = (
            <a
              href={item.id === 'dashboard' ? '/' : `/${item.id}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={collapsed ? t(item.label) : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey) return;
                e.preventDefault();
                onNavigate?.(item.id);
              }}
              className={cn(
                'relative flex h-10 items-center gap-3 rounded-md text-label text-fg-muted pointer-coarse:h-12',
                'transition-colors duration-(--zona-motion-duration-fast) ease-standard',
                'hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus',
                collapsed ? 'justify-center' : 'px-3',
                isActive && 'bg-brand-subtle text-brand-fg hover:bg-brand-subtle hover:text-brand-fg',
                // Active indicator: a short accent bar on the inline-start edge (mirrors in RTL).
                isActive && 'before:absolute before:inset-y-2 before:-start-3 before:w-1 before:rounded-e-full before:bg-accent before:content-[""]',
              )}
            >
              <item.icon aria-hidden className="size-(--zona-size-icon-md) shrink-0" />
              {collapsed ? null : <span className="flex-1 truncate">{t(item.label)}</span>}
              {badge ? (
                <span className={cn('inline-flex min-w-5 items-center justify-center rounded-full bg-status-suspected-fake-solid px-1.5 text-label-sm text-on-solid', collapsed && 'absolute -top-0.5 end-1.5 h-4 min-w-4 px-1')}>
                  {badge}
                </span>
              ) : null}
            </a>
          );
          return <li key={item.id}>{collapsed ? <Tooltip content={t(item.label)}>{link}</Tooltip> : link}</li>;
        })}
      </ul>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className={cn(
            'flex h-10 w-full items-center gap-3 rounded-md text-label text-fg-muted hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-focus',
            collapsed ? 'justify-center' : 'px-3',
          )}
        >
          <DirIcon icon={collapsed ? PanelLeftOpen : PanelLeftClose} className="size-(--zona-size-icon-md)" />
          {collapsed ? <span className="sr-only">{t('nav.expand')}</span> : t('nav.collapse')}
        </button>
      </div>
    </nav>
  );
}
