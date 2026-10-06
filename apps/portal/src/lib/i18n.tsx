import ar from '@sfms/i18n/ar.json';
import en from '@sfms/i18n/en.json';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import type { Digits, Locale } from './preferences';

export type MessageId = keyof typeof en;
const catalogues: Record<Locale, Record<MessageId, string>> = { en, ar };

/**
 * BCP 47 tag for Intl. Arabic uses ar-SA, whose CLDR defaults are the Hijri calendar and
 * Arabic-Indic digits — both are overridden explicitly so the defaults are Gregorian + 0-9, with
 * Arabic-Indic digits and Umm al-Qura Hijri as opt-in settings.
 */
export function localeTag(locale: Locale, digits: Digits, calendar: 'gregory' | 'islamic-umalqura' = 'gregory') {
  const base = locale === 'ar' ? 'ar-SA' : 'en-GB';
  const nu = locale === 'ar' && digits === 'arab' ? 'arab' : 'latn';
  return `${base}-u-ca-${calendar}-nu-${nu}`;
}

interface LocaleSettings {
  locale: Locale;
  digits: Digits;
  hijri: boolean;
  dir: 'ltr' | 'rtl';
}
const LocaleSettingsContext = createContext<LocaleSettings>({ locale: 'en', digits: 'latn', hijri: false, dir: 'ltr' });

export function LocaleProvider({ locale, digits, hijri, children }: Omit<LocaleSettings, 'dir'> & { children: ReactNode }) {
  const settings = useMemo<LocaleSettings>(() => ({ locale, digits, hijri, dir: locale === 'ar' ? 'rtl' : 'ltr' }), [locale, digits, hijri]);
  return (
    <LocaleSettingsContext.Provider value={settings}>
      <IntlProvider locale={localeTag(locale, digits)} messages={catalogues[locale]} defaultLocale="en-GB">
        {children}
      </IntlProvider>
    </LocaleSettingsContext.Provider>
  );
}

export const useLocaleSettings = () => useContext(LocaleSettingsContext);

type Values = Record<string, string | number>;
type RichValues = Record<string, ReactNode>;

/** Typed translation helpers: `t` for plain strings, `tx` when a value is a React node (e.g. <Ltr>). */
export function useT() {
  const intl = useIntl();
  const t = useCallback((id: MessageId, values?: Values) => intl.formatMessage({ id }, values), [intl]);
  const tx = useCallback((id: MessageId, values: RichValues) => intl.formatMessage({ id }, values) as ReactNode, [intl]);
  /** Whether a (dynamic) key exists — avoids missing-message errors for computed keys. */
  const has = useCallback((id: string): id is MessageId => Object.prototype.hasOwnProperty.call(intl.messages, id), [intl]);
  return { t, tx, has };
}

/** Locale-aware formatting — never build dates, times or numbers by hand. */
export function useFormat() {
  const { locale, digits } = useLocaleSettings();
  const { t } = useT();
  return useMemo(() => {
    const tag = localeTag(locale, digits);
    const hijriTag = localeTag(locale, digits, 'islamic-umalqura');
    const num = new Intl.NumberFormat(tag);
    const time = new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' });
    const date = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' });
    const dateShort = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' });
    const hijri = new Intl.DateTimeFormat(hijriTag, { day: 'numeric', month: 'long', year: 'numeric' });
    // Attendance times are shown in the branch time zone (KSA), whatever the viewer's own zone.
    const SITE_TZ = 'Asia/Riyadh';
    const siteTime = new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit', hourCycle: 'h12', timeZone: SITE_TZ });
    const siteDate = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', timeZone: SITE_TZ });
    const siteDateTime = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hourCycle: 'h12', timeZone: SITE_TZ });
    const plainDate = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const weekday = new Intl.DateTimeFormat(tag, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const metres = new Intl.NumberFormat(tag, { style: 'unit', unit: 'meter', unitDisplay: 'short', maximumFractionDigits: 0 });
    const km = new Intl.NumberFormat(tag, { style: 'unit', unit: 'kilometer', unitDisplay: 'short', maximumFractionDigits: 1 });
    const signed = new Intl.NumberFormat(tag, { signDisplay: 'exceptZero' });
    return {
      tag,
      number: (n: number) => num.format(n),
      signed: (n: number) => signed.format(n),
      time: (d: Date) => time.format(d),
      date: (d: Date) => date.format(d),
      dateShort: (d: Date) => dateShort.format(d),
      dateRange: (a: Date, b: Date) => dateShort.formatRange(a, b),
      hijri: (d: Date) => hijri.format(d),
      siteTime: (d: Date | string) => siteTime.format(new Date(d)),
      siteDate: (d: Date | string) => siteDate.format(new Date(d)),
      siteDateTime: (d: Date | string) => siteDateTime.format(new Date(d)),
      /** A calendar date ('YYYY-MM-DD'), never shifted by any time zone. */
      day: (iso: string) => plainDate.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)),
      weekday: (iso: string) => weekday.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)),
      distance: (m: number) => (m < 1000 ? metres.format(m) : km.format(m / 1000)),
      duration: (totalMinutes: number) => {
        const hours = num.format(Math.floor(totalMinutes / 60));
        const minutes = Math.round(totalMinutes % 60);
        return minutes === 0 ? t('duration.h', { hours }) : t('duration.hm', { hours, minutes: num.format(minutes) });
      },
    };
  }, [locale, digits, t]);
}

/**
 * Isolates a left-to-right run (employee IDs, emails, phone numbers, English product names) so its
 * punctuation and ordering never break inside Arabic sentences.
 */
export function Ltr({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}
