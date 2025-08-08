// Client/src/pages/Auth.tsx
import React from 'react';
import AuthForm from '../components/AuthFormLogic';
import ResetPasswordModal from '../modals/ResetPasswordModal';

export default function AuthPage(): React.ReactElement {
  return (
    <>
      <AuthForm />
      <ResetPasswordModal />
    </>
  );
}
