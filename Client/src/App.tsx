// Client/src/App.tsx

console.log('🧠 App.tsx mounted');

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './AppRoutes';

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
        <Navbar />
        <main className="flex-grow bg-[var(--theme-bg)] text-[var(--theme-text)]">
          <AppRoutes />
        </main>
        <Footer />
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
