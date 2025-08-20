import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { injectRecaptchaScriptHelper } from './helpers/injectRecaptchaScript.helper';
import { RECAPTCHA_SITE_KEY } from './constants/env';

if (RECAPTCHA_SITE_KEY) {
  injectRecaptchaScriptHelper(RECAPTCHA_SITE_KEY);
} else {
  console.error('❌ Missing VITE_RECAPTCHA_SITE_KEY in environment.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <App />
  </StrictMode>,
);
