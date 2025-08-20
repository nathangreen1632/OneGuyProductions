import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuth.store';
import type { AuthFormState, LoginPayload, RegisterPayload } from '../types/auth.types';
import type { TAuthUserType } from '../store/useAuth.store';

type TAuthEndpoint = '/api/auth/login' | '/api/auth/register';
type TApiResult<T = unknown> = { ok: boolean; data: T | null };

const DEFAULT_TIMEOUT_MS = 20_000;

export function passwordsMatch(
  form: Pick<AuthFormState, 'password' | 'confirmPassword'>
): boolean {
  try {
    if (!form?.confirmPassword) return true;
    const ok = String(form.password ?? '') === String(form.confirmPassword ?? '');
    if (!ok) toast.error('Passwords do not match');
    return ok;
  } catch (err) {
    console.error('authHelper: passwordsMatch failed', err);
    toast.error('Password validation failed');
    return false;
  }
}

export function loginEndpoint(): TAuthEndpoint {
  return '/api/auth/login';
}

export function registerEndpoint(): TAuthEndpoint {
  return '/api/auth/register';
}

export function buildLoginPayload(
  form: Pick<AuthFormState, 'email' | 'password'>,
  rememberMe: boolean
): LoginPayload {
  try {
    return {
      email: String(form?.email ?? ''),
      password: String(form?.password ?? ''),
      rememberMe: Boolean(rememberMe),
    };
  } catch (err) {
    console.error('authHelper: buildLoginPayload failed', err);
    return { email: '', password: '', rememberMe: Boolean(rememberMe) };
  }
}

export function buildRegisterPayload(
  form: Pick<AuthFormState, 'username' | 'email' | 'password'>,
  rememberMe: boolean
): RegisterPayload {
  try {
    return {
      username: String(form?.username ?? ''),
      email: String(form?.email ?? ''),
      password: String(form?.password ?? ''),
      rememberMe: Boolean(rememberMe),
    };
  } catch (err) {
    console.error('authHelper: buildRegisterPayload failed', err);
    return {
      username: '',
      email: '',
      password: '',
      rememberMe: Boolean(rememberMe),
    };
  }
}

export async function authRequest<T = unknown>(
  endpoint: TAuthEndpoint,
  payload: LoginPayload | RegisterPayload
): Promise<TApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res: Response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
    });

    let data: T | null;
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const status: number = res.status;
      const msg: any =
        (data as any)?.error ??
        (data as any)?.message ??
        `Authentication failed (HTTP ${status}).`;
      console.warn('authHelper: authRequest server error', { endpoint, status, msg, data });
    }

    return { ok: res.ok, data };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('authHelper: authRequest timed out', { endpoint });
    } else {
      console.error('authHelper: network error during authRequest', { endpoint, err });
    }
    return { ok: false, data: null };
  } finally {
    clearTimeout(timer);
  }
}

export function persistUserFromResponse(data: unknown): boolean {
  try {
    const serverUser: unknown = (data as { user?: unknown } | null)?.user;
    if (!serverUser || typeof serverUser !== 'object') {
      console.warn('authHelper: response OK, but no user object returned.', { data });
      toast.error('Unexpected response. Please try again.');
      return false;
    }

    const u = serverUser as Record<string, unknown>;
    const normalized: TAuthUserType = {
      id: String(u.id ?? ''),
      email: String(u.email ?? ''),
      username: String(u.username ?? ''),
      role: (u.role as TAuthUserType['role']) ?? 'user',
      emailVerified: Boolean(u.emailVerified ?? false),
    };

    if (!normalized.id || !normalized.email) {
      console.warn('authHelper: user object missing id/email', { normalized, raw: u });
      toast.error('Invalid user object returned. Please try again.');
      return false;
    }

    const store = useAuthStore.getState?.();
    if (!store || typeof store.setUser !== 'function' || typeof store.setHydrated !== 'function') {
      console.error('authHelper: auth store not available or malformed.');
      toast.error('Unable to save session. Please try again.');
      return false;
    }

    try {
      store.setUser(normalized, null);
      store.setHydrated(true);
    } catch (err) {
      console.error('authHelper: failed to write user to store', err);
      toast.error('Failed to save your session.');
      return false;
    }

    return true;
  } catch (err) {
    console.error('authHelper: persistUserFromResponse threw', err);
    toast.error('Failed to process sign-in response.');
    return false;
  }
}

export async function linkPendingOrderIfAny(): Promise<void> {
  let linkOrderId: string | null = null;

  const removeKeys: () => void = (): void => {
    try {
      sessionStorage.removeItem('linkOrderId');
      sessionStorage.removeItem('prefillEmail');
    } catch (err) {
      console.warn('authHelper: failed to clear sessionStorage keys', err);
    }
  };

  try {
    try {
      linkOrderId = sessionStorage.getItem('linkOrderId');
    } catch (err) {
      console.warn('authHelper: failed to read linkOrderId from sessionStorage', err);
      return;
    }
    if (!linkOrderId) return;

    const idNum: number = Number(linkOrderId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      console.warn('authHelper: invalid linkOrderId value', linkOrderId);
      return;
    }

    const controller = new AbortController();
    const timer: number = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let linkRes: Response;
    try {
      linkRes = await fetch(`/api/order/${idNum}/link-user`, {
        method: 'PATCH',
        credentials: 'include',
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('authHelper: link order request timed out', { orderId: idNum });
      } else {
        console.error('authHelper: network error linking order', { orderId: idNum, err });
      }
      return;
    } finally {
      clearTimeout(timer);
    }

    let linkData: any;
    try {
      linkData = await linkRes.json();
    } catch {
      linkData = null;
    }

    if (linkRes.ok) {
      toast.success('Order linked to your new account!');
    } else {
      const msg: any =
        (linkData && (linkData.error || linkData.message)) ||
        `Failed to link order (HTTP ${linkRes.status}).`;
      console.warn('authHelper: failed to link order', { orderId: idNum, msg, linkData });
      // No toast on failure by design—link is a best-effort post-login step.
    }
  } catch (err) {
    console.error('authHelper: unexpected error in linkPendingOrderIfAny', err);
  } finally {
    removeKeys();
  }
}
