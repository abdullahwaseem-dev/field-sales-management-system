import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { todayInRiyadh, useErrorText } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TextField } from '@/components/ui/field';
import { SelectField } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { Ltr, type MessageId, useFormat, useLocaleSettings, useT } from '@/lib/i18n';

interface Branch { branch_id: string; code: string; name_en: string; name_ar: string; timezone: string; status: string }
interface Team { team_id: string; name_en: string; name_ar: string; status: string; branch_id: string; branch_en: string; branch_ar: string }
interface Holiday { holiday_id: string; date: string; name_en: string; name_ar: string; kind: 'public_holiday' | 'company_off_day'; branch_en: string | null; branch_ar: string | null }

function useSave<T>(path: string, keys: string[], onDone: () => void) {
  const qc = useQueryClient();
  const { t } = useT();
  const { push } = useToast();
  const errorText = useErrorText();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: T }) => api(id ? `${path}/${id}` : path, { method: id ? 'PATCH' : 'POST', body }),
    onSuccess: () => { keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] })); push({ variant: 'success', title: t('portal.saved') }); onDone(); },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
}

function BranchForm({ initial, onDone }: { initial?: Branch; onDone: () => void }) {
  const { t } = useT();
  const [v, setV] = useState({ code: initial?.code ?? '', nameEn: initial?.name_en ?? '', nameAr: initial?.name_ar ?? '' });
  const save = useSave('/admin/org/branches', ['org-branches', 'branches'], onDone);
  return (
    <form className="grid gap-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save.mutate({ id: initial?.branch_id, body: { ...v, timezone: 'Asia/Riyadh' } }); }}>
      <TextField label={t('portal.code')} ltrValue value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} required />
      <TextField label={t('portal.nameEn')} lang="en" value={v.nameEn} onChange={(e) => setV({ ...v, nameEn: e.target.value })} required />
      <TextField label={t('portal.nameAr')} lang="ar" dir="rtl" value={v.nameAr} onChange={(e) => setV({ ...v, nameAr: e.target.value })} required />
      <div className="flex justify-end gap-2 sm:col-span-3"><Button type="button" variant="ghost" onClick={onDone}>{t('action.cancel')}</Button><Button type="submit" loading={save.isPending} disabled={!v.code || !v.nameEn || !v.nameAr}>{t('action.save')}</Button></div>
    </form>
  );
}

function TeamForm({ initial, branches, onDone }: { initial?: Team; branches: Branch[]; onDone: () => void }) {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const [v, setV] = useState({ branchId: initial?.branch_id ?? branches[0]?.branch_id ?? '', nameEn: initial?.name_en ?? '', nameAr: initial?.name_ar ?? '' });
  const save = useSave('/admin/org/teams', ['org-teams', 'teams'], onDone);
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate({ id: initial?.team_id, body: v }); }}>
      <SelectField label={t('profile.branch')} placeholder={t('profile.branch')} value={v.branchId} onValueChange={(x) => setV({ ...v, branchId: x })} options={branches.map((b) => ({ value: b.branch_id, label: ar ? b.name_ar : b.name_en }))} />
      <div className="hidden sm:block" />
      <TextField label={t('portal.nameEn')} lang="en" value={v.nameEn} onChange={(e) => setV({ ...v, nameEn: e.target.value })} required />
      <TextField label={t('portal.nameAr')} lang="ar" dir="rtl" value={v.nameAr} onChange={(e) => setV({ ...v, nameAr: e.target.value })} required />
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={onDone}>{t('action.cancel')}</Button><Button type="submit" loading={save.isPending} disabled={!v.branchId || !v.nameEn || !v.nameAr}>{t('action.save')}</Button></div>
    </form>
  );
}

function HolidayForm({ branches, onDone }: { branches: Branch[]; onDone: () => void }) {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const [v, setV] = useState({ date: todayInRiyadh(), nameEn: '', nameAr: '', kind: 'public_holiday', branchId: 'all' });
  const save = useSave('/admin/holidays', ['holidays'], onDone);
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate({ body: { ...v, branchId: v.branchId === 'all' ? null : v.branchId } }); }}>
      <TextField label={t('portal.date')} type="date" ltrValue value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
      <SelectField label={t('portal.itemType')} placeholder="" value={v.kind} onValueChange={(x) => setV({ ...v, kind: x })} options={(['public_holiday', 'company_off_day'] as const).map((k) => ({ value: k, label: t(`portal.kind.${k}`) }))} />
      <TextField label={t('portal.nameEn')} lang="en" value={v.nameEn} onChange={(e) => setV({ ...v, nameEn: e.target.value })} required />
      <TextField label={t('portal.nameAr')} lang="ar" dir="rtl" value={v.nameAr} onChange={(e) => setV({ ...v, nameAr: e.target.value })} required />
      <SelectField label={t('profile.branch')} placeholder={t('portal.allBranches')} value={v.branchId} onValueChange={(x) => setV({ ...v, branchId: x })} options={[{ value: 'all', label: t('portal.allBranches') }, ...branches.map((b) => ({ value: b.branch_id, label: ar ? b.name_ar : b.name_en }))]} />
      <div className="flex items-end justify-end gap-2"><Button type="button" variant="ghost" onClick={onDone}>{t('action.cancel')}</Button><Button type="submit" loading={save.isPending} disabled={!v.nameEn || !v.nameAr}>{t('action.save')}</Button></div>
    </form>
  );
}

