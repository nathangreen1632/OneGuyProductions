import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import OrderPage from './pages/OrderPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import NotFoundPage from './pages/NotFoundPage';

// Optional: import auth store and protect portal route
// import { useAuthStore } from './store/useAuthStore';

export default function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/portal" element={<CustomerPortalPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


// <Route
//   path="/portal"
//   element={
//     <ProtectedRoute>
//       <CustomerPortalPage />
//     </ProtectedRoute>
//   }
// />