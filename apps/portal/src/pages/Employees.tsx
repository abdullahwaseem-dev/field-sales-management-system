import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { KeyRound, Pencil, Plus, Power } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type Credentials, CredentialsDialog, generatePassword, isStrongPassword, type PasswordChoice, PasswordFields } from '@/app/credentials';
import { PageHeader, useErrorText } from '@/app/page';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TextField } from '@/components/ui/field';
import { SelectField } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { isAdmin, useAuth } from '@/lib/auth';
import { Ltr, useLocaleSettings, useT } from '@/lib/i18n';
import { useLocation } from '@/lib/router';

interface Emp {
  employee_id: string; full_name_en: string; full_name_ar: string; email: string | null; mobile_e164: string | null; role: string; status: 'active' | 'inactive';
  shift_start: string; latest_start: string; branch_id: string; branch_en: string; branch_ar: string; team_id: string | null; team_en: string | null; team_ar: string | null;
}

/** Create or edit a sales rep. Accounts exist only because the administrator makes them here. */
function EmployeeForm({ initial, onDone, onCreated }: { initial?: Emp; onDone: () => void; onCreated: (c: Credentials) => void }) {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const { push } = useToast();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const branches = useQuery({ queryKey: ['branches'], queryFn: () => api<{ branch_id: string; name_en: string; name_ar: string }[]>('/admin/branches') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => api<{ team_id: string; name_en: string; name_ar: string; branch_id: string }[]>('/admin/teams') });
  const [pw, setPw] = useState<PasswordChoice>({ password: generatePassword(), mustChange: true });
  const [v, setV] = useState({
    employeeId: initial?.employee_id ?? '', nameEn: initial?.full_name_en ?? '', nameAr: initial?.full_name_ar ?? '', email: initial?.email ?? '',
    mobile: initial?.mobile_e164 ?? '', branchId: initial?.branch_id ?? '', teamId: initial?.team_id ?? 'none',
    shiftStart: initial?.shift_start?.slice(0, 5) ?? '09:00', latestStart: initial?.latest_start?.slice(0, 5) ?? '12:00',
  });
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  const save = useMutation({
    mutationFn: () => {
      const body = {
        nameEn: v.nameEn, nameAr: v.nameAr, email: v.email || undefined, mobile: v.mobile || undefined, branchId: v.branchId,
        teamId: v.teamId === 'none' ? null : v.teamId, shiftStart: v.shiftStart, latestStart: v.latestStart,
      };
      return initial
        ? api(`/admin/employees/${initial.employee_id}`, { method: 'PATCH', body })
        : api<{ employeeId: string }>('/admin/employees', { body: { ...body, employeeId: v.employeeId, password: pw.password, mustChangePassword: pw.mustChange } });
    },
    onSuccess: (res) => {
      if (!initial) onCreated({ employeeId: (res as { employeeId: string }).employeeId, name: ar ? v.nameAr : v.nameEn, password: pw.password, mustChange: pw.mustChange });
      else push({ variant: 'success', title: t('portal.employeeSaved') });
      void qc.invalidateQueries({ queryKey: ['employees'] });
      onDone();
    },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <TextField label={t('field.employeeId')} ltrValue value={v.employeeId} onChange={(e) => set('employeeId')(e.target.value.toUpperCase())} disabled={!!initial} required />
      <div className="hidden sm:block" />
      <TextField label={t('portal.nameEn')} lang="en" value={v.nameEn} onChange={(e) => set('nameEn')(e.target.value)} required />
      <TextField label={t('portal.nameAr')} lang="ar" dir="rtl" value={v.nameAr} onChange={(e) => set('nameAr')(e.target.value)} required />
      <TextField label={t('field.email')} ltrValue type="email" value={v.email} onChange={(e) => set('email')(e.target.value)} optional />
      <TextField label={t('field.phone')} ltrValue type="tel" placeholder="+9665XXXXXXXX" value={v.mobile} onChange={(e) => set('mobile')(e.target.value)} optional />
      <SelectField label={t('profile.branch')} placeholder={t('profile.branch')} value={v.branchId} onValueChange={set('branchId')} options={(branches.data ?? []).map((b) => ({ value: b.branch_id, label: ar ? b.name_ar : b.name_en }))} />
      <SelectField label={t('field.team')} placeholder={t('field.teamPlaceholder')} value={v.teamId} onValueChange={set('teamId')} options={[{ value: 'none', label: '—' }, ...(teams.data ?? []).filter((x) => !v.branchId || x.branch_id === v.branchId).map((x) => ({ value: x.team_id, label: ar ? x.name_ar : x.name_en }))]} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('portal.shiftWindow')} type="time" ltrValue value={v.shiftStart} onChange={(e) => set('shiftStart')(e.target.value)} />
        <TextField label="&nbsp;" aria-label={t('portal.shiftWindow')} type="time" ltrValue value={v.latestStart} onChange={(e) => set('latestStart')(e.target.value)} />
      </div>
      {!initial ? <div className="border-t border-line pt-4 sm:col-span-2"><PasswordFields value={pw} onChange={setPw} /></div> : null}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onDone}>{t('action.cancel')}</Button>
        <Button type="submit" loading={save.isPending} disabled={!v.employeeId || !v.nameEn || !v.nameAr || !v.branchId || (!initial && !isStrongPassword(pw.password))}>{t('action.save')}</Button>
      </div>
    </form>
  );
}

