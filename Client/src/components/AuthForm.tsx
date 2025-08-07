import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordStore } from '../store/useResetPasswordStore';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthForm(): React.ReactElement {
  const { openModal } = useResetPasswordStore();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '', // 👈 Added for registration
  });
  const [showPassword, setShowPassword] = useState(false); // 👈 Password visibility toggle
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
    <div className="min-h-[85vh] flex items-center justify-center px-8 bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-2xl p-6 sm:p-8 shadow-[0_0_25px_3px_var(--theme-shadow)]">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Log In' : 'Register'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className={inputClass}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className={inputClass}
          />

          {/* 🔒 Password field with show toggle */}
          <div className="relative">
            <input
              type={passwordType}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className={`${inputClass} pr-10`} // ⏩ padding for toggle button
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-black hover:underline focus:outline-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* ✅ Confirm Password */}
          {!isLogin && (
            <input
              type={passwordType}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className={inputClass}
            />
          )}

          {/* ✅ Remember Me */}
          <p className="flex items-center gap-2 text-sm pl-1">
            {isLogin && (
              <label className="flex items-center gap-2 text-sm pl-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded bg-[var(--theme-button)] text-[var(--theme-text-white)] font-medium hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 transition"
                />
                <span>Remember Me</span>
              </label>
            )}
          </p>

          <button
            type="submit"
            className="mt-2 w-full py-2 rounded bg-[var(--theme-button)] text-[var(--theme-text-white)] font-medium shadow hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 transition"
            disabled={loading}
          >
            {buttonText}
          </button>
        </form>

        {isLogin && (
          <p className="text-sm mt-4 text-center">
            Forgot your password?{' '}
            <button
              type="button"
              className="text-blue-500 underline"
              onClick={openModal}
            >
              Reset here
            </button>
          </p>
        )}

        <p className="text-sm mt-4 text-center">
          {isLogin ? "Don't have an account?" : 'Already registered?'}{' '}
          <button
            type="button"
            className="text-blue-500 underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
