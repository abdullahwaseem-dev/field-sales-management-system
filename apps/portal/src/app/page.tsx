import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-headline text-fg">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-body text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Localized message for an API error code, falling back to the generic error text. */
export function useErrorText() {
  const { t, has } = useT();
  return (e: unknown) => {
    const code = e instanceof ApiError ? e.code : '';
    for (const key of [`portal.error.${code}`, `error.${code}`]) if (has(key)) return t(key);
    return t('state.errorBody');
  };
}

export const todayInRiyadh = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
