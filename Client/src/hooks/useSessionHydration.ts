import { useEffect } from 'react';
import {type NavigateFunction, useLocation, useNavigate} from 'react-router-dom';
import { useAuthStore, type TAuthUserType } from '../store/useAuthStore';
import { persistUserFromResponse } from '../helpers/authHelper';
import { nextPathForUser } from '../helpers/nextPathForUser';

type AuthMeUser = Pick<TAuthUserType, 'id' | 'email' | 'role' | 'emailVerified'> &
  Partial<Pick<TAuthUserType, 'username'>>;

type AuthMeResponse = { user?: AuthMeUser } | null;

function isEntry(pathname: string): boolean {
  return pathname === '/' || pathname === '/auth';
}

type MeResult = {
  reachedServer: boolean;
  user: AuthMeUser | null;
};

async function loadMe(signal: AbortSignal): Promise<MeResult> {
  try {
    const res: Response = await fetch('/api/auth/me', { credentials: 'include', signal });

    if (res.status === 204) return { reachedServer: true, user: null };

    const ct: string = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      return { reachedServer: res.ok, user: null };
    }

    const body: string = await res.text();
    if (!body) return { reachedServer: res.ok, user: null };

    let parsed: AuthMeResponse = null;
    try {
      parsed = JSON.parse(body) as AuthMeResponse;
    } catch {
      return { reachedServer: res.ok, user: null };
    }

    const user: AuthMeUser | null =
      parsed && typeof parsed === 'object' && parsed.user ? parsed.user : null;

    return { reachedServer: res.ok, user };
  } catch {

    return { reachedServer: false, user: null };
  }
}

export function useSessionHydration(): void {
  const { setUser, setHydrated, hydrated } = useAuthStore();
  const navigate: NavigateFunction = useNavigate();
  const location = useLocation();

  useEffect(():(() => void) | undefined => {
    if (hydrated) return;

    let cancelled: boolean = false;
    const controller = new AbortController();

    (async (): Promise<void> => {
      try {
        const { reachedServer, user } = await loadMe(controller.signal);
        if (cancelled) return;

        if (reachedServer) {
          const persisted: boolean = persistUserFromResponse({ user });
          if (!persisted && user) setUser(user as TAuthUserType, null);
        }

        if (isEntry(location.pathname)) {
          const dest = nextPathForUser(user ?? undefined);
          navigate(dest, { replace: true });
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [setUser, setHydrated, hydrated, location.pathname, navigate]);
}
