import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** BCP 47 tag when the label is in another language (e.g. "العربية" inside the English UI). */
  lang?: string;
}

/** Single-choice segmented control (theme, language, digits). Arrow keys follow reading direction. */
export function Segmented<T extends string>({ label, value, onChange, options, className }: {
  label: string; value: T; onChange: (v: T) => void; options: SegmentOption<T>[]; className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className={cn('inline-flex self-start rounded-md border border-line bg-sunken p-0.5', className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          lang={o.lang}
          // A label in another script gets its own direction, e.g. "٠-٩" must read right-to-left even
          // inside the English UI (Arabic-Indic digits around a hyphen are reordered by the bidi algorithm).
          dir={o.lang ? (o.lang === 'ar' ? 'rtl' : 'ltr') : undefined}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-label-sm text-fg-muted pointer-coarse:h-11',
            'transition-[background-color,color,box-shadow] duration-(--zona-motion-duration-fast) ease-standard',
            'hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus',
            'data-[state=on]:bg-raised data-[state=on]:text-fg data-[state=on]:shadow-sm',
          )}
        >
          {o.icon ? <o.icon aria-hidden className="size-(--zona-size-icon-sm)" /> : null}
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
