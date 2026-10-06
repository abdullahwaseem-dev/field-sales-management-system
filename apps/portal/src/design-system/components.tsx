import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowRight, Bell, Download, Eye, Gauge, IdCard, Inbox, Mail, Phone, Plus, Route, Search,
  ShieldAlert, ShieldQuestion, Smartphone, UserCheck, UserX,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, KpiTile } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogPanel, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { TextAreaField, TextField } from '@/components/ui/field';
import { DirIcon } from '@/components/ui/icon';
import { ClusterMarker, EmployeeMarker } from '@/components/ui/map-marker';
import { Segmented } from '@/components/ui/segmented';
import { SelectField } from '@/components/ui/select';
import { Sidebar } from '@/components/ui/sidebar';
import { EmptyState, ErrorState, OfflineBanner, SkeletonRows } from '@/components/ui/states';
import { ATTENDANCE_STATUSES, ShortHoursBadge, StatusChip } from '@/components/ui/status-chip';
import { ToastCard, useToast } from '@/components/ui/toast';
import { Ltr, useFormat, useLocaleSettings, useT } from '@/lib/i18n';
import type { ThemePref } from '@/lib/preferences';
import { ComboGrid, Section, Specimen } from './combo';
import { REGISTER, type RegisterRow, SAMPLE_DAY, shortfall } from './sample-data';

function ButtonsSpecimen() {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button>{t('action.save')}</Button>
        <Button variant="accent">{t('hero.checkIn')}</Button>
        <Button variant="secondary"><Download aria-hidden />{t('action.export')}</Button>
        <Button variant="ghost">{t('action.cancel')}</Button>
        <Button variant="danger">{t('review.confirmFake')}</Button>
        <Button variant="link">{t('action.viewDetails')}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm"><Plus aria-hidden />{t('action.newEmployee')}</Button>
        <Button size="lg">{t('action.showMore')}<DirIcon icon={ArrowRight} /></Button>
        <Button loading>{t('action.save')}</Button>
        <Button disabled>{t('action.approve')}</Button>
        <Button variant="secondary" size="icon" aria-label={t('action.search')}><Search aria-hidden /></Button>
      </div>
    </div>
  );
}

function FormsSpecimen() {
  const { t } = useT();
  const [theme, setTheme] = useState<ThemePref>('system');
  const [hijri, setHijri] = useState(true);
  const hijriId = useId();
  const teams = [
    { value: 'rn', label: t('team.riyadhNorth') },
    { value: 'jc', label: t('team.jeddahCentral') },
    { value: 'de', label: t('team.dammamEast') },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField label={t('field.employeeId')} icon={IdCard} ltrValue defaultValue="ZN-10427" required />
      <TextField label={t('field.phone')} icon={Phone} ltrValue type="tel" defaultValue="+966 55 123 4567" hint={t('field.phoneHint')} />
      <TextField label={t('field.email')} icon={Mail} ltrValue type="email" defaultValue="faisal.alharbi@" error={t('field.errorRequired')} />
      <SelectField label={t('field.team')} placeholder={t('field.teamPlaceholder')} options={teams} defaultValue="jc" />
      <div className="flex flex-col gap-2">
        <span className="text-label text-fg">{t('settings.theme')}</span>
        <Segmented
          label={t('settings.theme')}
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: t('settings.themeSystem'), icon: Smartphone },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
      </div>
      <div className="flex items-center gap-3 self-end pb-2">
        <Checkbox id={hijriId} checked={hijri} onCheckedChange={(v) => setHijri(v === true)} />
        <label htmlFor={hijriId} className="text-body text-fg">{t('settings.hijri')}</label>
      </div>
    </div>
  );
}

function StatusSpecimen() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">{ATTENDANCE_STATUSES.map((s) => <StatusChip key={s} status={s} />)}</div>
      <div className="flex flex-wrap gap-2">{ATTENDANCE_STATUSES.map((s) => <StatusChip key={s} status={s} size="sm" />)}</div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status="present" />
        <ShortHoursBadge shortfallMinutes={82} />
      </div>
    </div>
  );
}

