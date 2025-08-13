import type { RouteObject } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ProductsPage from '../pages/ProductsPage';
import OrderPage from '../pages/OrderPage';
import ContactPage from '../pages/ContactPage';
import AboutPage from '../pages/AboutPage';
import AuthPage from '../pages/AuthPage';
import CustomerPortalPage from '../pages/CustomerPortalPage';
import ProtectedRouteLogic from '../components/ProtectedRouteLogic';

const publicRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/order', element: <OrderPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/auth', element: <AuthPage /> },
  {
    path: '/portal',
    element: (
      <ProtectedRouteLogic>
        <CustomerPortalPage />
      </ProtectedRouteLogic>
    ),
  },
];

export default publicRoutes;
