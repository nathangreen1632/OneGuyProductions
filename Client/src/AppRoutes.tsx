import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import OrderPage from './pages/OrderPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthPage from './pages/AuthPage';
import ProtectedRouteLogic from './components/ProtectedRouteLogic';
import { useAuthStore } from './store/useAuthStore';

export default function AppRoutes(): React.ReactElement {
  const { setUser, setHydrated, isAuthenticated, hydrated } = useAuthStore();


  useEffect((): void => {
    async function hydrateSession(): Promise<void> {
      try {
        const res: Response = await fetch('/api/auth/me', {
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

  const routeKey = `${hydrated}-${isAuthenticated}`;

  return (
    <Routes key={routeKey}>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/portal"
        element={
          <ProtectedRouteLogic>
            <CustomerPortalPage />
          </ProtectedRouteLogic>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
