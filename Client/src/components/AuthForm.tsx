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
          console.log('🧠 Storing user in Zustand store:', data.user);
          const { setUser, setHydrated } = useAuthStore.getState();
          setUser(data.user, null);
          setHydrated(true);
        } else {
          console.warn('⚠️ Response OK, but no user object returned.');
        }
      } else {
        toast.error(data.error || 'Something went wrong.');
        console.error('❌ API returned an error:', data.error);
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
