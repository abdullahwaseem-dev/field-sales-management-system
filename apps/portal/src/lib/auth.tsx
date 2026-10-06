import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshSession, type TokenPair, tokens } from './api';
import { usePreferences } from './preferences';

export interface PortalUser {
  employeeId: string;
  role: 'super_admin' | 'hr_admin' | 'sales_supervisor' | 'sales_rep';
  nameEn: string;
  nameAr: string;
  mustChangePassword: boolean;
}

interface AuthValue {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: PortalUser | null;
  loginWithPassword: (employeeId: string, password: string) => Promise<void>;
  requestOtp: (employeeId: string) => Promise<string | undefined>;
  loginWithOtp: (employeeId: string, code: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const toUser = (p: TokenPair): PortalUser => ({ ...p.employee, role: p.employee.role as PortalUser['role'], mustChangePassword: p.mustChangePassword });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthValue['status']>(tokens.hasRefresh() ? 'loading' : 'signedOut');
  const [user, setUser] = useState<PortalUser | null>(null);
  const { prefs } = usePreferences();

  const accept = useCallback((p: TokenPair) => {
    tokens.set(p.accessToken, p.refreshToken);
    setUser(toUser(p));
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      refreshSession().then((p) => (p ? accept(p) : setStatus('signedOut')));
    }
    return tokens.onSessionEnded(() => {
      setUser(null);
      setStatus('signedOut');
    });
  }, [accept, status]);

  // Save display preferences to the user's profile on the server (per user, across devices).
  useEffect(() => {
    if (status !== 'signedIn' || user?.mustChangePassword) return;
    api('/me/preferences', { method: 'PATCH', body: { theme: prefs.theme, locale: prefs.locale, digits: prefs.digits === 'arab' ? 'arabic_indic' : 'western', showHijri: prefs.hijri } }).catch(() => undefined);
  }, [status, user?.mustChangePassword, prefs.theme, prefs.locale, prefs.digits, prefs.hijri]);

  const value = useMemo<AuthValue>(() => ({
    status,
    user,
    loginWithPassword: async (employeeId, password) => accept(await api<TokenPair>('/auth/login', { body: { employeeId, password, client: 'portal' } })),
    requestOtp: async (employeeId) => (await api<{ devCode?: string }>('/auth/otp/request', { body: { employeeId } })).devCode,
    loginWithOtp: async (employeeId, code) => accept(await api<TokenPair>('/auth/otp/verify', { body: { employeeId, code, client: 'portal' } })),
    changePassword: async (current, next) => accept(await api<TokenPair>('/auth/password', { body: { currentPassword: current, newPassword: next } })),
    logout: async () => {
      await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
      tokens.clear();
      setUser(null);
      setStatus('signedOut');
    },
  }), [accept, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

/** Single-admin model: only the administrator signs in to the portal. */
export const isAdmin = (u: PortalUser | null) => u?.role === 'super_admin';
