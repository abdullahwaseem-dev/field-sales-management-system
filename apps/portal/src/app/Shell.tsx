import { useQuery } from '@tanstack/react-query';
import { Bell, Check, LogOut, Menu, Monitor, Moon, Search, Sun, UserRound, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar } from '@/components/ui/sidebar';
import { api } from '@/lib/api';
import { isAdmin, useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { type MessageId, useFormat, useLocaleSettings, useT } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences';
import { navigate } from '@/lib/router';
import { DemoBanner } from './demo';

interface Notification { id: string; type: string; messageKey: string; params: Record<string, string>; createdAt: string; readAt: string | null }

function HeaderControls() {
  const { t } = useT();
  const { prefs, setPrefs } = usePreferences();
  const ThemeIcon = prefs.theme === 'dark' ? Moon : prefs.theme === 'light' ? Sun : Monitor;
  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        aria-label={t('settings.language')}
        title={prefs.locale === 'ar' ? 'English' : 'العربية'}
        onClick={() => setPrefs({ locale: prefs.locale === 'ar' ? 'en' : 'ar' })}
      >
        <span lang={prefs.locale === 'ar' ? 'en' : 'ar'} className={prefs.locale === 'ar' ? 'text-label-sm' : 'text-subtitle'}>
          {prefs.locale === 'ar' ? 'EN' : 'ع'}
        </span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" aria-label={t('settings.theme')}><ThemeIcon aria-hidden /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('settings.theme')}</DropdownMenuLabel>
          {([['system', Monitor, 'settings.themeSystem'], ['light', Sun, 'settings.themeLight'], ['dark', Moon, 'settings.themeDark']] as const).map(([v, Icon, label]) => (
            <DropdownMenuItem key={v} onSelect={() => setPrefs({ theme: v })}>
              <Icon aria-hidden />
              <span className="flex-1">{t(label)}</span>
              {prefs.theme === v ? <Check aria-hidden className="text-brand-fg!" /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t('settings.digits')}</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={prefs.digits === 'latn'} onCheckedChange={() => setPrefs({ digits: 'latn' })}>{t('settings.digitsWestern')}</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={prefs.digits === 'arab'} onCheckedChange={() => setPrefs({ digits: 'arab' })}><span dir="rtl">{t('settings.digitsArabic')}</span></DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={prefs.hijri} onCheckedChange={(v) => setPrefs({ hijri: v === true })}>{t('settings.hijri')}</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function Notifications() {
  const { t, has } = useT();
  const f = useFormat();
  const { locale } = useLocaleSettings();
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => api<{ unread: number; items: Notification[] }>('/notifications'), refetchInterval: 60_000 });
  const text = (n: Notification) => {
    const params = { ...n.params, name: (locale === 'ar' ? n.params.nameAr : n.params.nameEn) ?? '' };
    return has(n.messageKey) ? t(n.messageKey, params) : n.type;
  };
  const unread = q.data?.unread ?? 0;
  return (
    <DropdownMenu onOpenChange={(open) => open && unread && api('/notifications/read-all', { method: 'POST' }).then(() => q.refetch())}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('nav.notifications')} className="relative">
          <Bell aria-hidden />
          {unread ? <span className="absolute end-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-semibold text-on-accent">{f.number(unread)}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>{t('nav.notifications')}</DropdownMenuLabel>
        {(q.data?.items ?? []).slice(0, 8).map((n) => (
          <div key={n.id} className="flex flex-col rounded-sm px-2.5 py-2 text-body">
            <span className={cn('text-fg', !n.readAt && 'font-semibold')}>{text(n)}</span>
            <span className="text-caption text-fg-muted">{f.siteDateTime(n.createdAt)}</span>
          </div>
        ))}
        {q.data && !q.data.items.length ? <p className="px-2.5 py-3 text-body text-fg-muted">{t('notifications.empty')}</p> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { t } = useT();
  const { user, logout } = useAuth();
  const { locale } = useLocaleSettings();
  if (!user) return null;
  const name = locale === 'ar' ? user.nameAr : user.nameEn;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={name} className="inline-flex size-10 items-center justify-center rounded-full bg-brand text-label-sm text-on-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          <UserRound aria-hidden className="size-(--zona-size-icon-md)" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="text-fg">
          <span className="block text-label">{name}</span>
          <span className="block text-caption text-fg-muted">{t(`portal.role.${user.role}` as MessageId)} · <bdi dir="ltr">{user.employeeId}</bdi></span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="danger" onSelect={() => void logout()}><LogOut aria-hidden />{t('portal.signOut')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Portal layout: collapsible sidebar (off-canvas on phones), top bar with global search and controls. */
export function Shell({ active, children }: { active: string; children: ReactNode }) {
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1200);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const counts = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Record<string, number>>('/admin/dashboard'), refetchInterval: 60_000 });
  const go = (id: string) => {
    setMobileOpen(false);
    navigate(id === 'dashboard' ? '/' : `/${id}`);
  };
  const { user } = useAuth();
  const sidebar = (c: boolean) => (
    <Sidebar active={active} collapsed={c} onToggle={() => setCollapsed((x) => !x)} onNavigate={go} badges={{ attendance: counts.data?.pendingReviews || undefined }} hidden={isAdmin(user) ? [] : ['marketing']} />
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <div className="hidden md:flex">{sidebar(collapsed)}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="zona-fade fixed inset-0 bg-scrim" data-state="open" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="relative z-10 flex">{sidebar(false)}</div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:gap-3 sm:px-5">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={mobileOpen ? t('action.close') : t('nav.main')} onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
          <form
            role="search"
            className="relative min-w-0 max-w-md flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) navigate(`/employees?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <label className="sr-only" htmlFor="global-search">{t('action.search')}</label>
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-(--zona-size-icon-sm) -translate-y-1/2 text-fg-muted" />
            <input
              id="global-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="h-10 w-full rounded-md border border-line bg-canvas pe-3 ps-9 text-body text-fg placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-focus"
            />
          </form>
          <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
            <HeaderControls />
            <Notifications />
            <UserMenu />
          </div>
        </header>
        <main id="main" className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
