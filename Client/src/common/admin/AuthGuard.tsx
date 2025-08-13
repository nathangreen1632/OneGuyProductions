import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function AdminGuard({ children }: Readonly<{ children: React.ReactElement }>): React.ReactElement {
  const { user, isAuthenticated } = useAuthStore();

  // Server-truth: only verified admins get in
  const domainOk: boolean = useMemo((): boolean => {
    const role = user?.role as 'user' | 'pending-admin' | 'admin' | undefined;
    const verified = Boolean(user?.emailVerified);
    return role === 'admin' && verified;
  }, [user?.role, user?.emailVerified]);

  if (!isAuthenticated || !domainOk) {
    return <Navigate to="/" replace />;
  }
  return children;
}
