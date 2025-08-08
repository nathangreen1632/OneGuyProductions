import React from 'react';
import type { AuthFormState } from '../components/AuthForm';

interface AuthFormViewProps {
  isLogin: boolean;
  form: AuthFormState;
  showPassword: boolean;
  rememberMe: boolean;
  loading: boolean;
  inputClass: string;
  passwordType: 'text' | 'password';
  buttonText: string;
  openModal: () => void;

  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;

  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void> | void;
}

export default function AuthFormView(props: Readonly<AuthFormViewProps>): React.ReactElement {
  const {
    isLogin,
    form,
    showPassword,
    rememberMe,
    loading,
    inputClass,
    passwordType,
    buttonText,
    openModal,
    setIsLogin,
    setShowPassword,
    setRememberMe,
    handleChange,
    handleSubmit,
  } = props;

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
              className={`${inputClass} pr-10`} /* ⏩ padding for toggle button */
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
