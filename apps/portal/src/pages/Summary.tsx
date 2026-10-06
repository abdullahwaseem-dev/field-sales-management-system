import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Download, FileSpreadsheet, Lock, Printer, RefreshCw, Unlock } from 'lucide-react';
import { useState } from 'react';
import { todayInRiyadh, useErrorText } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TextAreaField } from '@/components/ui/field';
import { SelectField } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/states';
import { type AttendanceStatus, StatusChip } from '@/components/ui/status-chip';
import { useToast } from '@/components/ui/toast';
import { accessTokenForDownload, api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Ltr, type MessageId, useFormat, useLocaleSettings, useT } from '@/lib/i18n';
import { setParams, useLocation } from '@/lib/router';

interface Row { employee_id: string; full_name_en: string; full_name_ar: string; team_en: string | null; team_ar: string | null; present_days: number; absent_days: number; late_count: number; confirmed_fake_count: number; leave_days: number; short_hours_count: number; status: string; version: number }
interface View { year: number; month: number; pendingSuspected: number; period: { status: 'open' | 'draft' | 'finalized' | 'reopened'; computed_at: string | null; reopen_reason: string | null } | null; rows: Row[] }

const PERIOD_STYLE = { open: 'bg-sunken text-fg-muted', draft: 'bg-status-late-bg text-status-late-fg', finalized: 'bg-status-present-bg text-status-present-fg', reopened: 'bg-status-info-bg text-status-info-fg' };

