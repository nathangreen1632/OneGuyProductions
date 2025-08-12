import React from 'react';
import { useRoutes } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useSessionHydration } from './hooks/useSessionHydration';
import publicRoutes from './routes/PublicRoutes';
import adminRoutes from './routes/AdminRoutes';
import NotFoundPage from './pages/NotFoundPage';

export default function AppRoutes(): React.ReactElement {
  useSessionHydration();
  const { hydrated, isAuthenticated } = useAuthStore();
  const routeKey = `${hydrated}-${isAuthenticated}`;

  const element = useRoutes([
    ...publicRoutes,
    ...adminRoutes,
    { path: '*', element: <NotFoundPage /> },
  ]);

  return <div key={routeKey}>{element}</div>;
}

