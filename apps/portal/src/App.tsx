import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from '@/app/Shell';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DesignSystemPage } from '@/design-system/DesignSystemPage';
import { AttendancePage } from '@/pages/Attendance';
import { DashboardPage } from '@/pages/Dashboard';
import { EmployeesPage } from '@/pages/Employees';
import { LiveMapPage } from '@/pages/LiveMap';
import { ChangePasswordPage, LoginPage } from '@/pages/Login';
import { MarketingPage } from '@/pages/Marketing';
import { ReportsPage } from '@/pages/Reports';
import { SettingsPage } from '@/pages/Settings';
import { TargetsPage } from '@/pages/Targets';
import { AuthProvider, isAdmin, useAuth } from '@/lib/auth';
import { AppProviders } from '@/lib/frame';
import { usePreferences } from '@/lib/preferences';
import { useLocation } from '@/lib/router';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: true } } });

const ROUTES: Record<string, { id: string; page: () => React.ReactNode }> = {
  '/': { id: 'dashboard', page: () => <DashboardPage /> },
  '/employees': { id: 'employees', page: () => <EmployeesPage /> },
  '/attendance': { id: 'attendance', page: () => <AttendancePage /> },
  '/live-map': { id: 'live-map', page: () => <LiveMapPage /> },
  '/targets': { id: 'targets', page: () => <TargetsPage /> },
  '/marketing': { id: 'marketing', page: () => <MarketingPage /> },
  '/reports': { id: 'reports', page: () => <ReportsPage /> },
  '/settings': { id: 'settings', page: () => <SettingsPage /> },
};

function Routes() {
  const { path } = useLocation();
  const { status, user } = useAuth();
  if (path === '/design-system') return <DesignSystemPage />;
  if (status === 'loading') return null;
  if (status === 'signedOut' || !user) return <LoginPage />;
  if (user.mustChangePassword) return <ChangePasswordPage />;
  const route = (path === '/marketing' && !isAdmin(user) ? undefined : ROUTES[path]) ?? ROUTES['/']!;
  return <Shell active={route.id}>{route.page()}</Shell>;
}

export function App() {
  const { prefs } = usePreferences();
  return (
    <AppProviders locale={prefs.locale} digits={prefs.digits} hijri={prefs.hijri}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Routes />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AppProviders>
  );
}
