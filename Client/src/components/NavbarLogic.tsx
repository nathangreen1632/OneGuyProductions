import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import md5 from 'blueimp-md5';
import { LogIn, LogOut, ShieldCheck, UserSquare2 } from 'lucide-react';
import type { AuthState } from '../types/authState.types';
import { type NavLink, navLinks } from '../constants/navLinks';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { logoutUser } from '../helpers/logoutHelper';
import NavbarView from '../jsx/navbarView';
import RedInfoIcon from './RedInfoIcon.tsx';
import GravatarModal from '../modals/GravatarModal';

function getGravatarUrl(email?: string): string {
  if (!email) return '';
  const normalized: string = email.trim().toLowerCase();
  const hash: string = md5(normalized);
  return `https://www.gravatar.com/avatar/${hash}?s=128&d=identicon&r=g`;
}

export default function NavbarLogic(): React.ReactElement {
  const navigate: ReturnType<typeof useNavigate> = useNavigate();

  const {
    menuOpen,
    toggleMenu,
    closeMenu,
  }: { menuOpen: boolean; toggleMenu: () => void; closeMenu: () => void } = useAppStore();

  useEffect((): void => { closeMenu(); }, [location.pathname, closeMenu]);

  const isAuthenticated: boolean = useAuthStore((state: AuthState): boolean => state.isAuthenticated);
  const hydrated: boolean = useAuthStore((state: AuthState): boolean => state.hydrated);
  const user: { username?: string; email?: string } | null = useAuthStore((state: AuthState) => state.user);
  const logout: () => void = useAuthStore((state: AuthState): (() => void) => state.logout);

  const [isGravatarModalOpen, setIsGravatarModalOpen] = useState<boolean>(false);

  const dynamicLinks: NavLink[] = useMemo<NavLink[]>((): NavLink[] => {
    const base: NavLink[] = navLinks.slice();

    const extras: NavLink[] = [];

    extras.push(
      isAuthenticated
        ? ({ label: 'My Portal', path: '/portal', icon: UserSquare2 } as NavLink)
        : ({ label: 'Login / Register', path: '/auth', icon: LogIn } as NavLink)
    );

    const isCompanyEmail: boolean = !!user?.email && user.email.toLowerCase().endsWith('@oneguyproductions.com');
    if (isAuthenticated && isCompanyEmail) {
      extras.push({ label: 'Admin', path: '/admin/orders', icon: ShieldCheck } as NavLink);
    }

    if (isAuthenticated) {
      extras.push({
        label: 'Logout',
        path: '#',
        icon: LogOut,
        onClick: async (): Promise<void> => {
          const success: boolean = await logoutUser();
          if (success) {
            logout();
            navigate('/auth');
          }
        },
      } as NavLink);
    }

    return [...base, ...extras] as NavLink[];
  }, [isAuthenticated, user?.email, logout, navigate]);

  return (
    <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-md">
      <NavbarView
        navLinks={dynamicLinks}
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        closeMenu={closeMenu}
      />

      {hydrated && isAuthenticated && user && (
        <div className="flex justify-end px-6 pt-4 pb-2 text-xs text-[var(--theme-text)] relative">
          <div className="flex items-center gap-3">
            <span className="relative text-lg font-semibold text-[var(--theme-text)]">
              Logged In As{' '}
              <span className="font-semibold text-[var(--theme-border-red)]">
                {user.username}
              </span>
            </span>

            <img
              src={getGravatarUrl(user.email)}
              alt="User Avatar"
              className="w-12 h-12 rounded-full"
            />

            <button
              type="button"
              onClick={(): void => setIsGravatarModalOpen(true)}
              className="cursor-pointer hover:opacity-80"
              aria-label="Learn how to change your Gravatar"
            >
              <RedInfoIcon size={16} strokeWidth={2.5} />
            </button>

            <GravatarModal
              isOpen={isGravatarModalOpen}
              onClose={(): void => setIsGravatarModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
