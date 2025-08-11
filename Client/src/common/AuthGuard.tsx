import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function AdminGuard({ children }: Readonly<{ children: React.ReactElement }>): React.ReactElement {
  const { user, isAuthenticated } = useAuthStore();

  const domainOk: boolean = useMemo((): boolean => {
    const email: string = user?.email?.toLowerCase() ?? '';
    return email.endsWith('@oneguyproductions.com');
  }, [user?.email]);

  if (!isAuthenticated || !domainOk) {
    return <Navigate to="/" replace />;
  }
  return children;
}