function CardsSpecimen() {
  const { t } = useT();
  const f = useFormat();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiTile label={t('kpi.onDuty')} value={f.number(42)} sub={t('kpi.ofTeam', { total: f.number(48) })} icon={UserCheck} delta={{ text: t('kpi.vsYesterday', { delta: f.signed(3) }), direction: 'up', upIsGood: true }} />
        <KpiTile label={t('kpi.notCheckedIn')} value={f.number(4)} icon={UserX} tone="neutral" delta={{ text: t('kpi.vsYesterday', { delta: f.signed(-2) }), direction: 'down', upIsGood: false }} />
        <KpiTile label={t('kpi.late')} value={f.number(7)} icon={Gauge} tone="late" delta={{ text: t('kpi.vsYesterday', { delta: f.signed(2) }), direction: 'up', upIsGood: false }} />
        <KpiTile label={t('kpi.suspected')} value={f.number(1)} icon={ShieldAlert} tone="suspected" delta={{ text: t('kpi.vsYesterday', { delta: f.signed(0) }), direction: 'flat', upIsGood: false }} />
      </div>
      <Card>
        <CardHeader title={t('ds.c.dashboardTitle')} description={f.date(SAMPLE_DAY)} actions={<Button variant="secondary" size="sm"><Download aria-hidden />{t('action.export')}</Button>} />
        <CardBody className="text-body text-fg-muted">{t('ds.sample.paragraph')}</CardBody>
      </Card>
    </div>
  );
}

function RegisterTable() {
  const { t } = useT();
  const f = useFormat();
  const { locale } = useLocaleSettings();
  const columns = useMemo<ColumnDef<RegisterRow, unknown>[]>(() => [
    {
      id: 'employee',
      accessorFn: (r) => r.name[locale],
      meta: { label: t('table.employee') },
      header: t('table.employee'),
      cell: ({ row: { original: r } }) => (
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-label-sm text-brand-fg">{r.initials[locale]}</span>
          <span className="text-label text-fg">{r.name[locale]}</span>
        </div>
      ),
    },
    {
      id: 'employeeId', accessorKey: 'employeeId', meta: { label: t('table.employeeId') }, header: t('table.employeeId'),
      cell: ({ getValue }) => <span className="tabular-nums text-fg-muted"><Ltr>{getValue() as string}</Ltr></span>,
    },
    { id: 'team', accessorFn: (r) => t(r.team), meta: { label: t('table.team') }, header: t('table.team') },
    {
      id: 'checkIn', accessorFn: (r) => r.checkIn?.getTime() ?? 0, meta: { label: t('table.checkIn'), numeric: true }, header: t('table.checkIn'),
      cell: ({ row: { original: r } }) => (r.checkIn ? f.time(r.checkIn) : <span className="text-fg-muted">—</span>),
    },
    {
      id: 'checkOut', accessorFn: (r) => r.checkOut?.getTime() ?? 0, meta: { label: t('table.checkOut'), numeric: true }, header: t('table.checkOut'),
      cell: ({ row: { original: r } }) => (r.checkOut ? f.time(r.checkOut) : <span className="text-fg-muted">—</span>),
    },
    {
      id: 'worked', accessorFn: (r) => r.workedMinutes ?? -1, meta: { label: t('table.worked'), numeric: true }, header: t('table.worked'),
      cell: ({ row: { original: r } }) => {
        const short = shortfall(r);
        if (r.workedMinutes === undefined) return <span className="text-fg-muted">—</span>;
        return (
          <span className="inline-flex items-center gap-2">
            {short ? <ShortHoursBadge shortfallMinutes={short} /> : null}
            {f.duration(r.workedMinutes)}
          </span>
        );
      },
    },
    {
      id: 'status', accessorKey: 'status', meta: { label: t('table.status') }, header: t('table.status'),
      cell: ({ row: { original: r } }) => <StatusChip status={r.status} size="sm" />,
    },
  ], [f, locale, t]);

  return (
    <DataTable
      data={REGISTER}
      columns={columns}
      getRowId={(r) => r.id}
      rowLabel={(r) => r.name[locale]}
      searchText={(r) => `${r.name.en} ${r.name.ar} ${r.employeeId} ${t(r.team)}`}
      caption={t('table.caption', { date: f.date(SAMPLE_DAY) })}
      maxHeight="22rem"
      rowActions={(row) => (
        <>
          <DropdownMenuItem><Eye aria-hidden />{t('action.viewDetails')}</DropdownMenuItem>
          <DropdownMenuItem><Route aria-hidden />{t('action.viewTrail')}</DropdownMenuItem>
          {row.original.status === 'suspected_fake' ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem><ShieldQuestion aria-hidden />{t('action.review')}</DropdownMenuItem>
            </>
          ) : null}
        </>
      )}
      bulkActions={() => <Button variant="secondary" size="sm"><Download aria-hidden />{t('action.export')}</Button>}
    />
  );
}

