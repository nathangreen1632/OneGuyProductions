import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import { useResetPasswordStore } from '../store/useResetPassword.store';
import { type TAuthStateType, useAuthStore } from '../store/useAuth.store';
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
} from '../helpers/auth.helper.ts';
import type {
  AuthFormState,
  LoginPayload,
  RegisterPayload,
  TAuthEndpoint,
  TApiResult,
  BuiltAuth
} from '../types/auth.types';

const nextPathForEmail: (u: unknown) => string = (u: any): string => {
  try {
    const role: string = (u?.role as string) || 'user';
    const verified: boolean = Boolean(u?.emailVerified);
    return role === 'admin' && verified ? '/admin/orders' : '/portal';
  } catch (err) {
    console.warn('AuthForm: failed to infer next path from user.', err);
    return '/portal';
  }
};

function getSafeReturnTo(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const rt: string = params.get('returnTo') || '';
    if (rt?.startsWith('/')) return rt;
    if (rt) console.warn('AuthForm: ignoring unsafe returnTo value:', rt);
    return null;
  } catch (err) {
    console.warn('AuthForm: failed to read returnTo from URL.', err);
    return null;
  }
}

function readPrefillEmail(): string {
  try {
    return sessionStorage.getItem('prefillEmail') || '';
  } catch (err) {
    console.warn('AuthForm: failed to read prefillEmail from sessionStorage.', err);
    return '';
  }
}

