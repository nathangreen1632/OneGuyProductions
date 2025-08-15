import React, {useEffect, useMemo, useState} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import md5 from 'blueimp-md5';
import {Bell, LogIn, LogOut, ShieldCheck, UserSquare2} from 'lucide-react';
import type {AuthState} from '../types/authState.types';
import {type NavLink, navLinks} from '../constants/navLinks';
import {useAppStore} from '../store/useAppStore';
import {type TAuthStateType, useAuthStore} from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import {logoutUser} from '../helpers/logoutHelper';
import {useNotificationStore} from '../store/useNotificationStore';
import NavbarView from '../jsx/navbarView';
import RedInfoIcon from './RedInfoIcon.tsx';
import GravatarModal from '../modals/GravatarModal';
import InboxModal from '../modals/InboxModal';

function getGravatarUrl(email?: string): string {
  if (!email) return '';
  const normalized: string = email.trim().toLowerCase();
  const hash: string = md5(normalized);
  return `https://www.gravatar.com/avatar/${hash}?s=128&d=identicon&r=g`;
}

export default function NavbarLogic(): React.ReactElement {
  const navigate: ReturnType<typeof useNavigate> = useNavigate();
  const loc = useLocation();

  const [isInboxOpen, setIsInboxOpen] = useState<boolean>(false);

  const { menuOpen, toggleMenu, closeMenu } = useAppStore();

  useEffect((): void => { closeMenu(); }, [location.pathname, closeMenu]);

  const HIDE_ON_ADMIN = useMemo<Set<string>>(
    (): Set<string> => new Set<string>(['Products', 'About', 'Contact', 'Order', 'My Portal', 'Home']),
    []
  );
  const HIDE_ON_PORTAL = useMemo<Set<string>>(
    (): Set<string> => new Set<string>([]),
    []
  );

  useEffect((): (() => void) | void => {
    const isAuthenticated: boolean = useAuthStore.getState().isAuthenticated;
    const hydrated: boolean = useAuthStore.getState().hydrated;
    if (!hydrated || !isAuthenticated) return;

    let cancelled: boolean = false;

    const load: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch('/api/order/inbox?unreadOnly=1', { credentials: 'include' });
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          useNotificationStore.getState().set(data);
        }
      } catch (e) {
        console.error('❌ inbox hydrate failed', e);
      }
    };

    void load();
    const id: number = window.setInterval((): void => { void load(); }, 30000);
    return (): void => { cancelled = true; window.clearInterval(id); };
  }, [
    useAuthStore((s: TAuthStateType): boolean => s.hydrated),
    useAuthStore((s: TAuthStateType): boolean => s.isAuthenticated),
  ]);

  const isAuthenticated: boolean = useAuthStore((state: AuthState): boolean => state.isAuthenticated);
  const hydrated: boolean = useAuthStore((state: AuthState): boolean => state.hydrated);
  const user: { username?: string; email?: string } | null = useAuthStore((state: AuthState) => state.user);
  const logout: () => void = useAuthStore((state: AuthState): (() => void) => state.logout);

  const [isGravatarModalOpen, setIsGravatarModalOpen] = useState<boolean>(false);

  const dynamicLinks: NavLink[] = useMemo<NavLink[]>((): NavLink[] => {
    const base: NavLink[] = navLinks.slice();
    const extras: NavLink[] = [];

    if (hydrated && isAuthenticated) {
      extras.push({ label: 'My Portal', path: '/portal', icon: UserSquare2 } as NavLink);

      const isCompanyEmail: boolean = !!user?.email && user.email.toLowerCase().endsWith('@oneguyproductions.com');
      if (isCompanyEmail) {
        extras.push({ label: 'Admin', path: '/admin/orders', icon: ShieldCheck } as NavLink);
      }

      extras.push({
        label: 'Inbox',
        path: '#',
        icon: Bell,
        onClick: (): void => setIsInboxOpen(true),
      } as NavLink);

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
    } else if (hydrated && !isAuthenticated) {
      extras.push({ label: 'Login / Register', path: '/auth', icon: LogIn } as NavLink);
    }

    const merged: NavLink[] = [...base, ...extras];
    const deduped: NavLink[] = Array.from(new Map(merged.map((l: NavLink): [string, NavLink] => [`${l.label}|${l.path}`, l])).values());

    const isAdminRoute: boolean = loc.pathname.startsWith('/admin');
    const isPortalRoute: boolean = loc.pathname.startsWith('/portal');

    let scoped: NavLink[] = deduped;
    if (isAdminRoute) scoped = scoped.filter((l: NavLink): boolean => !HIDE_ON_ADMIN.has(l.label));
    if (isPortalRoute) scoped = scoped.filter((l: NavLink): boolean => !HIDE_ON_PORTAL.has(l.label));

    const logoutIndex2: number = scoped.findIndex((l: NavLink): boolean => l.label === 'Logout');
    if (logoutIndex2 > -1) {
      const [logoutLink2] = scoped.splice(logoutIndex2, 1);
      scoped.push(logoutLink2);
    }

    return scoped;
  }, [isAuthenticated, user?.email, logout, navigate, hydrated, loc.pathname, HIDE_ON_ADMIN, HIDE_ON_PORTAL]);

  return (
    <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-md">
      <NavbarView
        key={`${hydrated ? 'h1' : 'h0'}-${isAuthenticated ? 'auth' : 'anon'}`}
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

            <InboxModal
              open={isInboxOpen}
              onClose={(): void => setIsInboxOpen(false)}
              onNavigateToOrder={(orderId: number): void => {
                try { useOrderStore.getState().setView('timeline'); } catch {}
                window.location.assign(`/portal#order-${orderId}`);
              }}
            />

            <img src={getGravatarUrl(user.email)} alt="User Avatar" className="w-12 h-12 rounded-full" />

            <button
              type="button"
              onClick={(): void => setIsGravatarModalOpen(true)}
              className="cursor-pointer hover:opacity-80"
              aria-label="Learn how to change your Gravatar"
            >
              <RedInfoIcon size={16} strokeWidth={2.5} />
            </button>

            <GravatarModal isOpen={isGravatarModalOpen} onClose={(): void => setIsGravatarModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
