import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Frame } from '@/lib/frame';
import { type MessageId, useT } from '@/lib/i18n';
import { type Locale, type Theme, usePreferences } from '@/lib/preferences';

export interface Combo {
  key: 'en-light' | 'en-dark' | 'ar-light' | 'ar-dark';
  theme: Theme;
  locale: Locale;
  label: MessageId;
}

export const COMBOS: Combo[] = [
  { key: 'en-light', theme: 'light', locale: 'en', label: 'ds.combo.enLight' },
  { key: 'en-dark', theme: 'dark', locale: 'en', label: 'ds.combo.enDark' },
  { key: 'ar-light', theme: 'light', locale: 'ar', label: 'ds.combo.arLight' },
  { key: 'ar-dark', theme: 'dark', locale: 'ar', label: 'ds.combo.arDark' },
];

/** Renders a specimen once per combination (EN/AR × light/dark), each in its own scoped Frame. */
export function ComboGrid({ children, layout = 'grid', frameClassName }: {
  children: (combo: Combo) => ReactNode; layout?: 'grid' | 'stack'; frameClassName?: string;
}) {
  const { t } = useT();
  const { prefs } = usePreferences();
  return (
    <div className={cn('grid gap-5', layout === 'grid' && 'xl:grid-cols-2')}>
      {COMBOS.map((c) => (
        <figure key={c.key} className="m-0 min-w-0" data-combo={c.key}>
          <figcaption className="mb-2 text-label-sm text-fg-muted">{t(c.label)}</figcaption>
          <Frame theme={c.theme} locale={c.locale} digits={prefs.digits} hijri={prefs.hijri} className={cn('rounded-lg border border-line p-5', frameClassName)}>
            {children(c)}
          </Frame>
        </figure>
      ))}
    </div>
  );
}

export function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="text-headline text-fg">{title}</h2>
      {description ? <p className="mt-1 max-w-3xl text-body-lg text-fg-muted">{description}</p> : null}
      <div className="mt-6 flex flex-col gap-10">{children}</div>
    </section>
  );
}

export function Specimen({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <div data-shot={id}>
      <h3 className="text-title text-fg">{title}</h3>
      {description ? <p className="mt-1 max-w-3xl text-body text-fg-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}
