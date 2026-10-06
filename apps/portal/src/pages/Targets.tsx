import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, ClipboardList, Footprints, PackageCheck, Pencil, Target, Trash2, UsersRound } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { PageHeader, todayInRiyadh, useErrorText } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Card, KpiTile } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TextAreaField, TextField } from '@/components/ui/field';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { Ltr, useFormat, useLocaleSettings, useT } from '@/lib/i18n';
import { setParams, useLocation } from '@/lib/router';

interface Row {
  employee_id: string; full_name_en: string; full_name_ar: string; branch_en: string; branch_ar: string; team_en: string | null; team_ar: string | null;
  visits_target: number | null; orders_target: number | null; note: string | null; visits_done: number; orders_done: number;
}
interface Activity {
  activity_id: string; employee_id: string; full_name_en: string; full_name_ar: string; kind: 'visit' | 'order'; customer_name: string; note: string | null;
  occurred_at: string; work_date: string; voided_at: string | null; void_reason: string | null;
}
type Editing = { kind: 'one'; row: Row } | { kind: 'many'; ids: string[] | null };

/** Done vs target as a bar plus text (never colour alone). */
function Progress({ done, target, label }: { done: number; target: number | null; label: string }) {
  const { t } = useT();
  const f = useFormat();
  if (!target) return <span className="text-caption text-fg-muted">{f.number(done)} · {t('targets.noTarget')}</span>;
  const pct = Math.min(100, Math.round((done / target) * 100));
  return (
    <div className="flex min-w-36 flex-col gap-1">
      <span className="text-label-sm tabular-nums text-fg">{t('targets.progress', { done: f.number(done), target: f.number(target) })}</span>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={done} className="h-1.5 overflow-hidden rounded-full bg-sunken">
        <div className={done >= target ? 'h-full rounded-full bg-status-present-fg' : 'h-full rounded-full bg-brand'} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TargetForm({ month, editing, onDone }: { month: string; editing: Editing; onDone: () => void }) {
  const { t } = useT();
  const qc = useQueryClient();
  const { push } = useToast();
  const errorText = useErrorText();
  const checkboxId = useId();
  const row = editing.kind === 'one' ? editing.row : null;
  const [v, setV] = useState({ visits: String(row?.visits_target ?? ''), orders: String(row?.orders_target ?? ''), note: row?.note ?? '', overwrite: editing.kind === 'many' && editing.ids !== null });
  const visits = Number(v.visits || 0), orders = Number(v.orders || 0);
  const save = useMutation({
    mutationFn: () => (row
      ? api(`/admin/targets/${row.employee_id}/${month}`, { method: 'PUT', body: { visits, orders, note: v.note || undefined } })
      : api<{ applied: number; skipped: number }>('/admin/targets/bulk', { body: { month, visits, orders, note: v.note || undefined, overwrite: v.overwrite, ...(editing.kind === 'many' && editing.ids ? { employeeIds: editing.ids } : {}) } })),
    onSuccess: (r) => {
      const bulk = r as { applied?: number; skipped?: number };
      push({ variant: 'success', title: bulk.applied !== undefined ? t('targets.applied', { applied: bulk.applied, skipped: bulk.skipped ?? 0 }) : t('targets.saved') });
      void qc.invalidateQueries({ queryKey: ['targets'] });
      onDone();
    },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  const valid = Number.isInteger(visits) && Number.isInteger(orders) && visits >= 0 && orders >= 0 && visits + orders > 0;
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <TextField label={t('targets.visitsTarget')} icon={Footprints} type="number" inputMode="numeric" min={0} max={100000} ltrValue value={v.visits} onChange={(e) => setV({ ...v, visits: e.target.value })} />
      <TextField label={t('targets.ordersTarget')} icon={PackageCheck} type="number" inputMode="numeric" min={0} max={100000} ltrValue value={v.orders} onChange={(e) => setV({ ...v, orders: e.target.value })} />
      <div className="sm:col-span-2"><TextAreaField label={t('targets.note')} value={v.note} maxLength={500} onChange={(e) => setV({ ...v, note: e.target.value })} /></div>
      {editing.kind === 'many' ? (
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox id={checkboxId} checked={v.overwrite} onCheckedChange={(c) => setV({ ...v, overwrite: c === true })} />
          <label htmlFor={checkboxId} className="text-body text-fg">{t('targets.overwrite')}</label>
        </div>
      ) : null}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onDone}>{t('action.cancel')}</Button>
        <Button type="submit" loading={save.isPending} disabled={!valid}>{t('targets.set')}</Button>
      </div>
    </form>
  );
}

function VoidDialog({ activity, onClose }: { activity: Activity | null; onClose: () => void }) {
  const { t } = useT();
  const qc = useQueryClient();
  const errorText = useErrorText();
  const [reason, setReason] = useState('');
  const save = useMutation({
    mutationFn: () => api(`/admin/sales/activities/${activity!.activity_id}/void`, { body: { reason } }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['targets'] }); void qc.invalidateQueries({ queryKey: ['sales-log'] }); setReason(''); onClose(); },
  });
  return (
    <Dialog open={!!activity} onOpenChange={(o) => !o && onClose()}>
      {activity ? (
        <DialogContent title={t('targets.voidTitle')} description={t('targets.voidBody')}>
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <TextAreaField label={t('targets.voidReason')} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} required />
            {save.error ? <p role="alert" className="text-body text-status-absent-fg">{errorText(save.error)}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>{t('action.cancel')}</Button>
              <Button type="submit" variant="danger" loading={save.isPending} disabled={reason.trim().length < 3}>{t('targets.void')}</Button>
            </div>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function ActivityLog({ month }: { month: string }) {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const [voiding, setVoiding] = useState<Activity | null>(null);
  const log = useQuery({ queryKey: ['sales-log', month], queryFn: () => api<Activity[]>(`/admin/sales/activities?month=${month}`) });
  const columns = useMemo<ColumnDef<Activity, unknown>[]>(() => [
    { id: 'when', accessorKey: 'occurred_at', meta: { label: t('targets.when'), numeric: true }, header: t('targets.when'), cell: ({ getValue }) => <span className="tabular-nums">{f.siteDateTime(getValue() as string)}</span> },
    { id: 'name', accessorFn: (r) => (ar ? r.full_name_ar : r.full_name_en), meta: { label: t('table.employee') }, header: t('table.employee'), cell: ({ getValue }) => <span className="text-label text-fg">{getValue() as string}</span> },
    { id: 'kind', accessorFn: (r) => t(`targets.kind.${r.kind}`), meta: { label: t('targets.type') }, header: t('targets.type') },
    { id: 'customer', accessorKey: 'customer_name', meta: { label: t('targets.customer') }, header: t('targets.customer'), cell: ({ row: { original: r } }) => <span className={r.voided_at ? 'text-fg-muted line-through' : 'text-fg'}>{r.customer_name}</span> },
    { id: 'note', accessorFn: (r) => r.voided_at ? `${t('targets.voided')}: ${r.void_reason}` : r.note ?? '—', meta: { label: t('targets.note') }, header: t('targets.note'), cell: ({ row: { original: r }, getValue }) => <span className={r.voided_at ? 'text-label-sm text-status-absent-fg' : 'text-fg-muted'}>{getValue() as string}</span> },
  ], [ar, f, t]);
  if (log.data && !log.data.length) return <Card><EmptyState icon={ClipboardList} title={t('targets.emptyLog')} body={t('targets.emptyLogBody')} /></Card>;
  return (
    <>
      <DataTable
        data={log.data ?? []} loading={log.isLoading} columns={columns} getRowId={(r) => r.activity_id}
        rowLabel={(r) => `${ar ? r.full_name_ar : r.full_name_en} · ${r.customer_name}`}
        searchText={(r) => `${r.full_name_en} ${r.full_name_ar} ${r.employee_id} ${r.customer_name} ${r.note ?? ''}`}
        caption={t('targets.tabLog')} maxHeight="calc(100dvh - 22rem)"
        rowActions={(row) => (row.original.voided_at ? null : <DropdownMenuItem tone="danger" onSelect={() => setVoiding(row.original)}><Ban aria-hidden />{t('targets.void')}</DropdownMenuItem>)}
      />
      <VoidDialog activity={voiding} onClose={() => setVoiding(null)} />
    </>
  );
}

/** Monthly sales targets in visits and orders (no money), set by the administrator for every rep. */
export function TargetsPage() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const qc = useQueryClient();
  const { push } = useToast();
  const errorText = useErrorText();
  const { params } = useLocation();
  const [month, setMonthState] = useState(params.get('month') ?? todayInRiyadh().slice(0, 7));
  const [tab, setTab] = useState<'progress' | 'log'>('progress');
  const [editing, setEditing] = useState<Editing | null>(null);
  const setMonth = (m: string) => { setMonthState(m); setParams({ month: m }); };
  const board = useQuery({ queryKey: ['targets', month], queryFn: () => api<Row[]>(`/admin/targets?month=${month}`) });
  const rows = board.data ?? [];
  const sum = (k: keyof Row) => rows.reduce((n, r) => n + (Number(r[k]) || 0), 0);
  const remove = (r: Row) => api(`/admin/targets/${r.employee_id}/${month}`, { method: 'DELETE' })
    .then(() => qc.invalidateQueries({ queryKey: ['targets'] }), (e) => push({ variant: 'danger', title: errorText(e) }));
  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    { id: 'name', accessorFn: (r) => (ar ? r.full_name_ar : r.full_name_en), meta: { label: t('table.employee') }, header: t('table.employee'), cell: ({ row: { original: r }, getValue }) => (
      <span className="flex flex-col"><span className="text-label text-fg">{getValue() as string}</span><span className="text-caption text-fg-muted"><Ltr>{r.employee_id}</Ltr> · {(ar ? r.team_ar : r.team_en) ?? (ar ? r.branch_ar : r.branch_en)}</span></span>
    ) },
    { id: 'visits', accessorFn: (r) => (r.visits_target ? r.visits_done / r.visits_target : -1), meta: { label: t('targets.visits') }, header: t('targets.visits'), cell: ({ row: { original: r } }) => <Progress done={r.visits_done} target={r.visits_target} label={t('targets.visits')} /> },
    { id: 'orders', accessorFn: (r) => (r.orders_target ? r.orders_done / r.orders_target : -1), meta: { label: t('targets.orders') }, header: t('targets.orders'), cell: ({ row: { original: r } }) => <Progress done={r.orders_done} target={r.orders_target} label={t('targets.orders')} /> },
    { id: 'note', accessorFn: (r) => r.note ?? '', meta: { label: t('targets.note') }, header: t('targets.note'), cell: ({ getValue }) => <span className="line-clamp-2 max-w-64 text-caption text-fg-muted">{(getValue() as string) || '—'}</span> },
  ], [ar, t]);
  const withoutTarget = rows.filter((r) => !r.visits_target && !r.orders_target).length;
  return (
    <>
      <PageHeader
        title={t('nav.targets')}
        description={t('targets.body')}
        actions={(
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-label text-fg-muted">
              {t('portal.month')}
              <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="h-10 rounded-md border border-line-strong bg-surface px-3 text-body text-fg focus-visible:outline-2 focus-visible:outline-focus" />
            </label>
            <Button onClick={() => setEditing({ kind: 'many', ids: null })} disabled={!rows.length}><Target aria-hidden />{t('targets.setAll')}</Button>
          </div>
        )}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiTile label={t('targets.kpiVisits')} icon={Footprints} value={t('targets.progress', { done: f.number(sum('visits_done')), target: f.number(sum('visits_target')) })} />
        <KpiTile label={t('targets.kpiOrders')} icon={PackageCheck} value={t('targets.progress', { done: f.number(sum('orders_done')), target: f.number(sum('orders_target')) })} />
        <KpiTile label={t('targets.kpiNoTarget')} icon={UsersRound} tone={withoutTarget ? 'late' : 'neutral'} value={f.number(withoutTarget)} />
      </div>
      <Segmented
        className="mb-4" label={t('nav.targets')} value={tab} onChange={setTab}
        options={[{ value: 'progress', label: t('targets.tabProgress') }, { value: 'log', label: t('targets.tabLog') }]}
      />
      {tab === 'progress' ? (
        <DataTable
          data={rows} loading={board.isLoading} columns={columns} getRowId={(r) => r.employee_id}
          rowLabel={(r) => (ar ? r.full_name_ar : r.full_name_en)}
          searchText={(r) => `${r.full_name_en} ${r.full_name_ar} ${r.employee_id} ${r.team_en ?? ''} ${r.branch_en}`}
          caption={t('nav.targets')} maxHeight="calc(100dvh - 26rem)"
          bulkActions={(sel) => <Button size="sm" onClick={() => setEditing({ kind: 'many', ids: sel.map((r) => r.employee_id) })}><Target aria-hidden />{t('targets.setSelected')}</Button>}
          rowActions={(row) => (
            <>
              <DropdownMenuItem onSelect={() => setEditing({ kind: 'one', row: row.original })}><Pencil aria-hidden />{t('targets.set')}</DropdownMenuItem>
              {row.original.visits_target || row.original.orders_target ? <DropdownMenuItem tone="danger" onSelect={() => void remove(row.original)}><Trash2 aria-hidden />{t('targets.remove')}</DropdownMenuItem> : null}
            </>
          )}
        />
      ) : <ActivityLog month={month} />}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing ? (
          <DialogContent
            className="max-w-xl"
            title={editing.kind === 'one' ? t('targets.setFor', { name: ar ? editing.row.full_name_ar : editing.row.full_name_en }) : editing.ids ? t('targets.selectedCount', { count: f.number(editing.ids.length) }) : t('targets.setAll')}
          >
            <TargetForm month={month} editing={editing} onDone={() => setEditing(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
