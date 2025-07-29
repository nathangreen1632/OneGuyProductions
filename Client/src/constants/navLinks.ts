import React from 'react';
import { Mail, ShoppingBag } from 'lucide-react';

export interface NavLink {
  label: string;
  path: string;
  icon?: React.ElementType;
}

export const navLinks: NavLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact', icon: Mail },
  { label: 'Order', path: '/order', icon: ShoppingBag },
];
