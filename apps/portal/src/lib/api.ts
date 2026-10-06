/** Error from the API (problem+json) or the network; `code` maps to a localized message. */
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, readonly extra: Record<string, unknown> = {}) {
    super(code);
  }
}

const BASE = '/api/v1';
const REFRESH_KEY = 'sfms.refresh';

// Access token in memory only; refresh token in sessionStorage (survives reload, not a closed tab).
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
const sessionListeners = new Set<() => void>();

export const tokens = {
  set(access: string, refresh: string) {
    accessToken = access;
    try { sessionStorage.setItem(REFRESH_KEY, refresh); } catch { /* storage blocked */ }
  },
  clear() {
    accessToken = null;
    try { sessionStorage.removeItem(REFRESH_KEY); } catch { /* storage blocked */ }
  },
  hasRefresh() {
    try { return !!sessionStorage.getItem(REFRESH_KEY); } catch { return false; }
  },
  /** Called when the session can no longer be renewed (signed out elsewhere, expired). */
  onSessionEnded(fn: () => void) {
    sessionListeners.add(fn);
    return () => {
      sessionListeners.delete(fn);
    };
  },
};

/** For file downloads that need the bearer token (anchor-based downloads can't send headers). */
export const accessTokenForDownload = () => accessToken ?? '';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  employee: { employeeId: string; role: string; nameEn: string; nameAr: string };
}

export async function refreshSession(): Promise<TokenPair | null> {
  let refresh: string | null = null;
  try { refresh = sessionStorage.getItem(REFRESH_KEY); } catch { /* blocked */ }
  if (!refresh) return null;
  const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }) });
  if (!res.ok) return null;
  const pair = (await res.json()) as TokenPair;
  tokens.set(pair.accessToken, pair.refreshToken);
  return pair;
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}, retried = false): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK');
  }
  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    refreshing ??= refreshSession().then((p) => !!p).finally(() => (refreshing = null));
    if (await refreshing) return api<T>(path, init, true);
    tokens.clear();
    sessionListeners.forEach((l) => l());
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.code ?? `HTTP_${res.status}`, data ?? {});
  return data as T;
}

/** Server-Sent Events over fetch (so the Authorization header can be sent). */
export async function streamEvents(path: string, onEvent: (event: string, data: unknown) => void, signal: AbortSignal) {
  const res = await fetch(`${BASE}${path}`, { headers: { authorization: `Bearer ${accessToken}` }, signal });
  if (!res.ok || !res.body) throw new ApiError(res.status, 'STREAM_FAILED');
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let event = 'message', data = '';
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7);
        else if (line.startsWith('data: ')) data += line.slice(6);
      }
      if (data) onEvent(event, JSON.parse(data));
    }
  }
}
