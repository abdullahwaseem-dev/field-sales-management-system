import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Inbox, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader, todayInRiyadh, useErrorText } from '@/app/page';
import { ZonaMap } from '@/components/map/zona-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TextAreaField } from '@/components/ui/field';
import { SelectField } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/states';
import { type AttendanceStatus, ShortHoursBadge, StatusChip } from '@/components/ui/status-chip';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Ltr, type MessageId, useFormat, useLocaleSettings, useT } from '@/lib/i18n';
import { setParams, useLocation } from '@/lib/router';
import { isAdmin, useAuth } from '@/lib/auth';
import { SummaryTab } from './Summary';

interface RegisterRow {
  employee_id: string; full_name_en: string; full_name_ar: string; team_en: string | null; team_ar: string | null;
  event_id: string | null; status: AttendanceStatus | null; check_in_at: string | null; check_out_at: string | null; check_out_source: string | null;
  worked_minutes: number | null; shortfall_minutes: number | null; is_short_hours: boolean | null;
}
interface Signal { type: string; phase: string; evidence: Record<string, number | string>; detectedAt?: string; detected_at?: string }

function useSignalText() {
  const { t } = useT();
  const f = useFormat();
  return (s: Signal) => {
    const e = s.evidence ?? {};
    switch (s.type) {
      case 'gps_network_mismatch': return t('portal.signal.gps_network_mismatch', { distance: f.distance(Number(e.distanceM ?? 0)) });
      case 'impossible_speed': return t('portal.signal.impossible_speed', { speed: f.number(Number(e.kmh ?? 0)) });
      case 'outside_geofence': return t('portal.signal.outside_geofence', { distance: f.distance(Number(e.distanceM ?? 0)) });
      case 'mock_location': return t('portal.signal.mock_location');
      default: return t('portal.signal.rooted_device');
    }
  };
}

