import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader, todayInRiyadh, useErrorText } from '@/app/page';
import { ZonaMap } from '@/components/map/zona-map';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TextField } from '@/components/ui/field';
import { SelectField } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFormat, useLocaleSettings, useT } from '@/lib/i18n';
import { OrgSettings } from './OrgSettings';

interface Config { config_id: string; scope: 'global' | 'team'; team_en: string | null; team_ar: string | null; required_work_minutes: number; grace_minutes: number; ping_interval_seconds: number; outside_geofence_action: 'flag' | 'block'; effective_from: string; created_by_en: string | null; created_by_ar: string | null }
interface Geofence { geofence_id: string; name_en: string; name_ar: string; type: string; radius_m: number | null; status: string; geometry: any; assignments: { assignmentId: string; label: string; labelAr: string }[] }

function RuleForm({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const { push } = useToast();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => api<{ team_id: string; name_en: string; name_ar: string }[]>('/admin/teams') });
  const [v, setV] = useState({ scope: 'global', hours: '8', grace: '15', ping: '180', outside: 'flag', from: todayInRiyadh() });
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  const save = useMutation({
    mutationFn: () => api('/admin/attendance-config', { body: {
      scope: v.scope === 'global' ? 'global' : 'team', teamId: v.scope === 'global' ? undefined : v.scope,
      requiredWorkMinutes: Math.round(Number(v.hours) * 60), graceMinutes: Number(v.grace), pingIntervalSeconds: Number(v.ping), outsideGeofenceAction: v.outside, effectiveFrom: v.from,
    } }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['configs'] }); onDone(); },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <SelectField label={t('portal.scope')} placeholder={t('portal.scopeGlobal')} value={v.scope} onValueChange={set('scope')} options={[{ value: 'global', label: t('portal.scopeGlobal') }, ...(teams.data ?? []).map((x) => ({ value: x.team_id, label: ar ? x.name_ar : x.name_en }))]} />
      <TextField label={t('portal.effectiveFrom')} type="date" ltrValue value={v.from} onChange={(e) => set('from')(e.target.value)} />
      <TextField label={t('portal.requiredHours')} type="number" min={1} max={12} step={0.5} ltrValue value={v.hours} onChange={(e) => set('hours')(e.target.value)} />
      <TextField label={t('portal.grace')} type="number" min={0} max={240} ltrValue value={v.grace} onChange={(e) => set('grace')(e.target.value)} />
      <SelectField label={t('portal.pingInterval')} placeholder="" value={v.ping} onValueChange={set('ping')} options={[120, 180, 240, 300].map((s) => ({ value: String(s), label: t('portal.minutesValue', { count: s / 60 }) }))} />
      <SelectField label={t('portal.outsideAction')} placeholder="" value={v.outside} onValueChange={set('outside')} options={[{ value: 'flag', label: t('portal.outside.flag') }, { value: 'block', label: t('portal.outside.block') }]} />
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onDone}>{t('action.cancel')}</Button>
        <Button type="submit" loading={save.isPending}>{t('action.save')}</Button>
      </div>
    </form>
  );
}