function DayList({ year, month, row, editable, onChanged }: { year: number; month: number; row: Row; editable: boolean; onChanged: () => void }) {
  const { t } = useT();
  const f = useFormat();
  const { push } = useToast();
  const errorText = useErrorText();
  const days = useQuery({ queryKey: ['summary-days', year, month, row.employee_id], queryFn: () => api<any[]>(`/summary/${year}/${month}/employees/${row.employee_id}/days`) });
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState('present');
  const [reason, setReason] = useState('');
  const save = useMutation({
    mutationFn: (eventId: string) => api(`/summary/${year}/${month}/corrections`, { body: { eventId, status, reason } }),
    onSuccess: () => { setEditing(null); setReason(''); void days.refetch(); onChanged(); },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  return (
    <ul className="m-0 flex max-h-[60vh] list-none flex-col gap-2 overflow-auto p-0">
      {(days.data ?? []).map((d) => (
        <li key={d.event_id} className="rounded-md border border-line p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-label text-fg">{f.weekday(d.work_date)}</span>
            <StatusChip status={d.status as AttendanceStatus} size="sm" />
            <span className="flex-1 text-body tabular-nums text-fg-muted">
              {d.check_in_at ? `${f.siteTime(d.check_in_at)} → ${d.check_out_at ? f.siteTime(d.check_out_at) : '—'}` : ''}
              {d.worked_minutes != null ? ` · ${f.duration(d.worked_minutes)}` : ''}
            </span>
            {editable && !['suspected_fake', 'confirmed_fake', 'on_leave'].includes(d.status) ? (
              <Button size="sm" variant="ghost" onClick={() => { setEditing(d.event_id); setStatus(d.status === 'absent' ? 'present' : 'absent'); }}>{t('portal.correctDay')}</Button>
            ) : null}
          </div>
          {editing === d.event_id ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
              <SelectField label={t('portal.newStatus')} placeholder="" value={status} onValueChange={setStatus} options={(['present', 'late', 'absent'] as const).map((s) => ({ value: s, label: t(`status.${s}`) }))} />
              <TextAreaField label={t('portal.correctionReason')} rows={1} value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button disabled={reason.trim().length < 5} loading={save.isPending} onClick={() => save.mutate(d.event_id)}>{t('action.save')}</Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** HR month-end workflow (FR-ASM-01..05, BR-ATT-04). */
export function SummaryTab() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const { push } = useToast();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const now = todayInRiyadh();
  const prevMonth = (() => { const [y, m] = now.split('-').map(Number) as [number, number]; return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; })();
  const { params } = useLocation();
  const [month, setMonthState] = useState(params.get('month') ?? prevMonth);
  const setMonth = (m: string) => { setMonthState(m); setParams({ month: m }); };
  const [year, mm] = month.split('-').map(Number) as [number, number];
  const [reopen, setReopen] = useState(false);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState<Row | null>(null);
  const key = ['summary', year, mm];
  const view = useQuery({ queryKey: key, queryFn: () => api<View>(`/summary/${year}/${mm}`) });
  const act = useMutation({
    mutationFn: (action: 'compute' | 'finalize' | 'reopen') => api<View>(`/summary/${year}/${mm}/${action}`, { body: action === 'reopen' ? { reason } : {} }),
    onSuccess: (v) => { qc.setQueryData(key, v); setReopen(false); setReason(''); },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  const v = view.data;
  const status = v?.period?.status ?? 'open';
  const finalized = status === 'finalized';
  const download = async (format: 'csv' | 'xlsx') => {
    const res = await fetch(`/api/v1/summary/${year}/${mm}/export?format=${format}&lang=${ar ? 'ar' : 'en'}`, { headers: { authorization: `Bearer ${accessTokenForDownload()}` } });
    const blob = await res.blob();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `sfms-attendance-${month}.${format}` });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const cols: [keyof Row, MessageId][] = [['present_days', 'summary.present'], ['late_count', 'summary.late'], ['absent_days', 'summary.absent'], ['leave_days', 'summary.leave'], ['short_hours_count', 'summary.short'], ['confirmed_fake_count', 'status.confirmed_fake']];

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-end gap-3 p-4 print:hidden">
        <label className="flex flex-col gap-1.5 text-label text-fg">
          {t('portal.month')}
          <input type="month" value={month} max={now.slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} className="h-10 rounded-md border border-line-strong bg-surface px-3 text-body text-fg focus-visible:outline-2 focus-visible:outline-focus" />
        </label>
        <span className={cn('mb-2 rounded-full px-3 py-1 text-label-sm', PERIOD_STYLE[status])}>{t(`portal.period.${status}` as MessageId)}</span>
        {v?.period?.computed_at ? <span className="mb-2.5 text-caption text-fg-muted">{t('portal.computedAt', { time: f.siteDateTime(v.period.computed_at) })}</span> : null}
        <div className="ms-auto flex flex-wrap gap-2">
          {!finalized ? <Button variant="secondary" loading={act.isPending && act.variables === 'compute'} onClick={() => act.mutate('compute')}><RefreshCw aria-hidden />{t('portal.compute')}</Button> : null}
          {!finalized ? <Button disabled={!v?.rows.length || (v?.pendingSuspected ?? 0) > 0 || month >= now.slice(0, 7)} title={month >= now.slice(0, 7) ? t('error.MONTH_NOT_ENDED') : undefined} loading={act.isPending && act.variables === 'finalize'} onClick={() => act.mutate('finalize')}><Lock aria-hidden />{t('portal.finalize')}</Button>
            : <Button variant="secondary" onClick={() => setReopen(true)}><Unlock aria-hidden />{t('portal.reopen')}</Button>}
          <Button variant="secondary" disabled={!v?.rows.length} onClick={() => void download('csv')}><Download aria-hidden />{t('portal.exportCsv')}</Button>
          <Button variant="secondary" disabled={!v?.rows.length} onClick={() => void download('xlsx')}><FileSpreadsheet aria-hidden />{t('portal.exportExcel')}</Button>
          <Button variant="secondary" disabled={!v?.rows.length} onClick={() => window.print()}><Printer aria-hidden />{t('portal.exportPdf')}</Button>
        </div>
      </Card>
      {v && v.pendingSuspected > 0 && !finalized ? <p role="status" className="rounded-md border border-status-suspected-fake-border bg-status-suspected-fake-bg px-4 py-3 text-body text-status-suspected-fake-fg">{t('portal.blockedSuspected', { count: v.pendingSuspected })}</p> : null}
      {finalized ? <p role="status" className="rounded-md border border-status-present-border bg-status-present-bg px-4 py-3 text-body text-status-present-fg">{t('portal.finalizedNote')}</p> : null}
      {v && !v.rows.length ? <Card><EmptyState icon={CalendarClock} title={t('portal.monthlySummary')} body={t('portal.notComputed')} /></Card> : null}
      {v?.rows.length ? (
        <Card className="overflow-x-auto">
          <h2 className="hidden print:block print:p-4 print:text-title">{t('portal.monthlySummary')} · {month}</h2>
          <table className="w-full text-body">
            <caption className="sr-only">{t('portal.monthlySummary')}</caption>
            <thead>
              <tr className="bg-sunken text-label-sm text-fg-muted">
                <th scope="col" className="h-10 px-4 text-start font-medium">{t('table.employee')}</th>
                <th scope="col" className="px-3 text-start font-medium">{t('table.team')}</th>
                {cols.map(([, label]) => <th key={label} scope="col" className="px-3 text-end font-medium">{t(label)}</th>)}
                <th scope="col" className="px-3 text-end font-medium">{t('portal.version')}</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((r) => (
                <tr key={r.employee_id} className="border-t border-line hover:bg-canvas">
                  <td className="h-12 px-4">
                    <button type="button" className="text-start text-label text-brand-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus print:text-fg" onClick={() => setDays(r)}>{ar ? r.full_name_ar : r.full_name_en}</button>
                    <span className="block text-caption text-fg-muted"><Ltr>{r.employee_id}</Ltr></span>
                  </td>
                  <td className="px-3 text-fg-muted">{(ar ? r.team_ar : r.team_en) ?? '—'}</td>
                  {cols.map(([k]) => <td key={k} className={cn('px-3 text-end tabular-nums', k === 'confirmed_fake_count' && Number(r[k]) > 0 && 'text-status-confirmed-fake-fg', k === 'absent_days' && Number(r[k]) > 0 && 'text-status-absent-fg')}>{f.number(Number(r[k]))}</td>)}
                  <td className="px-3 text-end tabular-nums text-fg-muted">{f.number(r.version)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
      <Dialog open={reopen} onOpenChange={setReopen}>
        {reopen ? (
          <DialogContent title={t('portal.reopen')} footer={<><Button variant="ghost" onClick={() => setReopen(false)}>{t('action.cancel')}</Button><Button disabled={reason.trim().length < 5} loading={act.isPending} onClick={() => act.mutate('reopen')}>{t('portal.reopen')}</Button></>}>
            <TextAreaField label={t('portal.reopenReason')} required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </DialogContent>
        ) : null}
      </Dialog>
      <Dialog open={!!days} onOpenChange={(o) => !o && setDays(null)}>
        {days ? <DialogContent title={t('portal.daysOf', { name: ar ? days.full_name_ar : days.full_name_en })} className="max-w-3xl"><DayList year={year} month={mm} row={days} editable={!finalized} onChanged={() => void view.refetch()} /></DialogContent> : null}
      </Dialog>
    </div>
  );
}
