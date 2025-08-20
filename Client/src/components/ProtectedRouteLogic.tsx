import React from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuth.store';

interface Props {
  children: React.ReactElement;
}

function buildSafeReturnTo(loc: ReturnType<typeof useLocation>): string | null {
  try {
    const path: string = String(loc?.pathname ?? '');
    const search: string = String(loc?.search ?? '');
    if (!path) return null;

    const combined = `${path}${search}`;
    if (!combined.startsWith('/')) return null;

    return encodeURIComponent(combined);
  } catch (err) {
    console.warn('ProtectedRoute: failed to compute returnTo.', err);
    return null;
  }
}

export default function ProtectedRouteLogic({ children }: Readonly<Props>): React.ReactElement {
  let isAuthenticated: boolean = false;
  let hydrated: boolean = false;

  try {
    const store = useAuthStore();
    isAuthenticated = Boolean(store?.isAuthenticated);
    hydrated = Boolean(store?.hydrated);
  } catch (err) {
    console.error('ProtectedRoute: failed to read auth store.', err);
    toast.error('Unable to read session state.');
  }

  const location = useLocation();

  try {
    if (!hydrated) {
      return (
        <div className="flex items-center justify-center min-h-[85vh] text-lg text-[var(--theme-text)]">
          Checking your session...
        </div>
      );
    }

    if (!isAuthenticated) {
      const rt: string | null = buildSafeReturnTo(location);
      const target: string = rt ? `/auth?returnTo=${rt}` : '/auth';
      return <Navigate to={target} replace />;
    }

    if (!React.isValidElement(children)) {
      console.error('ProtectedRoute: children is not a valid React element.');
      toast.error('Internal error rendering protected content.');
      return (
        <div className="flex items-center justify-center min-h-[60vh] text-[var(--theme-text)]">
          Unable to render content.
        </div>
      );
    }

    return children;
  } catch (err) {
    console.error('ProtectedRoute: unexpected error.', err);
    toast.error('Unexpected error loading page.');
    return <Navigate to="/auth" replace />;
  }
}