/** Real-deployment setup: branches, teams and the holiday calendar (BR-ATT-03). */
export function OrgSettings({ canEdit }: { canEdit: boolean }) {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const qc = useQueryClient();
  const { push } = useToast();
  const errorText = useErrorText();
  const branches = useQuery({ queryKey: ['org-branches'], queryFn: () => api<Branch[]>('/admin/org/branches') });
  const teams = useQuery({ queryKey: ['org-teams'], queryFn: () => api<Team[]>('/admin/org/teams') });
  const holidays = useQuery({ queryKey: ['holidays'], queryFn: () => api<Holiday[]>('/admin/holidays') });
  const [dialog, setDialog] = useState<{ kind: 'branch' | 'team' | 'holiday'; item?: Branch | Team } | null>(null);
  const today = todayInRiyadh();
  const row = 'flex items-center gap-3 border-t border-line px-5 py-3 first:border-t-0';
  return (
    <>
      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('portal.branches')} actions={canEdit ? <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'branch' })}><Plus aria-hidden />{t('portal.newBranch')}</Button> : undefined} />
          <ul className="m-0 list-none p-0">
            {(branches.data ?? []).map((b) => (
              <li key={b.branch_id} className={row}>
                <span className="w-16 font-mono text-caption text-fg-muted"><Ltr>{b.code}</Ltr></span>
                <span className="flex-1 text-label text-fg">{ar ? b.name_ar : b.name_en}</span>
                {canEdit ? <Button size="icon-sm" variant="ghost" aria-label={`${t('portal.edit')} ${ar ? b.name_ar : b.name_en}`} onClick={() => setDialog({ kind: 'branch', item: b })}><Pencil aria-hidden /></Button> : null}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={t('portal.teams')} actions={canEdit ? <Button size="sm" variant="secondary" disabled={!branches.data?.length} onClick={() => setDialog({ kind: 'team' })}><Plus aria-hidden />{t('portal.newTeam')}</Button> : undefined} />
          <ul className="m-0 list-none p-0">
            {(teams.data ?? []).length === 0 ? <li className="px-5 py-4 text-body text-fg-muted">—</li> : null}
            {(teams.data ?? []).map((x) => (
              <li key={x.team_id} className={row}>
                <span className="flex-1">
                  <span className="block text-label text-fg">{ar ? x.name_ar : x.name_en}</span>
                  <span className="block text-caption text-fg-muted">{ar ? x.branch_ar : x.branch_en}</span>
                </span>
                {canEdit ? <Button size="icon-sm" variant="ghost" aria-label={`${t('portal.edit')} ${ar ? x.name_ar : x.name_en}`} onClick={() => setDialog({ kind: 'team', item: x })}><Pencil aria-hidden /></Button> : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mb-6">
        <CardHeader title={t('portal.holidays')} description={t('portal.holidaysBody')} actions={canEdit ? <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'holiday' })}><Plus aria-hidden />{t('portal.newHoliday')}</Button> : undefined} />
        <ul className="m-0 list-none p-0">
          {(holidays.data ?? []).map((h) => (
            <li key={h.holiday_id} className={row}>
              <span className="w-36 tabular-nums text-body text-fg">{f.day(h.date)}</span>
              <span className="flex-1">
                <span className="block text-label text-fg">{ar ? h.name_ar : h.name_en}</span>
                <span className="block text-caption text-fg-muted">{t(`portal.kind.${h.kind}` as MessageId)} · {(ar ? h.branch_ar : h.branch_en) ?? t('portal.allBranches')}</span>
              </span>
              {canEdit && h.date >= today ? (
                <Button size="icon-sm" variant="ghost" aria-label={`${t('action.delete')} ${ar ? h.name_ar : h.name_en}`}
                  onClick={() => void api(`/admin/holidays/${h.holiday_id}`, { method: 'DELETE' }).then(() => qc.invalidateQueries({ queryKey: ['holidays'] }), (e) => push({ variant: 'danger', title: errorText(e) }))}>
                  <Trash2 aria-hidden />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        {dialog ? (
          <DialogContent className="max-w-2xl" title={dialog.kind === 'branch' ? (dialog.item ? t('portal.edit') : t('portal.newBranch')) : dialog.kind === 'team' ? (dialog.item ? t('portal.edit') : t('portal.newTeam')) : t('portal.newHoliday')}>
            {dialog.kind === 'branch' ? <BranchForm initial={dialog.item as Branch | undefined} onDone={() => setDialog(null)} />
              : dialog.kind === 'team' ? <TeamForm initial={dialog.item as Team | undefined} branches={branches.data ?? []} onDone={() => setDialog(null)} />
              : <HolidayForm branches={branches.data ?? []} onDone={() => setDialog(null)} />}
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
