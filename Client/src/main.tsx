import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { injectRecaptchaScriptHelper } from './helpers/injectRecaptchaScriptHelper.ts';

const siteKey: string | undefined = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (siteKey) {
  injectRecaptchaScriptHelper(siteKey);
} else {
  console.error('❌ Missing VITE_RECAPTCHA_SITE_KEY in environment.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <App />
  </StrictMode>,
);
