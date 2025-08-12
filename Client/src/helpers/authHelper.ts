import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import type { AuthFormState, LoginPayload, RegisterPayload } from '../types/auth.types';
// Optional type safety (type-only, so no runtime import):
import type { TAuthUserType } from '../store/useAuthStore';

type TAuthEndpoint = '/api/auth/login' | '/api/auth/register';
type TApiResult<T = unknown> = { ok: boolean; data: T | null };

export function passwordsMatch(
  form: Pick<AuthFormState, 'password' | 'confirmPassword'>
): boolean {
  if (!form.confirmPassword) return true;
  const ok: boolean = form.password === form.confirmPassword;
  if (!ok) toast.error('Passwords do not match');
  return ok;
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
  return { email: form.email, password: form.password, rememberMe };
}

export function buildRegisterPayload(
  form: Pick<AuthFormState, 'username' | 'email' | 'password'>,
  rememberMe: boolean
): RegisterPayload {
  return {
    username: form.username,
    email: form.email,
    password: form.password,
    rememberMe,
  };
}

export async function authRequest<T = unknown>(
  endpoint: TAuthEndpoint,
  payload: LoginPayload | RegisterPayload
): Promise<TApiResult<T>> {
  const res: Response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data: T | null = (await res.json().catch((): null => null)) as T | null;
  return { ok: res.ok, data };
}

/**
 * Persists the server user payload into the auth store.
 * Expects `data` to look like: { user: { id, email, username?, role?, emailVerified? } }
 * Falls back safely so older responses won't crash.
 */
export function persistUserFromResponse(data: unknown): boolean {
  const serverUser: any = (data as { user?: unknown } | null)?.user;
  if (!serverUser) {
    console.warn('⚠️ Response OK, but no user object returned.');
    toast.error('Unexpected response. Please try again.');
    return false;
  }

  const normalized: TAuthUserType = {
    id: String(serverUser.id ?? ''),
    email: String(serverUser.email ?? ''),
    username: String(serverUser.username ?? ''),
    role: (serverUser.role as TAuthUserType['role']) ?? 'user',
    emailVerified: Boolean(serverUser.emailVerified ?? false),
  };

  const { setUser, setHydrated } = useAuthStore.getState();
  setUser(normalized, null); // HttpOnly cookie is used; no token string expected
  setHydrated(true);
  return true;
}

export async function linkPendingOrderIfAny(): Promise<void> {
  const linkOrderId: string | null = sessionStorage.getItem('linkOrderId');
  if (!linkOrderId) return;

  try {
    const linkRes: Response = await fetch(`/api/order/${linkOrderId}/link-user`, {
      method: 'PATCH',
      credentials: 'include',
    });
    const linkData: unknown = await linkRes.json().catch(() => null);
    if (linkRes.ok) {
      toast.success('Order linked to your new account!');
    } else {
      console.warn('⚠️ Failed to link order:', linkData);
    }
  } catch (err: unknown) {
    console.error('❌ Link order request failed:', err);
  } finally {
    sessionStorage.removeItem('linkOrderId');
    sessionStorage.removeItem('prefillEmail');
  }
}
