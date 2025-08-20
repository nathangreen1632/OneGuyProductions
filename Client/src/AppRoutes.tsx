import React, {type ReactElement} from 'react';
import { useRoutes } from 'react-router-dom';
import { useAuthStore } from './store/useAuth.store';
import { useSessionHydration } from './hooks/useSessionHydration';
import publicRoutes from './routes/PublicRoutes';
import adminRoutes from './routes/AdminRoutes';
import NotFoundPage from './pages/NotFoundPage';

export default function AppRoutes(): React.ReactElement {
  useSessionHydration();
  const { hydrated, isAuthenticated } = useAuthStore();
  const routeKey = `${hydrated}-${isAuthenticated}`;

  const element: ReactElement | null = useRoutes([
    ...publicRoutes,
    ...adminRoutes,
    { path: '*', element: <NotFoundPage /> },
  ]);

  return <div key={routeKey}>{element}</div>;
}

