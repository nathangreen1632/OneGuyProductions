import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordStore } from '../store/useResetPasswordStore';
import { useAuthStore } from '../store/useAuthStore';
import AuthFormView from '../jsx/authFormView';
import { passwordsMatch, loginEndpoint, registerEndpoint, buildLoginPayload, buildRegisterPayload, authRequest, persistUserFromResponse, linkPendingOrderIfAny } from '../helpers/authHelper';
import type {AuthFormState} from "../types/auth.types.ts";

export default function AuthFormLogic(): React.ReactElement {
  const { openModal } = useResetPasswordStore();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode');
    const prefill = sessionStorage.getItem('prefillEmail');
    if (mode === 'register') {
      setIsLogin(false);
      if (prefill) {
        setForm((prev) => ({ ...prev, email: prefill }));
      }
    }
  }, []);

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState<AuthFormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && isAuthenticated) navigate('/portal');
  }, [hydrated, isAuthenticated, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordsMatch(form)) return;

    setLoading(true);
    const endpoint = isLogin ? loginEndpoint() : registerEndpoint();
    const payload = isLogin
      ? buildLoginPayload(form, rememberMe)
      : buildRegisterPayload(form, rememberMe);

    try {
      const { ok, data } = await authRequest(endpoint, payload);
      if (!ok) {
        toast.error(data?.error || 'Something went wrong.');
        return;
      }

      toast.success(isLogin ? 'Login successful!' : 'Registration complete!');
      if (!persistUserFromResponse(data)) return;

      await linkPendingOrderIfAny();
    } catch (err) {
      console.error('🚨 Fetch failed:', err);
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function getButtonText(loading: boolean, isLogin: boolean): string {
    if (loading) {
      return 'Please wait...';
    }
    if (isLogin) {
      return 'Log In';
    }
    return 'Register';
  }

  const inputClass =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]';

  const passwordType = showPassword ? 'text' : 'password';
  const buttonText = getButtonText(loading, isLogin);


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
