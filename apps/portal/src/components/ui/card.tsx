import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-line bg-surface shadow-sm', className)} {...props} />;
}

export function CardHeader({ title, description, actions, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="text-subtitle text-fg">{title}</h3>
        {description ? <p className="mt-0.5 text-body text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}

type Tone = 'brand' | 'late' | 'suspected' | 'neutral';
const ICON_TONE: Record<Tone, string> = {
  brand: 'bg-brand-subtle text-brand-fg',
  late: 'bg-status-late-bg text-status-late-fg',
  suspected: 'bg-status-suspected-fake-bg text-status-suspected-fake-fg',
  neutral: 'bg-sunken text-fg-muted',
};

export interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: Tone;
  /** Signed change vs a named period, with whether "up" is good for this metric. */
  delta?: { text: string; direction: 'up' | 'down' | 'flat'; upIsGood: boolean };
}

/**
 * Stat tile: sentence-case label, semibold value in proportional figures (tabular only in columns),
 * optional delta coloured by direction × whether up is good — always with an arrow, never colour alone.
 */
export function KpiTile({ label, value, sub, icon: Icon, tone = 'brand', delta }: KpiTileProps) {
  const good = delta && delta.direction !== 'flat' ? (delta.direction === 'up') === delta.upIsGood : null;
  const DeltaIcon = delta?.direction === 'down' ? ArrowDown : ArrowUp;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-label text-fg-muted">{label}</p>
        <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-md', ICON_TONE[tone])}>
          <Icon aria-hidden className="size-(--zona-size-icon-md)" />
        </span>
      </div>
      <div>
        <p className="text-kpi text-fg">{value}</p>
        {sub ? <p className="mt-0.5 text-caption text-fg-muted">{sub}</p> : null}
      </div>
      {delta ? (
        <p className={cn('inline-flex items-center gap-1 text-label-sm', good === null ? 'text-fg-muted' : good ? 'text-status-present-fg' : 'text-status-absent-fg')}>
          {delta.direction !== 'flat' ? <DeltaIcon aria-hidden className="size-3.5" /> : null}
          {delta.text}
        </p>
      ) : null}
    </Card>
  );
}
