import lockupReverse from '@sfms/brand/interim/zona-lockup-reverse.png';
import lockup from '@sfms/brand/interim/zona-lockup.png';
import markReverse from '@sfms/brand/interim/zona-mark-reverse.png';
import mark from '@sfms/brand/interim/zona-mark.png';
import wordmarkArReverse from '@sfms/brand/interim/zona-wordmark-ar-reverse.png';
import wordmarkAr from '@sfms/brand/interim/zona-wordmark-ar.png';
import wordmarkReverse from '@sfms/brand/interim/zona-wordmark-reverse.png';
import wordmark from '@sfms/brand/interim/zona-wordmark.png';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';

/** Native pixel size of each interim asset; max display width = native ÷ 2 (never upscaled on 2× screens). */
const ASSETS = {
  wordmark: { light: wordmark, dark: wordmarkReverse, w: 478, h: 109 },
  'wordmark-ar': { light: wordmarkAr, dark: wordmarkArReverse, w: 286, h: 160 },
  lockup: { light: lockup, dark: lockupReverse, w: 410, h: 93 },
  mark: { light: mark, dark: markReverse, w: 119, h: 115 },
} as const;

export type LogoKind = keyof typeof ASSETS;

/**
 * The ZONA logo. Shows the normal artwork on light surfaces and the brand's own reverse artwork on
 * dark ones (switched by the nearest theme scope via CSS variables). Never mirrored in RTL, never
 * recoloured or stretched; height is clamped so the raster is never shown above its native ÷ 2 size.
 */
export function Logo({ kind, height, className, decorative }: { kind: LogoKind; height: number; className?: string; decorative?: boolean }) {
  const { t } = useT();
  const a = ASSETS[kind];
  const h = Math.min(height, a.h / 2);
  const w = Math.round((a.w / a.h) * h);
  const alt = decorative ? '' : t('app.brandLabel');
  return (
    <span className={cn('inline-flex shrink-0', className)} style={{ width: w, height: h }}>
      <img src={a.light} alt={alt} width={w} height={h} className="zona-logo-on-light" draggable={false} />
      <img src={a.dark} alt={alt} width={w} height={h} className="zona-logo-on-dark" draggable={false} />
    </span>
  );
}
