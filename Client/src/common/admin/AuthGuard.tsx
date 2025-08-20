import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {type TAuthStateType, type TAuthUserType, useAuthStore} from '../../store/useAuth.store';
import toast from 'react-hot-toast';

type Role = 'user' | 'pending-admin' | 'admin';

function isReactElement(node: unknown): node is React.ReactElement {
  return Boolean(node) && typeof node === 'object' && 'type' in (node as any) && 'props' in (node as any);
}

export function AdminGuard({ children }: Readonly<{ children: React.ReactElement }>): React.ReactElement {
  const authState: TAuthStateType = useAuthStore();

  const isAuthenticated: boolean =
    typeof authState?.isAuthenticated === 'boolean' ? authState.isAuthenticated : false;

  const user: TAuthUserType | null = authState?.user ?? null;

  const domainOk: boolean = useMemo((): boolean => {
    try {
      const role = (user?.role ?? undefined) as Role | undefined;
      const verified: boolean = Boolean(user?.emailVerified);

      return role === 'admin' && verified;

    } catch (err) {
      console.error('AdminGuard: error while checking admin eligibility', err);
      toast.error('AdminGuard: error while checking admin eligibility');
      return false;
    }
  }, []);

  if (!isReactElement(children)) {
    console.warn('AdminGuard: invalid children element');
    toast.error('AdminGuard: invalid children element');
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated || !domainOk) {
    return <Navigate to="/" replace />;
  }

  return children;
}
