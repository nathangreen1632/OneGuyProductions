import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface Props {
  children: React.ReactElement;
}

export default function ProtectedRouteLogic({ children }: Readonly<Props>): React.ReactElement {
  const { isAuthenticated, hydrated, user } = useAuthStore();
  const location = useLocation();

  // ✅ Log Zustand state at the moment this component evaluates
  console.log('🔐 ProtectedRoute auth state:', {
    isAuthenticated,
    hydrated,
    user,
    currentPath: location.pathname,
  });

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] text-lg text-[var(--theme-text)]">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
