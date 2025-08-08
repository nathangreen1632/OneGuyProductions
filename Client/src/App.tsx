import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import NavbarLogic from './components/NavbarLogic.tsx';
import Footer from './common/Footer.tsx';
import AppRoutes from './AppRoutes';
import ResetPasswordModal from './modals/ResetPasswordModal.tsx';
import EditOrderModal from './modals/EditOrderModal.tsx';

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
        <NavbarLogic />
        <main className="flex-grow bg-[var(--theme-bg)] text-[var(--theme-text)]">
          <AppRoutes />
        </main>
        <Footer />
        <ResetPasswordModal />
        <EditOrderModal />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--theme-surface)',
              color: 'var(--theme-text)',
              border: '1px solid var(--theme-border)',
              boxShadow: '0 4px 14px 0 var(--theme-shadow)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}
