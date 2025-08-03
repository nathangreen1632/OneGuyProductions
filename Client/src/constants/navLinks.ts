import React from 'react';
import {
  Home,
  Box,
  Info,
  Mail,
  ShoppingBag,
} from 'lucide-react';

export interface NavLink {
  label: string;
  path: string;
  icon?: React.ElementType;
}

export const navLinks: NavLink[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Products', path: '/products', icon: Box },
  { label: 'About', path: '/about', icon: Info },
  { label: 'Contact', path: '/contact', icon: Mail },
  { label: 'Order', path: '/order', icon: ShoppingBag },
];
