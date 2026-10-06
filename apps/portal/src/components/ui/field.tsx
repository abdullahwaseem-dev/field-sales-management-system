import { useDirection } from '@radix-ui/react-direction';
import { CircleAlert, type LucideIcon } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';

export const controlClass = [
  'w-full rounded-md border border-line-strong bg-surface text-body text-fg placeholder:text-fg-muted',
  'transition-[border-color,box-shadow] duration-(--zona-motion-duration-fast) ease-standard',
  'hover:border-fg-muted focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus',
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-fg-disabled',
  'aria-invalid:border-status-absent-border aria-invalid:focus-visible:outline-status-absent-solid',
].join(' ');

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}

export function FieldShell({ id, label, hint, error, required, optional, children }: FieldShellProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline gap-2 text-label text-fg">
        {label}
        {required ? <span className="text-caption text-fg-muted">({t('field.required')})</span> : null}
        {optional ? <span className="text-caption text-fg-muted">({t('field.optional')})</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-caption text-status-absent-fg">
          <CircleAlert aria-hidden className="mt-px size-(--zona-size-icon-sm) shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  icon?: LucideIcon;
  /**
   * The value is inherently left-to-right (email, phone, employee ID). The input keeps dir="ltr" so
   * "+966 …" and "name@domain" never reorder, while staying aligned with the surrounding layout.
   */
  ltrValue?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, optional, required, icon: Icon, ltrValue, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const layoutDir = useDirection();
    // An LTR value inside an RTL layout: its own inline-start is the physical left, so the icon slot
    // (which follows the *layout*) needs physical padding/alignment here. This is the one place that
    // reasons physically, and it is derived from the logical layout direction.
    const ltrInRtl = ltrValue && layoutDir === 'rtl';
    return (
      <FieldShell id={id} label={label} hint={hint} error={error} required={required} optional={optional}>
        <div className="relative">
          {Icon ? (
            <Icon aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-(--zona-size-icon-md) -translate-y-1/2 text-fg-muted" />
          ) : null}
          <input
            ref={ref}
            id={id}
            dir={ltrValue ? 'ltr' : undefined}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(
              controlClass,
              'h-10 px-3 pointer-coarse:h-12',
              Icon && (ltrInRtl ? 'pr-10 text-right' : 'ps-10'),
              !Icon && ltrInRtl && 'text-right',
              className,
            )}
            {...props}
          />
        </div>
      </FieldShell>
    );
  },
);
TextField.displayName = 'TextField';

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, hint, error, required, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    return (
      <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
        <textarea
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlClass, 'min-h-24 resize-y px-3 py-2', className)}
          {...props}
        />
      </FieldShell>
    );
  },
);
TextAreaField.displayName = 'TextAreaField';
