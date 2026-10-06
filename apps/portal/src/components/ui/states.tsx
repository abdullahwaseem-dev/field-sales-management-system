import { CircleAlert, type LucideIcon, RefreshCw, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('zona-shimmer rounded-sm bg-skeleton', className)} />;
}

/** Placeholder rows shaped like the content they replace; announced once to screen readers. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  const { t } = useT();
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{t('state.loading')}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function StateFrame({ icon: Icon, iconClass, title, body, action }: { icon: LucideIcon; iconClass: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <span className={cn('mb-3 inline-flex size-12 items-center justify-center rounded-full', iconClass)}>
        <Icon aria-hidden className="size-(--zona-size-icon-lg)" />
      </span>
      <p className="text-subtitle text-fg">{title}</p>
      <p className="mt-1 max-w-sm text-body text-fg-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return <StateFrame icon={icon} iconClass="bg-brand-subtle text-brand-fg" title={title} body={body} action={action} />;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useT();
  return (
    <div role="alert">
      <StateFrame
        icon={CircleAlert}
        iconClass="bg-status-absent-bg text-status-absent-fg"
        title={t('state.errorTitle')}
        body={t('state.errorBody')}
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw aria-hidden />
            {t('action.retry')}
          </Button>
        }
      />
    </div>
  );
}

export function OfflineBanner({ since }: { since: string }) {
  const { t } = useT();
  return (
    <div role="status" className="flex items-start gap-3 rounded-md border border-status-late-border bg-status-late-bg px-4 py-3 text-status-late-fg">
      <WifiOff aria-hidden className="mt-0.5 size-(--zona-size-icon-md) shrink-0" />
      <div>
        <p className="text-label">{t('state.offlineTitle')}</p>
        <p className="text-body">{t('state.offlineBody', { time: since })}</p>
      </div>
    </div>
  );
}