function ShellSpecimen() {
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-[30rem] overflow-hidden rounded-lg border border-line bg-canvas">
      <Sidebar active="attendance" collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} badges={{ attendance: 1 }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-line bg-surface px-5">
          <label className="relative max-w-md flex-1">
            <span className="sr-only">{t('action.search')}</span>
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-(--zona-size-icon-sm) -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              placeholder={t('nav.searchPlaceholder')}
              className="h-10 w-full rounded-md border border-line bg-canvas pe-14 ps-9 text-body text-fg placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-focus"
            />
            <kbd dir="ltr" className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 rounded-xs border border-line bg-surface px-1.5 text-caption text-fg-muted">⌘K</kbd>
          </label>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label={t('nav.settings')}><Bell aria-hidden /></Button>
            <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-full bg-brand text-label-sm text-on-brand">HR</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-5">
          <p className="text-title text-fg">{t('nav.attendance')}</p>
          <div className="mt-4 rounded-lg border border-line bg-surface p-4"><SkeletonRows rows={3} /></div>
        </main>
      </div>
    </div>
  );
}

/** Stylised map backdrop for the specimen. Geographic content is never mirrored, so it uses physical coordinates. */
function MapBackdrop() {
  return (
    <svg aria-hidden viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      <rect width="600" height="300" className="fill-map-land" />
      <path d="M0 230 C120 210 180 260 300 245 S500 205 600 225 L600 300 L0 300Z" className="fill-map-water" />
      <rect x="380" y="40" width="120" height="70" rx="14" className="fill-map-park" />
      <rect x="60" y="150" width="90" height="50" rx="12" className="fill-map-park" />
      <g className="stroke-map-road" strokeLinecap="round" fill="none">
        <path d="M-10 120 L620 95" strokeWidth="14" />
        <path d="M250 -10 L290 320" strokeWidth="14" />
        <path d="M-10 40 L620 180" strokeWidth="7" />
        <path d="M450 -10 L420 320" strokeWidth="7" />
        <path d="M80 -10 L130 320" strokeWidth="7" />
      </g>
    </svg>
  );
}

