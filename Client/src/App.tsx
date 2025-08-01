import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './AppRoutes';
import { loadRecaptcha } from './utils/loadRecaptcha';

export default function App(): React.ReactElement {
  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      loadRecaptcha(siteKey);
    } else {
      console.error('❌ No reCAPTCHA site key found');
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
        <Navbar />
        <main className="flex-grow">
          <AppRoutes />
        </main>
        <Footer />
        <Toaster position="top-center" />
      </div>
    </BrowserRouter>
  );
}
