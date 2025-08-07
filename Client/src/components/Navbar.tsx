import React, { useMemo } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { type NavLink, navLinks } from '../constants/navLinks';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import NavbarView from '../jsx/navbarView';
import { LogIn, LogOut, UserSquare2 } from 'lucide-react';
import { logoutUser } from '../utils/logout';

export default function Navbar(): React.ReactElement {
  const location: Location = useLocation();
  const navigate = useNavigate();
  const { menuOpen, toggleMenu, closeMenu } = useAppStore();

  // ✅ Make Zustand values reactive
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const dynamicLinks: NavLink[] = useMemo(() => {
    const filtered = navLinks.filter(
      (link) => link.path !== '/auth' && link.path !== '/portal'
    );

    const extras: NavLink[] = [];

    extras.push(
      isAuthenticated
        ? { label: 'My Portal', path: '/portal', icon: UserSquare2 }
        : { label: 'Login / Register', path: '/auth', icon: LogIn }
    );

    if (isAuthenticated) {
      extras.push({
        label: 'Logout',
        path: '#',
        icon: LogOut,
        onClick: async () => {
          const success = await logoutUser();
          if (success) {
            logout(); // Zustand
            navigate('/auth');
          }
        },
      });
    }

    return [...filtered, ...extras];
  }, [isAuthenticated, logout, navigate]);

  return (
    <NavbarView
      location={location}
      navLinks={dynamicLinks}
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      closeMenu={closeMenu}
    />
  );
}
