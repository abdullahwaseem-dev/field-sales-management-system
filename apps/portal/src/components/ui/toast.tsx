import * as ToastPrimitive from '@radix-ui/react-toast';
import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert, X } from 'lucide-react';
import { createContext, type ElementType, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';

export type ToastVariant = 'success' | 'info' | 'warning' | 'danger';

const VARIANT: Record<ToastVariant, { icon: LucideIcon; iconClass: string; edge: string }> = {
  success: { icon: CircleCheck, iconClass: 'text-status-present-fg', edge: 'before:bg-status-present-solid' },
  info: { icon: Info, iconClass: 'text-status-info-fg', edge: 'before:bg-status-info-solid' },
  warning: { icon: TriangleAlert, iconClass: 'text-status-late-fg', edge: 'before:bg-status-late-solid' },
  danger: { icon: CircleAlert, iconClass: 'text-status-absent-fg', edge: 'before:bg-status-absent-solid' },
};

interface ToastCardProps {
  variant: ToastVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  TitleAs?: ElementType;
  DescriptionAs?: ElementType;
  CloseAs?: ElementType;
}

/** Visual toast. Used live inside Radix Toast and statically on the design-system page. */
export function ToastCard({ variant, title, description, action, onDismiss, TitleAs = 'p', DescriptionAs = 'p', CloseAs = 'button' }: ToastCardProps) {
  const { t } = useT();
  const v = VARIANT[variant];
  return (
    <div
      className={cn(
        'relative flex w-full gap-3 overflow-hidden rounded-lg border border-line bg-overlay p-4 ps-5 text-fg shadow-lg',
        'before:absolute before:inset-y-0 before:start-0 before:w-1 before:content-[""]',
        v.edge,
      )}
    >
      <v.icon aria-hidden className={cn('mt-0.5 size-(--zona-size-icon-md) shrink-0', v.iconClass)} />
      <div className="min-w-0 flex-1">
        <TitleAs className="text-label text-fg">{title}</TitleAs>
        {description ? <DescriptionAs className="mt-0.5 text-body text-fg-muted">{description}</DescriptionAs> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
      <CloseAs
        type="button"
        aria-label={t('action.dismiss')}
        onClick={onDismiss}
        className="-m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
      >
        <X aria-hidden className="size-(--zona-size-icon-sm)" />
      </CloseAs>
    </div>
  );
}

interface ToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
}
const ToastContext = createContext<{ push: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a <ToastRegion>');
  return ctx;
}

/** Toast provider + viewport at the inline-end bottom corner; swipe-to-dismiss follows reading direction. */
export function ToastRegion({ dir, contained, children }: { dir: 'ltr' | 'rtl'; contained: boolean; children: ReactNode }) {
  const [toasts, setToasts] = useState<(ToastInput & { id: number })[]>([]);
  const push = useCallback((input: ToastInput) => setToasts((all) => [...all.slice(-2), { ...input, id: Date.now() + Math.random() }]), []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection={dir === 'rtl' ? 'left' : 'right'} duration={6000}>
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            type={toast.variant === 'danger' ? 'foreground' : 'background'}
            onOpenChange={(open) => !open && setToasts((all) => all.filter((x) => x.id !== toast.id))}
            className="zona-toast"
          >
            <ToastCard
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              TitleAs={ToastPrimitive.Title}
              DescriptionAs={ToastPrimitive.Description}
              CloseAs={ToastPrimitive.Close}
            />
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport
          className={cn('bottom-0 end-0 z-50 m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 outline-none', contained ? 'absolute' : 'fixed')}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
