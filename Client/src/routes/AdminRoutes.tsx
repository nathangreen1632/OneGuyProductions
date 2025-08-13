import type { RouteObject } from 'react-router-dom';
import { AdminGuard } from '../common/admin/AuthGuard.tsx';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';

const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, element: <AdminOrdersPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
    ],
  },
];

export default adminRoutes;
