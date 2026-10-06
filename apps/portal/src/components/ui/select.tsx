import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { usePortalContainer } from '@/lib/frame';
import { controlClass, FieldShell } from './field';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SelectField({ label, placeholder, options, hint, error, required, ...props }: SelectFieldProps) {
  const id = useId();
  const container = usePortalContainer();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <SelectPrimitive.Root {...props}>
        <SelectPrimitive.Trigger
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(controlClass, 'group flex h-10 items-center justify-between gap-2 px-3 text-start pointer-coarse:h-12 data-placeholder:text-fg-muted')}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown aria-hidden className="size-(--zona-size-icon-md) text-fg-muted transition-transform duration-(--zona-motion-duration-fast) group-data-[state=open]:rotate-180" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal container={container}>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="zona-pop z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-line bg-overlay text-fg shadow-lg"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className="relative flex h-10 cursor-default select-none items-center rounded-sm pe-9 ps-3 text-body outline-none data-highlighted:bg-brand-subtle data-highlighted:text-fg data-disabled:text-fg-disabled"
                >
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute end-3 inline-flex">
                    <Check aria-hidden className="size-(--zona-size-icon-sm) text-brand-fg" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FieldShell>
  );
}
