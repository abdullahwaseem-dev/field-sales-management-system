import { Monitor, Moon, Sun } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/ui/logo';
import { Segmented } from '@/components/ui/segmented';
import { useT } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences';
import { ComponentsSection } from './components';
import { BrandSection, ColorSection, FoundationsSection, TypographySection } from './foundations';
import { MobileSection } from './mobile';

const NAV = [
  ['brand', 'ds.brand'],
  ['colour', 'ds.color'],
  ['typography', 'ds.typography'],
  ['foundations', 'ds.foundations'],
  ['components', 'ds.components'],
  ['mobile', 'ds.mobile'],
] as const;

export function DesignSystemPage() {
  const { t } = useT();
  const { prefs, setPrefs } = usePreferences();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand">
        {t('ds.skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <Logo kind="lockup" height={28} />
            <span aria-hidden className="h-6 w-px bg-line" />
            <span className="text-subtitle text-fg">{t('ds.title')}</span>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-3" role="group" aria-label={t('ds.preferences')}>
            <Segmented
              label={t('settings.theme')}
              value={prefs.theme}
              onChange={(theme) => setPrefs({ theme })}
              options={[
                { value: 'system', label: t('settings.themeSystem'), icon: Monitor },
                { value: 'light', label: t('settings.themeLight'), icon: Sun },
                { value: 'dark', label: t('settings.themeDark'), icon: Moon },
              ]}
            />
            <Segmented
              label={t('settings.language')}
              value={prefs.locale}
              onChange={(locale) => setPrefs({ locale })}
              options={[
                { value: 'en', label: 'English', lang: 'en' },
                { value: 'ar', label: 'العربية', lang: 'ar' },
              ]}
            />
            <Segmented
              label={t('settings.digits')}
              value={prefs.digits}
              onChange={(digits) => setPrefs({ digits })}
              options={[
                { value: 'latn', label: t('settings.digitsWestern') },
                { value: 'arab', label: t('settings.digitsArabic'), lang: 'ar' },
              ]}
            />
            <label className="flex items-center gap-2 text-label-sm text-fg-muted">
              <Checkbox checked={prefs.hijri} onCheckedChange={(v) => setPrefs({ hijri: v === true })} />
              {t('settings.hijri')}
            </label>
          </div>
        </div>
        <nav aria-label={t('ds.title')} className="mx-auto max-w-[90rem] overflow-x-auto px-4 sm:px-6 lg:px-10">
          <ul className="m-0 flex list-none gap-1 p-0 pb-2">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="inline-flex h-8 items-center whitespace-nowrap rounded-sm px-2.5 text-label-sm text-fg-muted hover:bg-sunken hover:text-fg">
                  {t(label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto flex max-w-[90rem] flex-col gap-16 px-4 pb-24 pt-10 sm:px-6 lg:px-10">
        <div>
          <h1 className="text-display text-fg">{t('ds.title')}</h1>
          <p className="mt-2 max-w-3xl text-body-lg text-fg-muted">{t('ds.subtitle')}</p>
        </div>
        <BrandSection />
        <ColorSection />
        <TypographySection />
        <FoundationsSection />
        <ComponentsSection />
        <MobileSection />
      </main>
    </>
  );
}
