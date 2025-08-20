import { useEffect } from 'react';
import { type NavigateFunction, useLocation, useNavigate } from 'react-router-dom';
import type { AuthMeResponse, AuthMeUser, MeResult } from '../types/hook.types';
import { useAuthStore, type TAuthUserType } from '../store/useAuth.store';
import { persistUserFromResponse } from '../helpers/auth.helper';
import { nextPathForUser } from '../helpers/nextPathForUser.helper';

const DEFAULT_TIMEOUT_MS = 15_000;

function isEntry(pathname: string): boolean {
  return pathname === '/' || pathname === '/auth';
}

function withAbortTimeout(ms: number): { controller: AbortController; cancel: () => void } {
  const controller = new AbortController();
  const id: number = setTimeout((): void => {
    try { controller.abort(); } catch { }
  }, ms);
  return { controller, cancel: (): void => clearTimeout(id) };
}

function persistSafely(user: AuthMeUser | null, setUser: (u: TAuthUserType, token: string | null) => void): void {
  if (!user) return;
  try {
    const ok: boolean = persistUserFromResponse({ user });
    if (!ok) setUser(user as TAuthUserType, null);
  } catch (err) {
    console.error('useSessionHydration: persistUserFromResponse failed', err);
    try { setUser(user as TAuthUserType, null); } catch (e) {
      console.error('useSessionHydration: setUser fallback failed', e);
    }
  }
}

function redirectIfNeeded(
  user: AuthMeUser | null,
  pathname: string,
  search: string,
  navigate: NavigateFunction
): void {
  if (!isEntry(pathname)) return;
  const dest: string = nextPathForUser(user ?? undefined);
  const current: string = pathname + search;
  if (dest && dest !== current) {
    try { navigate(dest, { replace: true }); } catch (err) {
      console.error('useSessionHydration: navigate failed', err);
    }
  }
}

async function loadMe(signal: AbortSignal): Promise<MeResult> {
  try {
    const res: Response = await fetch('/api/auth/me', { credentials: 'include', signal });

    if (res.status === 204) return { reachedServer: true, user: null };

    const ct: string = (res.headers.get('content-type') ?? '').toLowerCase();
    if (!ct.includes('application/json')) return { reachedServer: res.ok, user: null };

    const body: string = await res.text().catch((): string => '');
    if (!body) return { reachedServer: res.ok, user: null };

    let parsed: AuthMeResponse = null;
    try {
      parsed = JSON.parse(body) as AuthMeResponse;
    } catch (err) {
      console.warn('useSessionHydration: invalid JSON from /api/auth/me', err);
      return { reachedServer: res.ok, user: null };
    }

    const user: AuthMeUser | null = parsed && typeof parsed === 'object' && parsed.user ? parsed.user : null;
    return { reachedServer: res.ok, user };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('useSessionHydration: /api/auth/me aborted/timeout');
    } else {
      console.error('useSessionHydration: network error calling /api/auth/me', err);
    }
    return { reachedServer: false, user: null };
  }
}

export function useSessionHydration(): void {
  const { setUser, setHydrated, hydrated } = useAuthStore();
  const navigate: NavigateFunction = useNavigate();
  const location = useLocation();

  useEffect((): (() => void) | undefined => {
    if (hydrated) return;

    let cancelled: boolean = false;
    const { controller, cancel } = withAbortTimeout(DEFAULT_TIMEOUT_MS);

    const run: () => Promise<void> = async (): Promise<void> => {
      const { reachedServer, user } = await loadMe(controller.signal);
      if (cancelled) return;

      if (reachedServer) persistSafely(user, setUser);
      redirectIfNeeded(user, String(location.pathname), String(location.search ?? ''), navigate);

      if (!cancelled) {
        try { setHydrated(true); } catch (err) {
          console.error('useSessionHydration: setHydrated failed', err);
        }
      }
    };

    run().catch((err: any): void => {
      console.error('useSessionHydration: unexpected error in hydration task', err);
      try { setHydrated(true); } catch (e) {
        console.error('useSessionHydration: setHydrated failed after error', e);
      }
    });

    return (): void => {
      cancelled = true;
      try { controller.abort(); } catch { }
      cancel();
    };
  }, [hydrated, setUser, setHydrated, navigate, location.pathname, location.search]);
}
