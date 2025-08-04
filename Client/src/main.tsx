// Client/src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { injectRecaptchaScript } from './utils/injectRecaptchaScript.ts'; // ✅ NEW IMPORT

const siteKey: string | undefined = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (siteKey) {
  injectRecaptchaScript(siteKey); // 🔐 Inject reCAPTCHA before app renders
} else {
  console.error('❌ Missing VITE_RECAPTCHA_SITE_KEY in environment.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <App />
  </StrictMode>,
);
