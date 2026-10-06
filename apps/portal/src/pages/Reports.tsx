import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { PageHeader, todayInRiyadh } from '@/app/page';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { api } from '@/lib/api';
import { type MessageId, useFormat, useLocaleSettings, useT } from '@/lib/i18n';

interface Row { label: string; shares: number }

/** Ranked bar list: one series, direct value labels, no legend (single hue). */
function BarList({ title, rows }: { title: string; rows: Row[] }) {
  const { t } = useT();
  const f = useFormat();
  const max = Math.max(1, ...rows.map((r) => r.shares));
  return (
    <Card>
      <CardHeader title={title} />
      <div className="p-5">
        {rows.length === 0 ? <p className="text-body text-fg-muted">{t('portal.noData')}</p> : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {rows.map((r) => (
              <li key={r.label}>
                <div className="mb-1 flex justify-between gap-3 text-body"><span className="truncate text-fg">{r.label}</span><span className="tabular-nums text-fg-muted">{f.number(r.shares)}</span></div>
                <div className="h-2 rounded-full bg-sunken"><div className="h-2 rounded-full bg-chart-1" style={{ width: `${(r.shares / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export function ReportsPage() {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const today = todayInRiyadh();
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const q = useQuery({ queryKey: ['shares', from, to], queryFn: () => api<any>(`/admin/reports/shares?from=${from}&to=${to}`) });
  const input = 'h-10 rounded-md border border-line-strong bg-surface px-3 text-body text-fg focus-visible:outline-2 focus-visible:outline-focus';
  return (
    <>
      <PageHeader title={t('nav.reports')} description={t('portal.sharesReport')} actions={
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-label-sm text-fg-muted">{t('portal.from')}<input type="date" className={input} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-label-sm text-fg-muted">{t('portal.to')}<input type="date" className={input} value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      } />
      <div className="grid gap-6 xl:grid-cols-3">
        <BarList title={t('portal.byProduct')} rows={(q.data?.byProduct ?? []).map((r: any) => ({ label: ar ? r.name_ar : r.name_en, shares: Number(r.shares) }))} />
        <BarList title={t('portal.byEmployee')} rows={(q.data?.byEmployee ?? []).map((r: any) => ({ label: ar ? r.full_name_ar : r.full_name_en, shares: Number(r.shares) }))} />
        <BarList title={t('portal.byChannel')} rows={(q.data?.byChannel ?? []).map((r: any) => ({ label: t(`portal.channel.${r.channel}` as MessageId), shares: Number(r.shares) }))} />
      </div>
      <Card className="mt-6">
        <EmptyState icon={CalendarClock} title={t('portal.monthlySummary')} body={t('portal.comingPhase5')} />
      </Card>
    </>
  );
}
