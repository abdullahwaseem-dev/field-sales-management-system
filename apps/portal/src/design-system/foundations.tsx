import { contrast, core, dark, light, primitives } from '@sfms/tokens';
import { Info } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ATTENDANCE_STATUSES, StatusChip } from '@/components/ui/status-chip';
import { cn } from '@/lib/cn';
import { Frame } from '@/lib/frame';
import { Ltr, useFormat, useT } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences';
import { ComboGrid, Section, Specimen } from './combo';

/** Token names and hex values are code identifiers: always shown LTR, in tabular figures. */
function Code({ children, className }: { children: string; className?: string }) {
  return (
    <bdi dir="ltr" className={cn('font-mono text-caption tabular-nums text-fg-muted', className)}>
      {children}
    </bdi>
  );
}

export function BrandSection() {
  const { t } = useT();
  return (
    <Section id="brand" title={t('ds.brand')}>
      <div className="flex items-start gap-3 rounded-md border border-status-info-border bg-status-info-bg px-4 py-3 text-status-info-fg">
        <Info aria-hidden className="mt-0.5 size-(--zona-size-icon-md) shrink-0" />
        <p className="text-body">{t('ds.interimLogo')}</p>
      </div>
      <ComboGrid>
        {(c) => (
          <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
            <Logo kind="lockup" height={40} />
            <Logo kind={c.locale === 'ar' ? 'wordmark-ar' : 'wordmark'} height={44} />
            <Logo kind="mark" height={40} />
          </div>
        )}
      </ComboGrid>
    </Section>
  );
}

function Swatch({ hex, label, sub, ring }: { hex: string; label: string; sub?: string; ring?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={cn('h-12 rounded-md', ring && 'ring-1 ring-line ring-inset')} style={{ backgroundColor: hex }} />
      <Code className="text-fg">{label}</Code>
      {sub ? <Code>{sub}</Code> : null}
    </div>
  );
}

const ROLE_CHECKS: [role: string, against: string][] = [
  ['fg', 'surface'], ['fg-muted', 'surface'], ['brand-fg', 'surface'], ['accent-fg', 'surface'],
  ['line-strong', 'surface'], ['focus', 'surface'], ['accent', 'surface'], ['on-brand', 'brand'], ['on-accent', 'accent-strong'],
];
const ROLE_LIST = ['canvas', 'surface', 'raised', 'overlay', 'sunken', 'line', 'line-strong', 'fg', 'fg-muted', 'fg-disabled', 'brand', 'brand-hover', 'on-brand', 'brand-fg', 'brand-subtle', 'accent', 'accent-strong', 'on-accent', 'accent-fg', 'accent-subtle', 'focus'] as const;

function RoleList({ theme }: { theme: 'light' | 'dark' }) {
  const colors = (theme === 'light' ? light : dark).color as unknown as Record<string, string>;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-4">
      {ROLE_LIST.map((role) => {
        const check = ROLE_CHECKS.find(([r]) => r === role);
        const res = check && contrast.find((x) => x.theme === theme && x.fg === check[0] && x.bg === check[1]);
        return <Swatch key={role} hex={colors[role] ?? ''} label={role} sub={`${colors[role]}${res ? ` · ${res.ratio}:1` : ''}`} ring />;
      })}
    </div>
  );
}

