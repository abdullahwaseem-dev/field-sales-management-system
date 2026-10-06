import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
    'transition-[background-color,color,border-color,box-shadow] duration-(--zona-motion-duration-fast) ease-standard',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    'disabled:pointer-events-none disabled:border-line disabled:bg-sunken disabled:text-fg-disabled disabled:shadow-none',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand shadow-sm hover:bg-brand-hover',
        accent: 'bg-accent-strong text-on-accent shadow-sm hover:bg-accent-hover',
        secondary: 'border border-line-strong bg-surface text-fg hover:bg-sunken',
        ghost: 'text-fg hover:bg-sunken',
        danger: 'bg-status-absent-solid text-on-solid shadow-sm hover:bg-status-absent-fg',
        link: 'h-auto px-0 text-brand-fg underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-label-sm [&_svg]:size-(--zona-size-icon-sm)',
        md: 'h-10 px-4 text-label [&_svg]:size-(--zona-size-icon-md) pointer-coarse:h-11',
        lg: 'h-12 px-5 text-subtitle [&_svg]:size-(--zona-size-icon-md)',
        icon: 'size-10 [&_svg]:size-(--zona-size-icon-md) pointer-coarse:size-11',
        'icon-sm': 'size-8 [&_svg]:size-(--zona-size-icon-sm)',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
