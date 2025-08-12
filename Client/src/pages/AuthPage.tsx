import React from 'react';
import { useLocation } from 'react-router-dom';
import AuthForm from '../components/AuthFormLogic';
import AdminVerifyLogic from '../components/admin/AdminVerifyLogic';
import ResetPasswordModal from '../modals/ResetPasswordModal';

export default function AuthPage(): React.ReactElement {
  const location = useLocation();
  const mode: string | null = new URLSearchParams(location.search).get('mode');

  return (
    <>
      {mode === 'verify-admin' ? <AdminVerifyLogic /> : <AuthForm />}
      <ResetPasswordModal />
    </>
  );
}
