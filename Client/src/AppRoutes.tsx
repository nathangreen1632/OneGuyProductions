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
import { AdminGuard } from './helpers/authGuard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';

export default function AppRoutes(): React.ReactElement {
  const { setUser, setHydrated, isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal,
        });

        // Non-OK or No Content → just mark hydrated and exit quietly
        if (!res.ok || res.status === 204) {
          if (!cancelled) setHydrated(true);
          return;
        }

        // Must be JSON to parse
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          if (!cancelled) setHydrated(true);
          return;
        }

        // Defensive: avoid JSON parse error on empty body
        const text = await res.text();
        if (!text) {
          if (!cancelled) setHydrated(true);
          return;
        }

        const data = JSON.parse(text);
        if (res.ok && data?.user && !cancelled) {
          setUser(data.user, null); // token via HttpOnly cookie
        }
      } catch {
        // Swallow errors; we only hydrate state, not block the UI
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [setUser, setHydrated, hydrated]);

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

      {/* 🔐 Admin Portal (guarded by domain) */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminOrdersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