function MapSpecimen() {
  const { t } = useT();
  const f = useFormat();
  const { locale } = useLocaleSettings();
  const [selected, setSelected] = useState('4');
  const onMap = REGISTER.filter((r) => r.pos);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-72 overflow-hidden rounded-lg border border-line" role="group" aria-label={t('nav.liveMap')}>
        <MapBackdrop />
        {onMap.map((r) => (
          <div key={r.id} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${r.pos!.x}%`, top: `${r.pos!.y + 12}%` }}>
            <EmployeeMarker
              initials={r.initials[locale]}
              name={r.name[locale]}
              status={r.status}
              time={f.time(r.checkIn ?? SAMPLE_DAY)}
              selected={selected === r.id}
              onSelect={() => setSelected(r.id)}
            />
          </div>
        ))}
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: '60%', top: '82%' }}>
          <ClusterMarker count={12} label={f.number(12)} />
        </div>
        <span className="absolute bottom-2 end-2 rounded-sm bg-surface/90 px-2 py-0.5 text-caption text-fg-muted">{t('map.lastUpdate', { time: f.time(new Date(2026, 9, 5, 14, 32)) })}</span>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label={t('map.legend')}>
        {(['present', 'late', 'suspected_fake'] as const).map((s) => <StatusChip key={s} status={s} size="sm" />)}
      </div>
    </div>
  );
}

/** Review form state + body, shared by the in-place panel and the live modal. */
function useReviewDialog() {
  const { t } = useT();
  const f = useFormat();
  const { locale } = useLocaleSettings();
  const flagged = REGISTER.find((r) => r.status === 'suspected_fake')!;
  const [remark, setRemark] = useState('');
  const evidence = [
    t('review.signalMock'),
    t('review.signalMismatch', { distance: f.distance(1840) }),
    t('review.signalSpeed', { distance: f.distance(36000), minutes: 9 }),
  ];
  return {
    remark,
    body: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status="suspected_fake" size="sm" />
          <span className="text-label text-fg">{flagged.name[locale]}</span>
          <span className="text-body text-fg-muted"><Ltr>{flagged.employeeId}</Ltr> · {f.time(flagged.checkIn!)}</span>
        </div>
        <div>
          <p className="mb-2 text-label-sm text-fg-muted">{t('review.evidence')}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {evidence.map((e) => (
              <li key={e} className="flex items-start gap-2 rounded-md border border-line bg-sunken px-3 py-2 text-body text-fg">
                <ShieldAlert aria-hidden className="mt-0.5 size-(--zona-size-icon-sm) shrink-0 text-status-suspected-fake-fg" />
                {e}
              </li>
            ))}
          </ul>
        </div>
        <TextAreaField label={t('field.remark')} hint={t('field.remarkHint')} required value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
        <p className="text-caption text-fg-muted">{t('review.auditNote')}</p>
      </div>
    ),
  };
}

function DialogSpecimen() {
  const { t } = useT();
  const panel = useReviewDialog();
  const live = useReviewDialog();
  const footer = (remark: string) => (
    <>
      <Button variant="secondary" disabled={!remark.trim()}>{t('review.markGenuine')}</Button>
      <Button variant="danger" disabled={!remark.trim()}>{t('review.confirmFake')}</Button>
    </>
  );
  return (
    // The scrim sits on the frame's own canvas, exactly as it would over a real page.
    <div className="-m-5 flex flex-col items-start gap-4 rounded-lg bg-scrim p-5">
      <DialogPanel title={t('review.title')} footer={footer(panel.remark)}>{panel.body}</DialogPanel>
      <Dialog>
        <DialogTrigger asChild><Button variant="secondary" size="sm">{t('ds.tryIt')}</Button></DialogTrigger>
        <DialogContent title={t('review.title')} footer={footer(live.remark)}>{live.body}</DialogContent>
      </Dialog>
    </div>
  );
}

function ToastSpecimen() {
  const { t } = useT();
  const f = useFormat();
  const { push } = useToast();
  return (
    <div className="flex max-w-md flex-col gap-3">
      <ToastCard variant="success" title={t('toast.checkedIn', { time: f.time(new Date(2026, 9, 5, 9, 4)) })} description={t('toast.checkedInBody')} />
      <ToastCard variant="info" title={t('state.offlineTitle')} description={t('toast.offlineQueued', { count: 3 })} />
      <ToastCard variant="warning" title={t('toast.geofenceExit')} description={t('toast.geofenceExitBody')} />
      <ToastCard variant="danger" title={t('toast.saveFailed')} description={t('state.errorBody')} action={<Button variant="secondary" size="sm">{t('action.retry')}</Button>} />
      <div>
        <Button variant="secondary" size="sm" onClick={() => push({ variant: 'success', title: t('toast.leaveApproved'), description: t('toast.leaveApprovedBody', { name: t('ds.sample.name'), range: f.dateRange(new Date(2026, 9, 6), new Date(2026, 9, 8)) }) })}>
          {t('ds.tryIt')}
        </Button>
      </div>
    </div>
  );
}

function StatesSpecimen() {
  const { t } = useT();
  const f = useFormat();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-4"><SkeletonRows rows={3} /></Card>
      <Card><EmptyState icon={Inbox} title={t('state.emptyReviewTitle')} body={t('state.emptyReviewBody')} /></Card>
      <Card><ErrorState /></Card>
      <div className="flex flex-col gap-3">
        <OfflineBanner since={f.time(new Date(2026, 9, 5, 14, 5))} />
      </div>
    </div>
  );
}

export function ComponentsSection() {
  const { t } = useT();
  return (
    <Section id="components" title={t('ds.components')}>
      <Specimen id="buttons" title={t('ds.c.buttons')}><ComboGrid>{() => <ButtonsSpecimen />}</ComboGrid></Specimen>
      <Specimen id="forms" title={t('ds.c.forms')}><ComboGrid>{() => <FormsSpecimen />}</ComboGrid></Specimen>
      <Specimen id="status-chips" title={t('ds.c.status')}><ComboGrid>{() => <StatusSpecimen />}</ComboGrid></Specimen>
      <Specimen id="cards-kpi" title={t('ds.c.cards')}><ComboGrid>{() => <CardsSpecimen />}</ComboGrid></Specimen>
      <Specimen id="data-table" title={t('ds.c.table')}><ComboGrid layout="stack">{() => <RegisterTable />}</ComboGrid></Specimen>
      <Specimen id="sidebar-search" title={t('ds.c.shell')}><ComboGrid layout="stack">{() => <ShellSpecimen />}</ComboGrid></Specimen>
      <Specimen id="map-markers" title={t('ds.c.map')}><ComboGrid>{() => <MapSpecimen />}</ComboGrid></Specimen>
      <Specimen id="dialog" title={t('ds.c.dialog')}><ComboGrid>{() => <DialogSpecimen />}</ComboGrid></Specimen>
      <Specimen id="toasts" title={t('ds.c.toast')}><ComboGrid>{() => <ToastSpecimen />}</ComboGrid></Specimen>
      <Specimen id="states" title={t('ds.c.states')}><ComboGrid>{() => <StatesSpecimen />}</ComboGrid></Specimen>
    </Section>
  );
}

