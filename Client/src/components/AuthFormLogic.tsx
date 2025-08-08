import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordStore } from '../store/useResetPasswordStore';
import { useAuthStore } from '../store/useAuthStore';
import AuthFormView from '../jsx/authFormView';

export interface AuthFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

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
    console.log('👁️ Zustand state check:', { hydrated, isAuthenticated });
    if (hydrated && isAuthenticated) {
      console.log('✅ Zustand ready and authenticated. Navigating to /portal...');
      navigate('/portal');
    }
  }, [hydrated, isAuthenticated, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLogin && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email: form.email, password: form.password, rememberMe }
      : { username: form.username, email: form.email, password: form.password, rememberMe };

    console.log('📨 Submitting to:', endpoint);
    console.log('📦 Payload:', payload);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('📥 Raw response:', res);
      const data = await res.json();
      console.log('📤 Parsed response data:', data);

      if (res.ok) {
        toast.success(isLogin ? 'Login successful!' : 'Registration complete!');
        if (data.user) {
          const { setUser, setHydrated } = useAuthStore.getState();
          setUser(data.user, null);
          setHydrated(true);

          // 🔗 Attempt to link order if we came from the signup prompt
          const linkOrderId = sessionStorage.getItem('linkOrderId');
          if (linkOrderId) {
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
        } else {
          console.warn('⚠️ Response OK, but no user object returned.');
          toast.error('Unexpected response. Please try again.');
        }
      }

    } catch (err) {
      console.error('🚨 Fetch failed:', err);
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]';

  const passwordType = showPassword ? 'text' : 'password';

  let buttonText: string;
  if (loading) {
    buttonText = 'Please wait...';
  } else if (isLogin) {
    buttonText = 'Log In';
  } else {
    buttonText = 'Register';
  }

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