export function ColorSection() {
  const { t } = useT();
  const { prefs } = usePreferences();
  const passed = contrast.filter((c) => c.pass).length;
  const tightest = (theme: string) => [...contrast].filter((c) => c.theme === theme).sort((a, b) => a.ratio / a.min - b.ratio / b.min)[0];
  const scales = { navy: primitives.navy, orange: primitives.orange, gray: primitives.gray } as Record<string, Record<string, string>>;
  return (
    <Section id="colour" title={t('ds.color')} description={t('ds.contrast', { count: passed })}>
      <Specimen id="scales" title={t('ds.scales')}>
        <div className="flex flex-col gap-5">
          {Object.entries(scales).map(([name, scale]) => (
            <div key={name}>
              <Code className="text-label-sm text-fg">{name}</Code>
              <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
                {Object.entries(scale).map(([step, hex]) => (
                  <Swatch key={step} hex={hex} label={step} sub={hex} ring={step === '50'} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen id="roles" title={t('ds.roles')}>
        <div className="grid gap-5 xl:grid-cols-2">
          {(['light', 'dark'] as const).map((theme) => {
            const tt = tightest(theme);
            return (
              <Frame key={theme} theme={theme} locale={prefs.locale} digits={prefs.digits} className="rounded-lg border border-line p-5">
                <p className="mb-4 text-label text-fg">{t(theme === 'light' ? 'settings.themeLight' : 'settings.themeDark')}</p>
                <RoleList theme={theme} />
                {tt ? <p className="mt-4 text-caption text-fg-muted">{t('ds.tightest', { pair: `${tt.fg} / ${tt.bg} = ${tt.ratio}:1 (≥ ${tt.min})` })}</p> : null}
              </Frame>
            );
          })}
        </div>
      </Specimen>

      <Specimen id="status-tokens" title={t('ds.statusTokens')}>
        <div className="grid gap-5 xl:grid-cols-2">
          {(['light', 'dark'] as const).map((theme) => {
            const status = (theme === 'light' ? light : dark).color.status as unknown as Record<string, Record<string, string>>;
            return (
              <Frame key={theme} theme={theme} locale={prefs.locale} digits={prefs.digits} className="rounded-lg border border-line p-5">
                <div className="flex flex-col gap-3">
                  {ATTENDANCE_STATUSES.map((s) => (
                    <div key={s} className="flex items-center gap-4">
                      <span className="w-44 shrink-0"><StatusChip status={s} /></span>
                      <div className="flex gap-2">
                        {(['fg', 'bg', 'border', 'solid'] as const).map((part) => (
                          <span key={part} title={`${part} ${status[s]?.[part]}`} className="size-7 rounded-sm ring-1 ring-line ring-inset" style={{ backgroundColor: status[s]?.[part] }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Frame>
            );
          })}
        </div>
      </Specimen>

      <Specimen id="chart" title={t('ds.chart')} description={t('ds.chartNote')}>
        <div className="grid gap-5 xl:grid-cols-2">
          {(['light', 'dark'] as const).map((theme) => {
            const chart = (theme === 'light' ? light : dark).color.chart as unknown as Record<string, string>;
            return (
              <Frame key={theme} theme={theme} locale={prefs.locale} className="rounded-lg border border-line bg-surface p-5">
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((k) => <Swatch key={k} hex={chart[k] ?? ''} label={k} sub={chart[k]} />)}
                </div>
              </Frame>
            );
          })}
        </div>
      </Specimen>
    </Section>
  );
}

const TYPE_ROLES = ['display', 'headline', 'title-lg', 'title', 'subtitle', 'body-lg', 'body', 'label', 'caption'] as const;
const TYPE_CLASS: Record<(typeof TYPE_ROLES)[number], string> = {
  display: 'text-display', headline: 'text-headline', 'title-lg': 'text-title-lg', title: 'text-title', subtitle: 'text-subtitle',
  'body-lg': 'text-body-lg', body: 'text-body', label: 'text-label', caption: 'text-caption',
};

function TypeSpecimen() {
  const { t } = useT();
  const sample: Record<(typeof TYPE_ROLES)[number], string> = {
    display: t('ds.title'), headline: t('nav.attendance'), 'title-lg': t('review.title'), title: t('ds.c.dashboardTitle'),
    subtitle: t('hero.locationOn'), 'body-lg': t('hero.locationOnHint'), body: t('ds.sample.paragraph'), label: t('hero.checkIn'), caption: t('field.phoneHint'),
  };
  return (
    <div className="flex flex-col gap-4">
      {TYPE_ROLES.map((r) => (
        <div key={r} className="grid gap-1 sm:grid-cols-[6.5rem_1fr] sm:items-baseline sm:gap-4">
          <Code>{r}</Code>
          <p className={cn(TYPE_CLASS[r], 'text-fg')}>{sample[r]}</p>
        </div>
      ))}
    </div>
  );
}

function LocaleSpecimen() {
  const { t, tx } = useT();
  const f = useFormat();
  const day = new Date(2026, 9, 5, 9, 4);
  return (
    <div className="flex flex-col gap-5 border-t border-line pt-5">
      <div>
        <p className="mb-2 text-label text-fg">{t('ds.numerals')}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-body">
          <dt className="text-fg-muted">{t('ds.sample.dateGregorian')}</dt><dd className="m-0 text-fg">{f.date(day)}</dd>
          <dt className="text-fg-muted">{t('ds.sample.dateHijri')}</dt><dd className="m-0 text-fg">{f.hijri(day)}</dd>
          <dt className="text-fg-muted">{t('table.checkIn')}</dt><dd className="m-0 text-fg tabular-nums">{f.time(day)}</dd>
          <dt className="text-fg-muted">{t('table.worked')}</dt><dd className="m-0 text-fg tabular-nums">{f.duration(487)}</dd>
          <dt className="text-fg-muted">{t('settings.digits')}</dt><dd className="m-0 text-fg tabular-nums">{f.number(1234567.5)}</dd>
        </dl>
      </div>
      <div>
        <p className="mb-2 text-label text-fg">{t('ds.plurals')}</p>
        <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-1 p-0 text-body text-fg sm:grid-cols-3">
          {[0, 1, 2, 3, 11, 100].map((n) => <li key={n}>{t('ds.sample.plural', { count: n })}</li>)}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-label text-fg">{t('ds.bidi')}</p>
        <p className="text-body text-fg">
          {tx('ds.sample.bidi', { id: <Ltr>ZN-10427</Ltr>, email: <Ltr>faisal.alharbi@zona.example</Ltr>, phone: <Ltr>+966 55 123 4567</Ltr> })}
        </p>
      </div>
    </div>
  );
}

export function TypographySection() {
  const { t } = useT();
  return (
    <Section id="typography" title={t('ds.typography')}>
      <ComboGrid>
        {() => (
          <div className="flex flex-col gap-5">
            <TypeSpecimen />
            <LocaleSpecimen />
          </div>
        )}
      </ComboGrid>
    </Section>
  );
}

export function FoundationsSection() {
  const { t } = useT();
  const { prefs } = usePreferences();
  const space = core.space as unknown as Record<string, string>;
  const radius = core.radius as unknown as Record<string, string>;
  const motion = core.motion as unknown as { duration: Record<string, string>; easing: Record<string, number[]> };
  return (
    <Section id="foundations" title={t('ds.foundations')}>
      <div className="grid gap-8 xl:grid-cols-2">
        <Specimen id="spacing" title={t('ds.spacing')}>
          <div className="flex flex-col gap-2">
            {Object.entries(space).filter(([k]) => !k.includes('_')).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1])).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <Code className="w-20 shrink-0">{`${k} · ${v}`}</Code>
                <span className="h-3 rounded-xs bg-brand" style={{ width: v }} />
              </div>
            ))}
          </div>
        </Specimen>
        <Specimen id="radius" title={t('ds.radius')}>
          <div className="flex flex-wrap gap-4">
            {Object.entries(radius).filter(([k]) => k !== 'none').map(([k, v]) => (
              <div key={k} className="flex flex-col items-center gap-1.5">
                <span className="size-16 border-2 border-brand bg-brand-subtle" style={{ borderRadius: v }} />
                <Code>{k}</Code>
              </div>
            ))}
          </div>
        </Specimen>
        <Specimen id="elevation" title={t('ds.elevation')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['light', 'dark'] as const).map((theme) => (
              <Frame key={theme} theme={theme} locale={prefs.locale} className="flex gap-4 rounded-lg border border-line p-5">
                {(['shadow-sm', 'shadow-md', 'shadow-lg'] as const).map((s, i) => (
                  <div key={s} className={cn('flex h-20 flex-1 items-end rounded-md p-2', i === 0 ? 'bg-surface' : 'bg-raised', s)}>
                    <Code>{s.replace('shadow-', '')}</Code>
                  </div>
                ))}
              </Frame>
            ))}
          </div>
        </Specimen>
        <Specimen id="motion" title={t('ds.motion')} description={t('ds.motionNote')}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            {Object.entries(motion.duration).map(([k, v]) => (
              <div key={k} className="contents"><dt><Code className="text-fg">{k}</Code></dt><dd className="m-0"><Code>{v}</Code></dd></div>
            ))}
            {Object.entries(motion.easing).map(([k, v]) => (
              <div key={k} className="contents"><dt><Code className="text-fg">{k}</Code></dt><dd className="m-0"><Code>{`cubic-bezier(${v.join(', ')})`}</Code></dd></div>
            ))}
          </dl>
        </Specimen>
      </div>
    </Section>
  );
}
