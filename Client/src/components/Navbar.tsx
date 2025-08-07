import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { type NavLink, navLinks } from '../constants/navLinks';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import NavbarView from '../jsx/navbarView';
import { LogIn, LogOut, UserSquare2, HelpCircle } from 'lucide-react';
import { logoutUser } from '../utils/logout';
import GravatarModal from './GravatarModal';

function getGravatarUrl(email?: string): string {
  if (!email) return '';
  const hash = email.trim().toLowerCase();
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

export default function Navbar(): React.ReactElement {
  const location: Location = useLocation();
  const navigate = useNavigate();
  const { menuOpen, toggleMenu, closeMenu } = useAppStore();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isGravatarModalOpen, setIsGravatarModalOpen] = useState(false);

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
            logout();
            navigate('/auth');
          }
        },
      });
    }

    return [...filtered, ...extras];
  }, [isAuthenticated, logout, navigate]);

  return (
    <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-md">
      <NavbarView
        location={location}
        navLinks={dynamicLinks}
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        closeMenu={closeMenu}
      />

      {/* ✅ User profile display */}
      {hydrated && isAuthenticated && user && (
        <div className="flex justify-end px-6 pt-4 text-xs text-[var(--theme-text)] relative">
          <div className="flex items-center gap-3">
            <span className="font-semibold">
              Logged In: {user.username || user.email}
            </span>

            {/* Gravatar */}
            <img
              src={getGravatarUrl(user.email)}
              alt="User Avatar"
              className="w-8 h-8 rounded-full"
            />

            {/* Tooltip Icon opens modal instead */}
            <button
              type="button"
              onClick={() => setIsGravatarModalOpen(true)}
              className="text-[var(--theme-accent)] hover:opacity-80"
              aria-label="Learn how to change your Gravatar"
            >
              <HelpCircle size={16} />
            </button>

            {/* Gravatar Modal */}
            <GravatarModal
              isOpen={isGravatarModalOpen}
              onClose={() => setIsGravatarModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
