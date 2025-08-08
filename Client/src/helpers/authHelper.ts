// Client/src/helpers/authHelper.ts
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import type {AuthFormState, LoginPayload, RegisterPayload} from '../types/auth.types';

export function passwordsMatch(
  isLogin: boolean,
  form: Pick<AuthFormState, 'password' | 'confirmPassword'>
): boolean {
  if (isLogin) return true;
  const ok = form.password === form.confirmPassword;
  if (!ok) toast.error('Passwords do not match');
  return ok;
}

export function buildEndpoint(
  isLogin: boolean
): '/api/auth/login' | '/api/auth/register' {
  return isLogin ? '/api/auth/login' : '/api/auth/register';
}

export function buildPayload(
  isLogin: boolean,
  form: AuthFormState,
  rememberMe: boolean
): LoginPayload | RegisterPayload {
  return isLogin
    ? { email: form.email, password: form.password, rememberMe }
    : { username: form.username, email: form.email, password: form.password, rememberMe };
}

export async function authRequest(
  endpoint: '/api/auth/login' | '/api/auth/register',
  payload: LoginPayload | RegisterPayload
): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

export function persistUserFromResponse(data: any): boolean {
  const user = data?.user;
  if (!user) {
    console.warn('⚠️ Response OK, but no user object returned.');
    toast.error('Unexpected response. Please try again.');
    return false;
  }
  const { setUser, setHydrated } = useAuthStore.getState();
  setUser(user, null);
  setHydrated(true);
  return true;
}

export async function linkPendingOrderIfAny(): Promise<void> {
  const linkOrderId = sessionStorage.getItem('linkOrderId');
  if (!linkOrderId) return;

  try {
    const linkRes = await fetch(`/api/order/${linkOrderId}/link-user`, {
      method: 'PATCH',
      credentials: 'include',
    });
    const linkData = await linkRes.json().catch(() => null);
    if (linkRes.ok) {
      toast.success('Order linked to your new account!');
    } else {
      console.warn('⚠️ Failed to link order:', linkData);
    }
  } catch (err) {
    console.error('❌ Link order request failed:', err);
  } finally {
    sessionStorage.removeItem('linkOrderId');
    sessionStorage.removeItem('prefillEmail');
  }
}