export function EmployeesPage() {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const { user } = useAuth();
  const { params } = useLocation();
  const { push } = useToast();
  const qc = useQueryClient();
  const admin = isAdmin(user);
  const [edit, setEdit] = useState<Emp | 'new' | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [reset, setReset] = useState<Emp | null>(null);
  const q = params.get('q') ?? '';
  const list = useQuery({ queryKey: ['employees', q], queryFn: () => api<Emp[]>(`/admin/employees?role=sales_rep${q ? `&q=${encodeURIComponent(q)}` : ''}`) });
  const toggle = (e: Emp) => api(`/admin/employees/${e.employee_id}`, { method: 'PATCH', body: { status: e.status === 'active' ? 'inactive' : 'active' } })
    .then(() => { push({ variant: 'success', title: t('portal.employeeSaved') }); void qc.invalidateQueries({ queryKey: ['employees'] }); });
  const columns = useMemo<ColumnDef<Emp, unknown>[]>(() => [
    { id: 'name', accessorFn: (r) => (ar ? r.full_name_ar : r.full_name_en), meta: { label: t('table.employee') }, header: t('table.employee'), cell: ({ getValue }) => <span className="text-label text-fg">{getValue() as string}</span> },
    { id: 'id', accessorKey: 'employee_id', meta: { label: t('table.employeeId') }, header: t('table.employeeId'), cell: ({ getValue }) => <span className="tabular-nums text-fg-muted"><Ltr>{getValue() as string}</Ltr></span> },
    { id: 'team', accessorFn: (r) => (ar ? r.team_ar : r.team_en) ?? '—', meta: { label: t('table.team') }, header: t('table.team') },
    { id: 'branch', accessorFn: (r) => (ar ? r.branch_ar : r.branch_en), meta: { label: t('profile.branch') }, header: t('profile.branch') },
    { id: 'window', accessorFn: (r) => r.shift_start, meta: { label: t('portal.shiftWindow'), numeric: true }, header: t('portal.shiftWindow'), cell: ({ row: { original: r } }) => <bdi dir="ltr">{r.shift_start.slice(0, 5)}–{r.latest_start.slice(0, 5)}</bdi> },
    { id: 'contact', accessorFn: (r) => r.mobile_e164 ?? '', meta: { label: t('field.phone') }, header: t('field.phone'), cell: ({ getValue }) => <Ltr>{(getValue() as string) || '—'}</Ltr> },
    { id: 'status', accessorKey: 'status', meta: { label: t('portal.status') }, header: t('portal.status'), cell: ({ row: { original: r } }) => <span className={r.status === 'active' ? 'text-label-sm text-status-present-fg' : 'text-label-sm text-fg-muted'}>{t(r.status === 'active' ? 'portal.active' : 'portal.inactive')}</span> },
  ], [ar, t]);
  return (
    <>
      <PageHeader title={t('nav.employees')} description={t('portal.employeesBody')} actions={admin ? <Button onClick={() => setEdit('new')}><Plus aria-hidden />{t('action.newEmployee')}</Button> : undefined} />
      <DataTable
        data={list.data ?? []}
        loading={list.isLoading}
        columns={columns}
        getRowId={(r) => r.employee_id}
        rowLabel={(r) => (ar ? r.full_name_ar : r.full_name_en)}
        searchText={(r) => `${r.full_name_en} ${r.full_name_ar} ${r.employee_id} ${r.email ?? ''}`}
        caption={t('nav.employees')}
        maxHeight="calc(100dvh - 16rem)"
        rowActions={admin ? (row) => (
          <>
            <DropdownMenuItem onSelect={() => setEdit(row.original)}><Pencil aria-hidden />{t('portal.editEmployee')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setReset(row.original)}><KeyRound aria-hidden />{t('portal.resetPassword')}</DropdownMenuItem>
            <DropdownMenuItem tone={row.original.status === 'active' ? 'danger' : undefined} onSelect={() => void toggle(row.original)}><Power aria-hidden />{t(row.original.status === 'active' ? 'portal.deactivate' : 'portal.activate')}</DropdownMenuItem>
          </>
        ) : undefined}
      />
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        {edit ? <DialogContent title={edit === 'new' ? t('action.newEmployee') : t('portal.editEmployee')} className="max-w-2xl"><EmployeeForm initial={edit === 'new' ? undefined : edit} onDone={() => setEdit(null)} onCreated={setCreds} /></DialogContent> : null}
      </Dialog>
      <ResetPasswordDialog employee={reset} onClose={() => setReset(null)} onDone={(c) => { setReset(null); setCreds(c); }} />
      <CredentialsDialog value={creds} onClose={() => setCreds(null)} />
    </>
  );
}

/** The administrator sets a new password (typed or generated); the rep's sessions end. */
function ResetPasswordDialog({ employee, onClose, onDone }: { employee: Emp | null; onClose: () => void; onDone: (c: Credentials) => void }) {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const errorText = useErrorText();
  const [pw, setPw] = useState<PasswordChoice>({ password: generatePassword(), mustChange: true });
  const name = employee ? (ar ? employee.full_name_ar : employee.full_name_en) : '';
  const save = useMutation({
    mutationFn: () => api(`/admin/employees/${employee!.employee_id}/reset-password`, { body: { password: pw.password, mustChangePassword: pw.mustChange } }),
    onSuccess: () => { onDone({ employeeId: employee!.employee_id, name, password: pw.password, mustChange: pw.mustChange }); setPw({ password: generatePassword(), mustChange: true }); },
  });
  return (
    <Dialog open={!!employee} onOpenChange={(o) => !o && onClose()}>
      {employee ? (
        <DialogContent title={t('cred.resetTitle', { name })} description={t('cred.resetBody')}>
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <PasswordFields value={pw} onChange={setPw} />
            {save.error ? <p role="alert" className="text-body text-status-absent-fg">{errorText(save.error)}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>{t('action.cancel')}</Button>
              <Button type="submit" loading={save.isPending} disabled={!isStrongPassword(pw.password)}>{t('portal.resetPassword')}</Button>
            </div>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
