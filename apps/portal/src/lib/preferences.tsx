import { light as lightTokens, dark as darkTokens } from '@sfms/tokens';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';
export type Locale = 'en' | 'ar';
export type Digits = 'latn' | 'arab';

export interface Preferences {
  theme: ThemePref;
  locale: Locale;
  /** Arabic-Indic digits apply to the Arabic UI only; English always uses 0-9. */
  digits: Digits;
  hijri: boolean;
}

/**
 * Must stay in sync with the inline pre-paint script in index.html, which applies the same
 * resolution before the first frame so there is never a flash of the wrong theme or direction.
 * Phase 2 adds the server copy (saved per user); localStorage is the pre-paint cache.
 */
export const PREFS_KEY = 'sfms.prefs';

const systemLocale = (): Locale =>
  (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';

function load(): Preferences {
  let stored: Partial<Preferences> = {};
  try {
    stored = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') ?? {};
  } catch {
    // Storage blocked (private mode) — fall back to system defaults.
  }
  return {
    theme: stored.theme === 'light' || stored.theme === 'dark' ? stored.theme : 'system',
    locale: stored.locale === 'en' || stored.locale === 'ar' ? stored.locale : systemLocale(),
    digits: stored.digits === 'arab' ? 'arab' : 'latn',
    hijri: stored.hijri === true,
  };
}

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
export const resolveTheme = (pref: ThemePref): Theme => (pref === 'system' ? (prefersDark() ? 'dark' : 'light') : pref);
export const dirOf = (locale: Locale) => (locale === 'ar' ? 'rtl' : 'ltr');

function applyToDocument(prefs: Preferences) {
  const el = document.documentElement;
  const theme = resolveTheme(prefs.theme);
  el.classList.toggle('dark', theme === 'dark');
  el.classList.toggle('light', theme === 'light');
  el.lang = prefs.locale;
  el.dir = dirOf(prefs.locale);
  el.style.backgroundColor = (theme === 'dark' ? darkTokens : lightTokens).color.canvas;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', (theme === 'dark' ? darkTokens : lightTokens).color.surface);
}

interface PreferencesContextValue {
  prefs: Preferences;
  theme: Theme;
  setPrefs: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setState] = useState(load);
  const [systemDark, setSystemDark] = useState(prefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => applyToDocument(prefs), [prefs, systemDark]);

  const setPrefs = useCallback((patch: Partial<Preferences>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // Non-persistent session; the choice still applies until reload.
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ prefs, setPrefs, theme: prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme }) as PreferencesContextValue,
    [prefs, setPrefs, systemDark],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
