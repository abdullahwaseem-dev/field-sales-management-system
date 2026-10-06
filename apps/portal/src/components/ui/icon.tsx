import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Icons that point somewhere (chevrons, arrows, back, sidebar collapse) mirror in RTL.
 * Icons that depict real-world objects, time or media (clock, map pin, play) never mirror.
 */
export function DirIcon({ icon: Icon, className, ...props }: LucideProps & { icon: LucideIcon }) {
  return <Icon aria-hidden className={cn('rtl:-scale-x-100', className)} {...props} />;
}
