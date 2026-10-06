import { light } from '@sfms/tokens';
import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Flattens the semantic colour tree into the utility names Tailwind generates (e.g. "status-late-fg"). */
function names(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) => {
    const name = `${prefix}${k}`.replaceAll('_', '-');
    return typeof v === 'string' ? [name] : names(v as object, `${name}-`);
  });
}

// tailwind-merge must know our token scales, otherwise it treats e.g. `text-body` (size) and
// `text-fg` (colour) as conflicting and silently drops one of them.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: names(light.color),
      text: ['display', 'headline', 'title-lg', 'title', 'subtitle', 'body-lg', 'body', 'label', 'label-sm', 'caption', 'kpi', 'timer'],
      radius: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'],
      shadow: ['sm', 'md', 'lg'],
      ease: ['standard', 'decelerate', 'accelerate', 'emphasized'],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
