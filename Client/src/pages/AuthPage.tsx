// Client/src/pages/Auth.tsx
import React from 'react';
import AuthForm from '../components/AuthFormLogic.tsx';
import ResetPasswordModal from '../modals/ResetPasswordModal.tsx';

export default function AuthPage(): React.ReactElement {
  return (
    <>
      <AuthForm />
      <ResetPasswordModal />
    </>
  );
}
