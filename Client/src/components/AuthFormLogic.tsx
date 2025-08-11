import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordStore } from '../store/useResetPasswordStore';
import { useAuthStore } from '../store/useAuthStore';
import AuthFormView from '../jsx/authFormView';
import { passwordsMatch, loginEndpoint, registerEndpoint, buildLoginPayload, buildRegisterPayload, authRequest, persistUserFromResponse, linkPendingOrderIfAny } from '../helpers/authHelper';
import type { AuthFormState, LoginPayload, RegisterPayload } from '../types/auth.types.ts';

type TAuthEndpoint = '/api/auth/login' | '/api/auth/register';
type TApiResult = { ok: boolean; data: unknown };

const nextPathForEmail = (email: string): string => {
  const e = (email || '').toLowerCase().trim();
  return e.endsWith('@oneguyproductions.com') ? '/admin/orders' : '/portal';
};

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

  const { isAuthenticated, hydrated }: { isAuthenticated: boolean; hydrated: boolean } = useAuthStore();

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
      toast.success(isLogin ? 'Login successful!' : 'Registration complete!');
      const persisted: boolean = persistUserFromResponse(data);
      if (!persisted) return;
      await linkPendingOrderIfAny();

      // after persistUserFromResponse(data) and await linkPendingOrderIfAny()
      const u = (data as { user?: { email?: string } } | null)?.user?.email ?? '';
      const dest = nextPathForEmail(u);

// if a user was bounced from an admin page to /auth, honor that return path only if they’re admin
      const from = (history.state && (history.state).usr?.from?.pathname) || null;
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

  const inputClass: string =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]';

  const passwordType: 'text' | 'password' = showPassword ? 'text' : 'password';
  const buttonText: string = getButtonText(loading, isLogin);

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
