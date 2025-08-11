import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import { AdminGuard } from './common/AuthGuard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';

const nextPathForEmail = (email: string): string => {
  const e = (email || '').toLowerCase().trim();
  return e.endsWith('@oneguyproductions.com') ? '/admin/orders' : '/portal';
};

export default function AppRoutes(): React.ReactElement {
  const { setUser, setHydrated, isAuthenticated, hydrated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

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

        if (!res.ok || res.status === 204) {
          if (!cancelled) setHydrated(true);
          return;
        }

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          if (!cancelled) setHydrated(true);
          return;
        }

        const text = await res.text();
        if (!text) {
          if (!cancelled) setHydrated(true);
          return;
        }

        const data = JSON.parse(text);
        if (res.ok && data?.user && !cancelled) {
          setUser(data.user, null);
        }

        const email = (data?.user?.email ?? '') as string;

        const isEntry = location.pathname === '/' || location.pathname === '/auth';
        if (isEntry) {
          const dest = nextPathForEmail(email);
          navigate(dest, { replace: true });
        }

      } catch {
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