export default function AuthFormLogic(): React.ReactElement {
  const { openModal } = useResetPasswordStore();
  const navigate: NavigateFunction = useNavigate();

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

  const authStore: TAuthStateType = useAuthStore();
  const hydrated: boolean = Boolean(authStore?.hydrated);
  const isAuthenticated: boolean = Boolean(authStore?.isAuthenticated);

  useEffect((): void => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode: string | null = params.get('mode');
      const prefill: string = readPrefillEmail();

      if (mode === 'register') {
        setIsLogin(false);
        if (prefill) {
          setForm((prev: AuthFormState): AuthFormState => ({ ...prev, email: prefill }));
        }
      }
    } catch (err) {
      console.error('AuthForm: failed during initial mode/prefill setup.', err);
      toast.error('Failed to initialize auth form.');
    }
  }, []);

  useEffect((): void => {
    if (!hydrated) return;
    if (isAuthenticated) {
      try {
        navigate('/portal');
      } catch (err) {
        console.error('AuthForm: navigation error after auth hydration.', err);
        toast.error('Navigation error after sign-in.');
      }
    }
  }, [hydrated, isAuthenticated, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    try {
      const { name, value } = e.target ?? {};
      if (typeof name !== 'string') {
        console.warn('AuthForm: input change without a valid name.', e);
        return;
      }
      setForm((prev: AuthFormState): AuthFormState => ({ ...prev, [name]: String(value ?? '') }));
    } catch (err) {
      console.error('AuthForm: handleChange failed.', err);
      toast.error('Could not update form field.');
    }
  }

  function validateBeforeSubmit(): boolean {
    try {
      if (!passwordsMatch(form)) {
        toast.error('Passwords do not match.');
        return false;
      }
      if (loading) {
        console.warn('AuthForm: submit blocked while loading.');
        toast.error('Please wait… submitting.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('AuthForm: validation failed.', err);
      toast.error('Validation error.');
      return false;
    }
  }

  function buildEndpointAndPayload(): BuiltAuth | null {
    try {
      const endpoint: TAuthEndpoint = isLogin ? loginEndpoint() : registerEndpoint();
      const payload: LoginPayload | RegisterPayload = isLogin
        ? buildLoginPayload(form, rememberMe)
        : buildRegisterPayload(form, rememberMe);
      return { endpoint, payload };
    } catch (err) {
      console.error('AuthForm: failed to build auth payload/endpoint.', err);
      toast.error('Could not prepare your request.');
      return null;
    }
  }

  async function sendAuth(
    endpoint: TAuthEndpoint,
    payload: LoginPayload | RegisterPayload
  ): Promise<TApiResult | null> {
    try {
      return await authRequest(endpoint, payload);
    } catch (err) {
      console.error('AuthForm: network/authRequest error.', err);
      toast.error('Network error. Please try again.');
      return null;
    }
  }

  function maybeHandleAdminVerify(data: unknown): boolean {
    if ((data as any)?.next === 'verify-admin-email') {
      toast.success('Check your @oneguyproductions.com inbox for your admin verification code.');
      try {
        navigate('/auth?mode=verify-admin', { replace: true });
      } catch (err) {
        console.error('AuthForm: navigation failed (verify-admin).', err);
        toast.error('Verified. Please open the Admin Verify page.');
      }
      return true;
    }
    return false;
  }

  async function persistAndLink(data: unknown): Promise<boolean> {
    try {
      const persisted: boolean = persistUserFromResponse(data);
      if (!persisted) {
        console.warn('AuthForm: user not persisted from response.');
        toast.error('Could not sign you in.');
        return false;
      }
      try {
        await linkPendingOrderIfAny();
      } catch (err) {
        console.error('AuthForm: linkPendingOrderIfAny failed.', err);
        toast.error('Signed in, but failed to link pending order.');
      }
      return true;
    } catch (err) {
      console.error('AuthForm: persistUserFromResponse failed.', err);
      toast.error('Failed to save your session.');
      return false;
    }
  }

  function computeDestination(data: unknown): string {
    try {
      const u: Record<string, unknown> | null =
        (data as { user?: Record<string, unknown> } | null)?.user ?? null;
      return getSafeReturnTo() ?? nextPathForEmail(u);
    } catch (err) {
      console.warn('AuthForm: failed to compute destination path.', err);
      return '/portal';
    }
  }

  function safeNavigateTo(dest: string): void {
    try {
      const from = (history.state)?.usr?.from?.pathname || null;
      if (from && dest.startsWith('/admin') && String(from).startsWith('/admin')) {
        navigate(from, { replace: true });
      } else {
        navigate(dest, { replace: true });
      }
    } catch (err) {
      console.error('AuthForm: navigation failed to destination.', err);
      toast.error('Signed in, but navigation failed. Please use the menu to continue.');
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    try {
      e.preventDefault();
      if (!validateBeforeSubmit()) return;

      setLoading(true);

      const built: BuiltAuth | null = buildEndpointAndPayload();
      if (!built) return;

      const { endpoint, payload } = built;

      const result: TApiResult | null = await sendAuth(endpoint, payload);
      if (!result) return;

      if (!result.ok) {
        const msg: string =
          (result.data as { error?: string } | null)?.error ?? 'Authentication failed.';
        console.warn('AuthForm: authentication failed.', msg);
        toast.error(msg);
        return;
      }

      if (maybeHandleAdminVerify(result.data)) return;

      const ok: boolean = await persistAndLink(result.data);
      if (!ok) return;

      toast.dismiss('admin-guard-denied');
      toast.success('Successfully logged in', { id: 'login-success' });

      safeNavigateTo(computeDestination(result.data));
    } catch (err) {
      console.error('AuthForm: unexpected error in handleSubmit.', err);
      toast.error('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }


  function getButtonText(isLoading: boolean, loginMode: boolean): string {
    try {
      if (isLoading) return 'Please wait...';
      return loginMode ? 'Log In' : 'Register';
    } catch {
      return 'Submit';
    }
  }

  const buttonText: string = getButtonText(loading, isLogin);
  const passwordType: 'text' | 'password' = showPassword ? 'text' : 'password';

  return (
    <AuthFormView
      isLogin={Boolean(isLogin)}
      form={form}
      showPassword={Boolean(showPassword)}
      rememberMe={Boolean(rememberMe)}
      loading={Boolean(loading)}
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
