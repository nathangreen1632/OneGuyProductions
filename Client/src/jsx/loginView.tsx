import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginView(): React.ReactElement {
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (): void => {
    setUser({ id: '1', email }, null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-8 bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-2xl p-6 sm:p-8 shadow-[0_0_25px_3px_var(--theme-shadow)]">
        <h1 className="text-2xl font-bold mb-6 text-center">Customer Login</h1>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />

          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />

          <button
            onClick={handleLogin}
            className="mt-2 w-full py-2 rounded bg-[var(--theme-button)] text-[var(--theme-text-white)] font-medium shadow hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
