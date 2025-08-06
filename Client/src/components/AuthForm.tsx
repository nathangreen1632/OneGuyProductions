import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useResetPasswordStore } from '../store/useResetPasswordStore';

export default function AuthForm(): React.ReactElement {
  const { openModal } = useResetPasswordStore();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email: form.email, password: form.password }
      : form;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(isLogin ? 'Login successful!' : 'Registration complete!');
        navigate('/portal');
      } else {
        toast.error(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]"
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
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]"
          />

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
