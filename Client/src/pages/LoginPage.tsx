import React from 'react';
import LoginView from '../jsx/loginView';

export default function LoginPage(): React.ReactElement {
  return (
    <div className="bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <LoginView />
    </div>
  );
}
