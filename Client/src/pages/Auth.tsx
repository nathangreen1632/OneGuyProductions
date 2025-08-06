// Client/src/pages/Auth.tsx
import React from 'react';
import AuthForm from '../components/AuthForm';
import ResetPasswordModal from '../components/ResetPasswordModal';

export default function AuthPage(): React.ReactElement {
  return (
    <>
      <AuthForm />
      <ResetPasswordModal />
    </>
  );
}
