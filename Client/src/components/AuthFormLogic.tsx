import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordStore } from '../store/useResetPasswordStore';
import { useAuthStore } from '../store/useAuthStore';
import AuthFormView from '../jsx/authFormView';
import {
  passwordsMatch,
  loginEndpoint,
  registerEndpoint,
  buildLoginPayload,
  buildRegisterPayload,
  authRequest,
  persistUserFromResponse,
  linkPendingOrderIfAny
} from '../helpers/authHelper';
import type { AuthFormState, LoginPayload, RegisterPayload } from '../types/auth.types';

type TAuthEndpoint = '/api/auth/login' | '/api/auth/register';
type TApiResult = { ok: boolean; data: unknown };

const nextPathForEmail: (u: unknown) => string = (u: any): string => {
  const role: string = (u?.role as string) || 'user';
  const verified: boolean = Boolean(u?.emailVerified);
  return role === 'admin' && verified ? '/admin/orders' : '/portal';
};

function getSafeReturnTo(): string | null {
  const params = new URLSearchParams(window.location.search);
  const rt: string = params.get('returnTo') || '';
  if (rt?.startsWith('/')) return rt;
  return null;
}

export default function AuthFormLogic(): React.ReactElement {
  const { openModal } = useResetPasswordStore();
  const navigate: ReturnType<typeof useNavigate> = useNavigate();

  useEffect((): void => {
    const mode: string | null = new URLSearchParams(window.location.search).get('mode');
    const prefill: string | null = sessionStorage.getItem('prefillEmail');
    if (mode === 'register') {
      setIsLogin(false);
      if (prefill) {
        setForm((prev: AuthFormState): AuthFormState => ({ ...prev, email: prefill }));
      }
    }
  }, []);

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [form, setForm] = useState<AuthFormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const inputClass =
    'w-full rounded-xl border border-[var(--theme-border-blue)] bg-transparent p-2 text-sm outline-none';

  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect((): void => {
    if (hydrated && isAuthenticated) navigate('/portal');
  }, [hydrated, isAuthenticated, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value }: { name: string; value: string } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!passwordsMatch(form)) return;

    setLoading(true);
    const endpoint: TAuthEndpoint = isLogin ? loginEndpoint() : registerEndpoint();
    const payload: LoginPayload | RegisterPayload = isLogin
      ? buildLoginPayload(form, rememberMe)
      : buildRegisterPayload(form, rememberMe);

    try {
      const { ok, data }: TApiResult = await authRequest(endpoint, payload);
      if (!ok) {
        const msg: string = (data as { error?: string } | null)?.error ?? 'Something went wrong.';
        toast.error(msg);
        return;
      }

      if ((data as any)?.next === 'verify-admin-email') {
        toast.success('Check your @oneguyproductions.com inbox for your admin verification code.');
        navigate('/auth?mode=verify-admin', { replace: true });
        return;
      }

      const persisted: boolean = persistUserFromResponse(data);
      if (!persisted) return;

      await linkPendingOrderIfAny();

      const u: Record<string, unknown> | null =
        (data as { user?: Record<string, unknown> } | null)?.user ?? null;
      const fallback: string = nextPathForEmail(u);
      const rt: string | null = getSafeReturnTo();

      const dest: string = rt ?? fallback;

      const from = (history.state?.usr?.from?.pathname) || null;
      if (from && dest.startsWith('/admin') && from.startsWith('/admin')) {
        navigate(from, { replace: true });
      } else {
        navigate(dest, { replace: true });
      }
    } catch (err: unknown) {
      console.error('🚨 Fetch failed:', err);
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function getButtonText(isLoading: boolean, loginMode: boolean): string {
    if (isLoading) return 'Please wait...';
    if (loginMode) return 'Log In';
    return 'Register';
  }

  const buttonText: string = getButtonText(loading, isLogin);
  const passwordType: 'text' | 'password' = showPassword ? 'text' : 'password';

  return (
    <AuthFormView
      isLogin={isLogin}
      form={form}
      showPassword={showPassword}
      rememberMe={rememberMe}
      loading={loading}
      inputClass={inputClass}
      passwordType={passwordType}
      buttonText={buttonText}
      openModal={openModal}
      setIsLogin={setIsLogin}
      setShowPassword={setShowPassword}
      setRememberMe={setRememberMe}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
    />
  );
}
