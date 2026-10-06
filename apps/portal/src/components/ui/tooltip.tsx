import { useDirection } from '@radix-ui/react-direction';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { usePortalContainer } from '@/lib/frame';

export const TooltipProvider = TooltipPrimitive.Provider;

/** Tooltip placed on the logical inline-end side (right in LTR, left in RTL). */
export function Tooltip({ content, children, side = 'inline-end' }: { content: ReactNode; children: ReactNode; side?: 'inline-end' | 'top' | 'bottom' }) {
  const dir = useDirection();
  const container = usePortalContainer();
  const physical = side === 'inline-end' ? (dir === 'rtl' ? 'left' : 'right') : side;
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal container={container}>
        <TooltipPrimitive.Content side={physical} sideOffset={8} className="zona-pop z-50 rounded-sm bg-fg px-2.5 py-1.5 text-label-sm text-canvas shadow-md">
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
