import React from 'react';
import {
  Home,
  Box,
  Info,
  Mail,
  ShoppingBag,
  LogIn,
  UserSquare2,
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
  { label: 'Login / Register', path: '/auth', icon: LogIn },
  { label: 'My Portal', path: '/portal', icon: UserSquare2 },
];
