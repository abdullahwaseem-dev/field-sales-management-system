import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

export interface DemoInfo { adminId: string; repIds: string[]; password: string; ownerUrl: string; repoUrl: string }

/** Sign-in methods; on the public demo deployment it also carries the shared demo sign-ins. */
export function useAuthMethods() {
  return useQuery({ queryKey: ['auth-methods'], queryFn: () => api<{ otp: boolean; demo: DemoInfo | null }>('/auth/methods'), staleTime: Infinity });
}

/** Slim strip above the top bar, only on the public demo. */
export function DemoBanner() {
  const { t } = useT();
  const demo = useAuthMethods().data?.demo;
  if (!demo) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 bg-brand px-4 py-1.5 text-caption text-on-brand">
      <span className="inline-flex items-center gap-1.5 font-semibold"><Sparkles aria-hidden className="size-3.5" />{t('demo.badge')}</span>
      <span className="hidden opacity-90 sm:inline">{t('demo.banner')}</span>
      <span className="ms-auto flex items-center gap-4">
        <a className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline" href={demo.ownerUrl} target="_blank" rel="noopener">{t('demo.getIt')}<ExternalLink aria-hidden className="size-3.5" /></a>
        <a className="inline-flex items-center gap-1 underline-offset-2 hover:underline" href={demo.repoUrl} target="_blank" rel="noopener">{t('demo.source')}<ExternalLink aria-hidden className="size-3.5" /></a>
      </span>
    </div>
  );
}
