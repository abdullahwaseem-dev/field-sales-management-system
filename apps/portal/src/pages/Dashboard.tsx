import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, ShieldAlert, Gauge, UserCheck, UserX, CalendarDays } from 'lucide-react';
import { initials, useLivePositions } from '@/app/live';
import { PageHeader } from '@/app/page';
import { ZonaMap } from '@/components/map/zona-map';
import { Card, CardHeader, KpiTile } from '@/components/ui/card';
import { DirIcon } from '@/components/ui/icon';
import { StatusChip } from '@/components/ui/status-chip';
import { api } from '@/lib/api';
import { useFormat, useLocaleSettings, useT } from '@/lib/i18n';
import { Link } from '@/lib/router';
import { ChevronRight } from 'lucide-react';

interface Dashboard { scheduled: number; onDuty: number; notCheckedIn: number; late: number; suspected: number; onLeave: number; pendingReviews: number; pendingLeave: number; pendingCorrections: number }

export function DashboardPage() {
  const { t } = useT();
  const f = useFormat();
  const { locale } = useLocaleSettings();
  const ar = locale === 'ar';
  const d = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/admin/dashboard'), refetchInterval: 30_000 });
  const live = useLivePositions();
  const k = d.data;
  const attention = [
    { label: t('portal.pendingReviews'), n: k?.pendingReviews ?? 0, to: '/attendance?tab=reviews', icon: ShieldAlert },
    { label: t('portal.pendingCorrections'), n: k?.pendingCorrections ?? 0, to: '/attendance?tab=corrections', icon: ClipboardCheck },
    { label: t('portal.pendingLeave'), n: k?.pendingLeave ?? 0, to: '/attendance?tab=leave', icon: CalendarDays },
  ];
  return (
    <>
      <PageHeader title={t('nav.dashboard')} description={f.date(new Date())} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label={t('kpi.onDuty')} value={f.number(k?.onDuty ?? 0)} sub={t('kpi.ofTeam', { total: f.number(k?.scheduled ?? 0) })} icon={UserCheck} />
        <KpiTile label={t('kpi.notCheckedIn')} value={f.number(k?.notCheckedIn ?? 0)} icon={UserX} tone="neutral" />
        <KpiTile label={t('kpi.late')} value={f.number(k?.late ?? 0)} icon={Gauge} tone="late" />
        <KpiTile label={t('kpi.suspected')} value={f.number(k?.suspected ?? 0)} icon={ShieldAlert} tone="suspected" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card className="overflow-hidden">
          <CardHeader
            title={t('portal.liveNow')}
            description={t('portal.onDutyCount', { count: live.rows.length })}
            actions={<Link to="/live-map" className="text-label text-brand-fg hover:underline">{t('nav.liveMap')}</Link>}
          />
          <ZonaMap
            label={t('nav.liveMap')}
            className="h-[26rem] rounded-none border-0"
            formatCount={f.number}
            markers={live.rows.map((r) => ({
              id: r.employee_id, lat: r.lat, lng: r.lng, status: r.status,
              initials: initials(ar ? r.full_name_ar : r.full_name_en, ar),
              ariaLabel: t('map.marker', { name: ar ? r.full_name_ar : r.full_name_en, initials: initials(ar ? r.full_name_ar : r.full_name_en, ar), status: t(`status.${r.status}`), time: f.siteTime(r.recorded_at) }),
            }))}
          />
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={t('portal.needsAttention')} />
            <ul className="m-0 list-none p-2">
              {attention.map((a) => (
                <li key={a.to}>
                  <Link to={a.to} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-focus">
                    <a.icon aria-hidden className="size-(--zona-size-icon-md) text-fg-muted" />
                    <span className="flex-1 text-body text-fg">{a.label}</span>
                    <span className={a.n ? 'rounded-full bg-accent-strong px-2 text-label-sm text-on-accent' : 'text-label-sm text-fg-muted'}>{f.number(a.n)}</span>
                    <DirIcon icon={ChevronRight} className="size-(--zona-size-icon-sm) text-fg-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title={t('portal.liveNow')} />
            <ul className="m-0 max-h-80 list-none overflow-auto p-2">
              {live.rows.length === 0 ? <li className="px-3 py-4 text-body text-fg-muted">{t('portal.noOneOnDuty')}</li> : null}
              {live.rows.map((r) => (
                <li key={r.employee_id} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label text-fg">{ar ? r.full_name_ar : r.full_name_en}</span>
                    <span className="block text-caption text-fg-muted">{t('portal.checkedInAt', { time: f.siteTime(r.check_in_at) })}</span>
                  </span>
                  <StatusChip status={r.status} size="sm" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
