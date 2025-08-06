import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import OrderPage from './pages/OrderPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthPage from './pages/Auth';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';

export default function AppRoutes(): React.ReactElement {
  const { setUser, setHydrated, user, isAuthenticated, hydrated } = useAuthStore();

  // ✅ This is what you're looking for:
  console.log('auth:', { isAuthenticated, hydrated, user });

  useEffect(() => {
    async function hydrateSession() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        const data = await res.json();

        if (res.ok && data.user) {
          setUser(data.user, null); // token is handled via HttpOnly cookie
        }
      } catch (err) {
        console.error('Session hydration failed:', err);
      } finally {
        setHydrated(true);
      }
    }

    hydrateSession().catch(console.error);
  }, [setUser, setHydrated]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <CustomerPortalPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}