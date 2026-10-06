import { DirectionProvider } from '@radix-ui/react-direction';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { ToastRegion } from '@/components/ui/toast';
import { cn } from './cn';
import { LocaleProvider } from './i18n';
import type { Digits, Locale, Theme } from './preferences';

/** Where Radix portals (menus, selects, dialogs) mount, so they inherit the frame's theme, dir and lang. */
const PortalContainerContext = createContext<HTMLElement | null | undefined>(undefined);
export const usePortalContainer = () => useContext(PortalContainerContext) ?? undefined;

interface FrameProps {
  theme: Theme;
  locale: Locale;
  digits?: Digits;
  hijri?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Scopes theme (CSS-variable tokens), direction, language, Intl formatting, Radix direction,
 * portals and toasts to a subtree. The app root uses the same providers against <html>; the design
 * system page uses Frames to render every combination side by side.
 */
export function Frame({ theme, locale, digits = 'latn', hijri = false, className, children }: FrameProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <div className={cn(theme, 'relative bg-canvas font-sans text-body text-fg', className)} dir={dir} lang={locale}>
      <AppProviders locale={locale} digits={digits} hijri={hijri} portalContainer={container}>
        {children}
      </AppProviders>
      <div ref={setContainer} />
    </div>
  );
}

export function AppProviders({ locale, digits, hijri, portalContainer, children }: {
  locale: Locale; digits: Digits; hijri: boolean; portalContainer?: HTMLElement | null; children: ReactNode;
}) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <LocaleProvider locale={locale} digits={digits} hijri={hijri}>
      <DirectionProvider dir={dir}>
        <PortalContainerContext.Provider value={portalContainer}>
          <ToastRegion dir={dir} contained={portalContainer !== undefined}>
            {children}
          </ToastRegion>
        </PortalContainerContext.Provider>
      </DirectionProvider>
    </LocaleProvider>
  );
}
