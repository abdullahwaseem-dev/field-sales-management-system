import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { initials, useLivePositions } from '@/app/live';
import { PageHeader, todayInRiyadh } from '@/app/page';
import { ZonaMap } from '@/components/map/zona-map';
import { Card } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/status-chip';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useFormat, useLocaleSettings, useT } from '@/lib/i18n';

interface Trail { points: { lat: number; lng: number; recorded_at: string }[] }

export function LiveMapPage() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const live = useLivePositions();
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const geofences = useQuery({ queryKey: ['geofences'], queryFn: () => api<{ geofence_id: string; name_en: string; name_ar: string; radius_m: number | null; geometry: never; status: string }[]>('/admin/geofences') });
  const trail = useQuery({
    queryKey: ['trail', selected],
    enabled: !!selected,
    queryFn: () => api<Trail>(`/location/trail?employeeId=${selected}&date=${todayInRiyadh()}`),
    refetchInterval: 60_000,
  });
  const rows = useMemo(() => live.rows.filter((r) => !q || `${r.full_name_en} ${r.full_name_ar} ${r.employee_id}`.toLowerCase().includes(q.toLowerCase())), [live.rows, q]);
  const sel = live.rows.find((r) => r.employee_id === selected);
  const name = (r: { full_name_en: string; full_name_ar: string }) => (ar ? r.full_name_ar : r.full_name_en);

  return (
    <>
      <PageHeader title={t('nav.liveMap')} description={t('portal.onDutyCount', { count: live.rows.length })} />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <ZonaMap
          label={t('nav.liveMap')}
          className="h-[60vh] min-h-96 lg:h-[calc(100dvh-13rem)]"
          formatCount={f.number}
          selectedId={selected}
          onSelect={setSelected}
          trail={trail.data?.points}
          fit={selected ? 'trail' : 'markers'}
          geofences={(geofences.data ?? []).filter((g) => g.status === 'active').map((g) => ({ id: g.geofence_id, geometry: g.geometry, radiusM: g.radius_m, label: ar ? g.name_ar : g.name_en, muted: true }))}
          markers={live.rows.map((r) => ({
            id: r.employee_id, lat: r.lat, lng: r.lng, status: r.status, initials: initials(name(r), ar),
            ariaLabel: t('map.marker', { name: name(r), initials: initials(name(r), ar), status: t(`status.${r.status}`), time: f.siteTime(r.recorded_at) }),
          }))}
        />
        <Card className="flex max-h-[calc(100dvh-13rem)] flex-col overflow-hidden">
          {sel ? (
            <div className="border-b border-line p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-subtitle text-fg">{name(sel)}</p>
                  <p className="text-caption text-fg-muted"><bdi dir="ltr">{sel.employee_id}</bdi> · {ar ? sel.team_ar : sel.team_en}</p>
                </div>
                <StatusChip status={sel.status} size="sm" />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-body">
                <dt className="text-fg-muted">{t('table.checkIn')}</dt><dd className="m-0 text-end tabular-nums">{f.siteTime(sel.check_in_at)}</dd>
                <dt className="text-fg-muted">{t('map.lastUpdate', { time: '' }).trim()}</dt><dd className="m-0 text-end tabular-nums">{f.siteTime(sel.recorded_at)}</dd>
                <dt className="text-fg-muted">{t('portal.trail')}</dt><dd className="m-0 text-end">{t('portal.trailPoints', { count: trail.data?.points.length ?? 0 })}</dd>
              </dl>
            </div>
          ) : null}
          <div className="p-3">
            <label className="sr-only" htmlFor="live-q">{t('action.search')}</label>
            <input id="live-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('action.search')} className="h-9 w-full rounded-md border border-line bg-canvas px-3 text-body text-fg focus-visible:outline-2 focus-visible:outline-focus" />
          </div>
          <ul className="m-0 min-h-0 flex-1 list-none overflow-auto p-2 pt-0">
            {rows.length === 0 ? <li className="px-3 py-4 text-body text-fg-muted">{t('portal.noOneOnDuty')}</li> : null}
            {rows.map((r) => (
              <li key={r.employee_id}>
                <button
                  type="button"
                  onClick={() => setSelected(r.employee_id === selected ? null : r.employee_id)}
                  aria-pressed={r.employee_id === selected}
                  className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-start hover:bg-sunken focus-visible:outline-2 focus-visible:outline-focus', r.employee_id === selected && 'bg-brand-subtle')}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label text-fg">{name(r)}</span>
                    <span className="block text-caption text-fg-muted">{t('map.lastUpdate', { time: f.siteTime(r.recorded_at) })}</span>
                  </span>
                  <StatusChip status={r.status} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