/** Decision panel next to the evidence (FR-ATM-02): a remark is mandatory either way. */
function ReviewDecision({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const { t } = useT();
  const { push } = useToast();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const [remark, setRemark] = useState('');
  const m = useMutation({
    mutationFn: (decision: 'confirm' | 'clear') => api(`/attendance/events/${eventId}/review`, { body: { decision, remark } }),
    onSuccess: () => {
      push({ variant: 'success', title: t('portal.decided') });
      void qc.invalidateQueries();
      onDone();
    },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  const ok = remark.trim().length >= 5;
  return (
    <div className="flex flex-col gap-3">
      <TextAreaField label={t('field.remark')} hint={t('field.remarkHint')} required rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
      <p className="text-caption text-fg-muted">{t('review.auditNote')}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={!ok} loading={m.isPending && m.variables === 'clear'} onClick={() => m.mutate('clear')}>{t('review.markGenuine')}</Button>
        <Button variant="danger" disabled={!ok} loading={m.isPending && m.variables === 'confirm'} onClick={() => m.mutate('confirm')}>{t('review.confirmFake')}</Button>
      </div>
    </div>
  );
}

function EventDetail({ eventId }: { eventId: string }) {
  const { t, has } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const signalText = useSignalText();
  const q = useQuery({ queryKey: ['event', eventId], queryFn: () => api<any>(`/attendance/events/${eventId}`) });
  if (!q.data) return <p className="text-body text-fg-muted">{t('state.loading')}</p>;
  const { event, employee, signals, trail } = q.data;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={event.status} />
        <span className="text-label text-fg">{ar ? employee.full_name_ar : employee.full_name_en}</span>
        <span className="text-body text-fg-muted"><Ltr>{employee.employee_id}</Ltr> · {f.day(event.workDate)}</span>
      </div>
      {event.checkIn?.lat ? (
        <ZonaMap
          label={t('portal.details')}
          className="h-48"
          fit="markers"
          markers={[{ id: 'in', lat: event.checkIn.lat, lng: event.checkIn.lng, status: event.status, initials: '•', ariaLabel: t('table.checkIn') }]}
        />
      ) : null}
      {signals.length ? (
        <div>
          <p className="mb-2 text-label-sm text-fg-muted">{t('review.evidence')}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {signals.map((s: Signal, i: number) => (
              <li key={i} className="flex items-start gap-2 rounded-md border border-line bg-sunken px-3 py-2 text-body text-fg">
                <ShieldAlert aria-hidden className="mt-0.5 size-(--zona-size-icon-sm) shrink-0 text-status-suspected-fake-fg" />
                {signalText(s)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <p className="mb-2 text-label-sm text-fg-muted">{t('portal.statusTrail')}</p>
        <ol className="m-0 flex list-none flex-col gap-2 border-s-2 border-line ps-4">
          {trail.map((c: any) => {
            const causeKey = `portal.cause.${c.cause}`;
            return (
            <li key={c.change_id} className="text-body">
              <span className="text-fg">{has(causeKey) ? t(causeKey) : c.cause}</span>
              {' → '}
              <span className="text-fg">{t(`status.${c.to_status}` as MessageId)}</span>
              <span className="block text-caption text-fg-muted">
                {f.siteDateTime(c.created_at)} · {c.actor_id ? (ar ? c.actor_ar : c.actor_en) : t('portal.system')}
                {c.reason ? ` — ${c.reason}` : ''}
              </span>
            </li>
            );
          })}
        </ol>
      </div>
      {event.status === 'suspected_fake' ? <ReviewDecision eventId={eventId} onDone={() => void q.refetch()} /> : null}
    </div>
  );
}

function RegisterTab() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const [date, setDate] = useState(todayInRiyadh());
  const [team, setTeam] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => api<{ team_id: string; name_en: string; name_ar: string }[]>('/admin/teams') });
  const qs = new URLSearchParams({ date, ...(team !== 'all' ? { teamId: team } : {}), ...(status !== 'all' ? { status } : {}) });
  const reg = useQuery({ queryKey: ['register', qs.toString()], queryFn: () => api<{ rows: RegisterRow[] }>(`/attendance/register?${qs}`) });
  const columns = useMemo<ColumnDef<RegisterRow, unknown>[]>(() => [
    { id: 'employee', accessorFn: (r) => (ar ? r.full_name_ar : r.full_name_en), meta: { label: t('table.employee') }, header: t('table.employee'), cell: ({ getValue }) => <span className="text-label text-fg">{getValue() as string}</span> },
    { id: 'id', accessorKey: 'employee_id', meta: { label: t('table.employeeId') }, header: t('table.employeeId'), cell: ({ getValue }) => <span className="tabular-nums text-fg-muted"><Ltr>{getValue() as string}</Ltr></span> },
    { id: 'team', accessorFn: (r) => (ar ? r.team_ar : r.team_en) ?? '—', meta: { label: t('table.team') }, header: t('table.team') },
    { id: 'in', accessorFn: (r) => r.check_in_at ?? '', meta: { label: t('table.checkIn'), numeric: true }, header: t('table.checkIn'), cell: ({ row: { original: r } }) => (r.check_in_at ? f.siteTime(r.check_in_at) : '—') },
    { id: 'out', accessorFn: (r) => r.check_out_at ?? '', meta: { label: t('table.checkOut'), numeric: true }, header: t('table.checkOut'), cell: ({ row: { original: r } }) => (r.check_out_at ? f.siteTime(r.check_out_at) : r.check_in_at ? <span className="text-fg-muted">{t('day.onDuty')}</span> : '—') },
    {
      id: 'worked', accessorFn: (r) => r.worked_minutes ?? -1, meta: { label: t('table.worked'), numeric: true }, header: t('table.worked'),
      cell: ({ row: { original: r } }) => (r.worked_minutes == null ? '—' : <span className="inline-flex items-center gap-2">{r.is_short_hours ? <ShortHoursBadge shortfallMinutes={r.shortfall_minutes ?? 0} /> : null}{f.duration(r.worked_minutes)}</span>),
    },
    { id: 'status', accessorFn: (r) => r.status ?? 'not', meta: { label: t('table.status') }, header: t('table.status'), cell: ({ row: { original: r } }) => (r.status ? <StatusChip status={r.status} size="sm" /> : <span className="text-label-sm text-fg-muted">{t('portal.notCheckedIn')}</span>) },
  ], [ar, f, t]);
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-label text-fg">
          {t('portal.today')}
          <input type="date" value={date} max={todayInRiyadh()} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-md border border-line-strong bg-surface px-3 text-body text-fg focus-visible:outline-2 focus-visible:outline-focus" />
        </label>
        <SelectField label={t('field.team')} placeholder={t('portal.allTeams')} value={team} onValueChange={setTeam} options={[{ value: 'all', label: t('portal.allTeams') }, ...(teams.data ?? []).map((x) => ({ value: x.team_id, label: ar ? x.name_ar : x.name_en }))]} />
        <SelectField label={t('table.status')} placeholder={t('portal.allStatuses')} value={status} onValueChange={setStatus} options={[{ value: 'all', label: t('portal.allStatuses') }, { value: 'not_checked_in', label: t('portal.notCheckedIn') }, ...(['present', 'late', 'absent', 'suspected_fake', 'confirmed_fake', 'on_leave'] as const).map((s) => ({ value: s, label: t(`status.${s}`) }))]} />
      </div>
      <DataTable
        data={reg.data?.rows ?? []}
        loading={reg.isLoading}
        columns={columns}
        getRowId={(r) => r.employee_id}
        rowLabel={(r) => (ar ? r.full_name_ar : r.full_name_en)}
        searchText={(r) => `${r.full_name_en} ${r.full_name_ar} ${r.employee_id}`}
        caption={t('table.caption', { date: f.day(date) })}
        maxHeight="calc(100dvh - 22rem)"
        rowActions={(row) => (row.original.event_id ? <DropdownMenuItem onSelect={() => setOpen(row.original.event_id)}><Eye aria-hidden />{t('action.viewDetails')}</DropdownMenuItem> : <DropdownMenuItem disabled>{t('portal.notCheckedIn')}</DropdownMenuItem>)}
      />
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open ? <DialogContent title={t('portal.details')} className="max-w-2xl">{<EventDetail eventId={open} />}</DialogContent> : null}
      </Dialog>
    </>
  );
}

function ReviewsTab() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const signalText = useSignalText();
  const q = useQuery({ queryKey: ['suspected'], queryFn: () => api<any[]>('/attendance/suspected') });
  if (q.data && !q.data.length) return <Card><EmptyState icon={Inbox} title={t('state.emptyReviewTitle')} body={t('state.emptyReviewBody')} /></Card>;
  return (
    <div className="flex flex-col gap-4">
      {(q.data ?? []).map((e) => (
        <Card key={e.event_id} className="grid gap-6 p-5 lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status="suspected_fake" size="sm" />
              <span className="text-label text-fg">{ar ? e.full_name_ar : e.full_name_en}</span>
              <span className="text-body text-fg-muted"><Ltr>{e.employee_id}</Ltr> · {f.day(e.work_date)} · {f.siteTime(e.check_in_at)}</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label={t('review.evidence')}>
              {(e.signals as Signal[]).map((s, i) => (
                <li key={i} className="flex items-start gap-2 rounded-md border border-line bg-sunken px-3 py-2 text-body text-fg">
                  <ShieldAlert aria-hidden className="mt-0.5 size-(--zona-size-icon-sm) shrink-0 text-status-suspected-fake-fg" />{signalText(s)}
                </li>
              ))}
            </ul>
            {e.check_in_lat ? <ZonaMap label={t('review.evidence')} className="h-44" markers={[{ id: e.event_id, lat: e.check_in_lat, lng: e.check_in_lng, status: 'suspected_fake', initials: '•', ariaLabel: t('table.checkIn') }]} /> : null}
          </div>
          <ReviewDecision eventId={e.event_id} onDone={() => void q.refetch()} />
        </Card>
      ))}
    </div>
  );
}

function DecideRow({ onDecide, children }: { onDecide: (approve: boolean, remark: string) => Promise<unknown>; children: React.ReactNode }) {
  const { t } = useT();
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState<boolean | null>(null);
  const act = async (approve: boolean) => { setBusy(approve); try { await onDecide(approve, remark); } finally { setBusy(null); } };
  return (
    <Card className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
      <div>{children}</div>
      <div className="flex flex-col gap-3">
        <TextAreaField label={t('field.remark')} hint={t('portal.approveRemark')} rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={remark.trim().length < 3} loading={busy === false} onClick={() => act(false)}>{t('action.reject')}</Button>
          <Button loading={busy === true} onClick={() => act(true)}>{t('action.approve')}</Button>
        </div>
      </div>
    </Card>
  );
}

function CorrectionsTab() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const { push } = useToast();
  const errorText = useErrorText();
  const q = useQuery({ queryKey: ['corrections'], queryFn: () => api<any[]>('/attendance/corrections?status=pending') });
  if (q.data && !q.data.length) return <Card><EmptyState icon={Inbox} title={t('portal.noPending')} body="" /></Card>;
  return (
    <div className="flex flex-col gap-4">
      {(q.data ?? []).map((r) => (
        <DecideRow key={r.request_id} onDecide={(approve, remark) => api(`/attendance/corrections/${r.request_id}/decide`, { body: { approve, remark } }).then(() => { push({ variant: 'success', title: t('portal.decided') }); void q.refetch(); }, (e) => push({ variant: 'danger', title: errorText(e) }))}>
          <p className="text-label text-fg">{ar ? r.full_name_ar : r.full_name_en} <span className="text-body text-fg-muted">· {f.day(r.work_date)}</span></p>
          <dl className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1 text-body">
            <dt /><dd className="m-0 text-label-sm text-fg-muted">{t('portal.current')}</dd><dd className="m-0 text-label-sm text-fg-muted">{t('portal.requested')}</dd>
            <dt className="text-fg-muted">{t('table.checkIn')}</dt><dd className="m-0 tabular-nums">{r.check_in_at ? f.siteTime(r.check_in_at) : '—'}</dd><dd className="m-0 tabular-nums font-medium">{r.requested_check_in_at ? f.siteTime(r.requested_check_in_at) : '—'}</dd>
            <dt className="text-fg-muted">{t('table.checkOut')}</dt><dd className="m-0 tabular-nums">{r.check_out_at ? f.siteTime(r.check_out_at) : '—'}</dd><dd className="m-0 tabular-nums font-medium">{r.requested_check_out_at ? f.siteTime(r.requested_check_out_at) : '—'}</dd>
          </dl>
          <p className="mt-3 rounded-md bg-sunken px-3 py-2 text-body text-fg">{r.reason}</p>
        </DecideRow>
      ))}
    </div>
  );
}

function LeaveTab() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const { push } = useToast();
  const errorText = useErrorText();
  const q = useQuery({ queryKey: ['leave-pending'], queryFn: () => api<any[]>('/leave?status=pending') });
  if (q.data && !q.data.length) return <Card><EmptyState icon={Inbox} title={t('portal.noPending')} body="" /></Card>;
  return (
    <div className="flex flex-col gap-4">
      {(q.data ?? []).map((r) => {
        const days = Math.round((Date.parse(r.end_date) - Date.parse(r.start_date)) / 86_400_000) + 1;
        return (
          <DecideRow key={r.request_id} onDecide={(approve, remark) => api(`/leave/${r.request_id}/decide`, { body: { approve, remark } }).then(() => { push({ variant: 'success', title: t('portal.decided') }); void q.refetch(); }, (e) => push({ variant: 'danger', title: errorText(e) }))}>
            <p className="text-label text-fg">{ar ? r.full_name_ar : r.full_name_en}</p>
            <p className="mt-1 text-body text-fg-muted">{t(r.type === 'off_day' ? 'leave.typeOffDay' : 'leave.typeLeave')} · {f.day(r.start_date)} – {f.day(r.end_date)} · {t('leave.days', { count: days })}</p>
            <p className="mt-3 rounded-md bg-sunken px-3 py-2 text-body text-fg">{r.reason}</p>
          </DecideRow>
        );
      })}
    </div>
  );
}

const TABS = [['register', 'portal.tabRegister'], ['reviews', 'portal.tabReviews'], ['corrections', 'portal.tabCorrections'], ['leave', 'portal.tabLeave'], ['summary', 'portal.tabSummary']] as const;

export function AttendancePage() {
  const { t } = useT();
  const { params } = useLocation();
  const { user } = useAuth();
  const tabs = TABS.filter(([id]) => id !== 'summary' || isAdmin(user)); // month-end is HR's job
  const tab = (params.get('tab') ?? 'register') as (typeof TABS)[number][0];
  return (
    <>
      <PageHeader title={t('nav.attendance')} />
      <div role="tablist" aria-label={t('nav.attendance')} className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setParams({ tab: id === 'register' ? null : id })}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-label focus-visible:outline-2 focus-visible:outline-focus', tab === id ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg')}>
            {t(label)}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'reviews' ? <ReviewsTab /> : tab === 'corrections' ? <CorrectionsTab /> : tab === 'leave' ? <LeaveTab /> : tab === 'summary' && isAdmin(user) ? <SummaryTab /> : <RegisterTab />}
      </div>
    </>
  );
}
