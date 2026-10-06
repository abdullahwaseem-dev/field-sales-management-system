import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { usePortalContainer } from '@/lib/frame';
import { useT } from '@/lib/i18n';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const panelClass = 'w-full max-w-lg rounded-xl border border-line bg-overlay text-fg shadow-lg';

interface DialogLayoutProps {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

function DialogLayout({ title, description, children, footer, live }: DialogLayoutProps & { live: boolean }) {
  const { t } = useT();
  const Title = live ? DialogPrimitive.Title : 'h2';
  const Description = live ? DialogPrimitive.Description : 'p';
  const Close = live ? DialogPrimitive.Close : 'button';
  return (
    <>
      <div className="flex items-start gap-4 px-6 pb-2 pt-5">
        <div className="min-w-0 flex-1">
          <Title className="text-title text-fg">{title}</Title>
          {description ? <Description className="mt-1 text-body text-fg-muted">{description}</Description> : null}
        </div>
        <Close
          type="button"
          aria-label={t('action.close')}
          className="-me-2 inline-flex size-10 items-center justify-center rounded-md text-fg-muted hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
        >
          <X aria-hidden className="size-(--zona-size-icon-md)" />
        </Close>
      </div>
      {children ? <div className="px-6 py-3">{children}</div> : null}
      {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</div> : null}
    </>
  );
}

/** Modal dialog: scrim + centred panel, focus-trapped, Esc closes, motion respects reduce-motion. */
export function DialogContent(props: DialogLayoutProps & { className?: string }) {
  const container = usePortalContainer();
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay className="zona-fade fixed inset-0 z-50 bg-scrim" />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPrimitive.Content className={cn(panelClass, 'zona-pop pointer-events-auto', props.className)}>
          <DialogLayout {...props} live />
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}

/** The same panel rendered in place (design-system specimens, screenshots). */
export function DialogPanel(props: DialogLayoutProps & { className?: string }) {
  return (
    <div role="dialog" aria-modal="false" className={cn(panelClass, props.className)}>
      <DialogLayout {...props} live={false} />
    </div>
  );
}