function Geofences({ canEdit }: { canEdit: boolean }) {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const { push } = useToast();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['geofences'], queryFn: () => api<Geofence[]>('/admin/geofences') });
  const branches = useQuery({ queryKey: ['branches'], queryFn: () => api<{ branch_id: string; name_en: string; name_ar: string }[]>('/admin/branches') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => api<{ team_id: string; name_en: string; name_ar: string }[]>('/admin/teams') });
  const [draft, setDraft] = useState<{ lat: number; lng: number; radiusM: number } | null>(null);
  const [names, setNames] = useState({ en: '', ar: '' });
  const [assign, setAssign] = useState<Record<string, string>>({});
  const refresh = () => qc.invalidateQueries({ queryKey: ['geofences'] });
  const create = useMutation({
    mutationFn: () => api('/admin/geofences', { body: { type: 'circle', nameEn: names.en, nameAr: names.ar, center: [draft!.lng, draft!.lat], radiusM: draft!.radiusM } }),
    onSuccess: () => { setDraft(null); setNames({ en: '', ar: '' }); void refresh(); },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  const targets = [...(branches.data ?? []).map((b) => ({ value: `branch:${b.branch_id}`, label: `${t('portal.assignBranch')}: ${ar ? b.name_ar : b.name_en}` })), ...(teams.data ?? []).map((x) => ({ value: `team:${x.team_id}`, label: `${t('portal.assignTeam')}: ${ar ? x.name_ar : x.name_en}` }))];
  return (
    <Card>
      <CardHeader title={t('portal.geofences')} description={canEdit ? t('portal.geofenceHint') : undefined} />
      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_24rem]">
        <ZonaMap
          label={t('portal.geofences')}
          className="h-[28rem]"
          fit="geofences"
          draft={draft}
          onMapClick={canEdit ? (lat, lng) => setDraft({ lat, lng, radiusM: draft?.radiusM ?? 200 }) : undefined}
          geofences={(list.data ?? []).map((g) => ({ id: g.geofence_id, geometry: g.geometry, radiusM: g.radius_m, label: ar ? g.name_ar : g.name_en, muted: g.status !== 'active' }))}
        />
        <div className="flex flex-col gap-4">
          {draft ? (
            <form className="flex flex-col gap-3 rounded-lg border border-accent bg-accent-subtle/40 p-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <p className="text-label text-fg">{t('portal.newGeofence')}</p>
              <TextField label={t('portal.nameEn')} lang="en" value={names.en} onChange={(e) => setNames((n) => ({ ...n, en: e.target.value }))} />
              <TextField label={t('portal.nameAr')} lang="ar" dir="rtl" value={names.ar} onChange={(e) => setNames((n) => ({ ...n, ar: e.target.value }))} />
              <TextField label={`${t('portal.radius')} (${f.distance(draft.radiusM)})`} type="range" min={50} max={2000} step={25} value={draft.radiusM} onChange={(e) => setDraft({ ...draft, radiusM: Number(e.target.value) })} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)}>{t('action.cancel')}</Button>
                <Button type="submit" size="sm" loading={create.isPending} disabled={!names.en || !names.ar}>{t('action.save')}</Button>
              </div>
            </form>
          ) : null}
          <ul className="m-0 flex max-h-[28rem] list-none flex-col gap-3 overflow-auto p-0">
            {(list.data ?? []).map((g) => (
              <li key={g.geofence_id} className="rounded-lg border border-line p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-label text-fg">{ar ? g.name_ar : g.name_en}</span>
                  <span className="text-caption text-fg-muted">{g.radius_m ? f.distance(g.radius_m) : '⬠'}</span>
                </div>
                <p className="mt-1 text-caption text-fg-muted">{t('portal.assignedTo')}:</p>
                <ul className="m-0 mt-1 flex list-none flex-wrap gap-1.5 p-0">
                  {g.assignments.length === 0 ? <li className="text-caption text-fg-muted">{t('portal.unassigned')}</li> : null}
                  {g.assignments.map((a) => (
                    <li key={a.assignmentId} className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-label-sm text-brand-fg">
                      {ar ? a.labelAr : a.label}
                      {canEdit ? (
                        <button type="button" aria-label={`${t('portal.endAssignment')} ${ar ? a.labelAr : a.label}`} className="-me-1 inline-flex size-5 items-center justify-center rounded-full hover:bg-brand/20"
                          onClick={() => api(`/admin/geofence-assignments/${a.assignmentId}/end`, { method: 'POST' }).then(refresh)}>
                          <Trash2 aria-hidden className="size-3" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {canEdit ? (
                  <div className="mt-2 flex items-end gap-2">
                    <div className="flex-1">
                      <SelectField label={t('portal.assign')} placeholder={t('portal.assign')} value={assign[g.geofence_id]} onValueChange={(v) => setAssign((s) => ({ ...s, [g.geofence_id]: v }))} options={targets} />
                    </div>
                    <Button size="sm" variant="secondary" disabled={!assign[g.geofence_id]} onClick={() => {
                      const [kind, id] = assign[g.geofence_id]!.split(':');
                      void api(`/admin/geofences/${g.geofence_id}/assignments`, { body: kind === 'branch' ? { branchId: id } : { teamId: id } }).then(refresh, (e) => push({ variant: 'danger', title: errorText(e) }));
                    }}>{t('portal.assign')}</Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export function SettingsPage() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const { user } = useAuth();
  const [newRule, setNewRule] = useState(false);
  const configs = useQuery({ queryKey: ['configs'], queryFn: () => api<Config[]>('/admin/attendance-config') });
  const admin = user?.role === 'super_admin' || user?.role === 'hr_admin';
  return (
    <>
      <PageHeader title={t('nav.settings')} />
      <h2 className="mb-3 text-title text-fg">{t('portal.org')}</h2>
      <OrgSettings canEdit={admin} />
      <Card className="mb-6">
        <CardHeader title={t('portal.attendanceRules')} description={t('portal.rulesBody')} actions={user?.role === 'super_admin' ? <Button size="sm" onClick={() => setNewRule(true)}><Plus aria-hidden />{t('portal.newRule')}</Button> : undefined} />
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead>
              <tr className="bg-sunken text-start text-label-sm text-fg-muted">
                {[t('portal.effectiveFrom'), t('portal.scope'), t('portal.requiredHours'), t('portal.grace'), t('portal.pingInterval'), t('portal.outsideAction')].map((h) => <th key={h} className="h-10 px-4 text-start font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(configs.data ?? []).map((c) => (
                <tr key={c.config_id} className="border-t border-line">
                  <td className="h-12 px-4 tabular-nums">{f.day(c.effective_from)}</td>
                  <td className="px-4">{c.scope === 'global' ? t('portal.scopeGlobal') : (ar ? c.team_ar : c.team_en)}</td>
                  <td className="px-4 tabular-nums">{f.duration(c.required_work_minutes)}</td>
                  <td className="px-4">{t('portal.minutesValue', { count: c.grace_minutes })}</td>
                  <td className="px-4">{t('portal.minutesValue', { count: c.ping_interval_seconds / 60 })}</td>
                  <td className="px-4">{t(c.outside_geofence_action === 'block' ? 'portal.outside.block' : 'portal.outside.flag')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Geofences canEdit={admin} />
      <Dialog open={newRule} onOpenChange={setNewRule}>
        {newRule ? <DialogContent title={t('portal.newRule')} className="max-w-2xl"><RuleForm onDone={() => setNewRule(false)} /></DialogContent> : null}
      </Dialog>
    </>
  );
}
