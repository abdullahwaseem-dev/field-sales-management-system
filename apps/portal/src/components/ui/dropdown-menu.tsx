import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { usePortalContainer } from '@/lib/frame';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

export function DropdownMenuContent({ className, children, align = 'end', ...props }: ComponentPropsWithoutRef<typeof Menu.Content>) {
  const container = usePortalContainer();
  return (
    <Menu.Portal container={container}>
      <Menu.Content
        align={align}
        sideOffset={6}
        className={cn('zona-pop z-50 min-w-48 overflow-hidden rounded-md border border-line bg-overlay p-1 text-fg shadow-lg', className)}
        {...props}
      >
        {children}
      </Menu.Content>
    </Menu.Portal>
  );
}

const itemClass = 'relative flex h-9 cursor-default select-none items-center gap-2.5 rounded-sm px-2.5 text-body outline-none data-highlighted:bg-brand-subtle data-disabled:text-fg-disabled [&_svg]:size-(--zona-size-icon-sm) [&_svg]:text-fg-muted';

export function DropdownMenuItem({ className, tone, ...props }: ComponentPropsWithoutRef<typeof Menu.Item> & { tone?: 'danger' }) {
  return <Menu.Item className={cn(itemClass, tone === 'danger' && 'text-status-absent-fg [&_svg]:text-status-absent-fg', className)} {...props} />;
}

export function DropdownMenuCheckboxItem({ children, ...props }: ComponentPropsWithoutRef<typeof Menu.CheckboxItem> & { children: ReactNode }) {
  return (
    <Menu.CheckboxItem className={cn(itemClass, 'pe-8')} onSelect={(e) => e.preventDefault()} {...props}>
      {children}
      <Menu.ItemIndicator className="absolute end-2.5 inline-flex">
        <Check aria-hidden className="text-brand-fg!" />
      </Menu.ItemIndicator>
    </Menu.CheckboxItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithoutRef<typeof Menu.Label>) {
  return <Menu.Label className={cn('px-2.5 py-1.5 text-label-sm text-fg-muted', className)} {...props} />;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="-mx-1 my-1 h-px bg-line" />;
}
