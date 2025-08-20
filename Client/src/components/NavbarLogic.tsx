import React, {type RefObject, type SyntheticEvent, useEffect, useMemo, useRef, useState} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import md5 from 'blueimp-md5';
import toast from 'react-hot-toast';
import { Bell, LogIn, LogOut, ShieldCheck, UserSquare2 } from 'lucide-react';
import type { AuthState } from '../types/authState.types';
import { type NavLink, navLinks } from '../constants/navLinks';
import { useAppStore } from '../store/useApp.store';
import { type TAuthStateType, useAuthStore } from '../store/useAuth.store';
import { useOrderStore } from '../store/useOrder.store';
import { logoutUser } from '../helpers/logout.helper';
import { useNotificationStore } from '../store/useNotification.store';
import NavbarView from '../jsx/navbarView';
import RedInfoIcon from '../common/RedInfoIcon';
import GravatarModal from '../modals/GravatarModal';
import InboxModal from '../modals/InboxModal';

function getGravatarUrl(email?: string): string {
  try {
    if (!email) return '';
    const normalized: string = email.trim().toLowerCase();
    if (!normalized) return '';
    const hash: string = md5(normalized);
    return `https://www.gravatar.com/avatar/${hash}?s=128&d=identicon&r=g`;
  } catch (err) {
    console.warn('Navbar: failed to compute Gravatar URL.', err);
    return '';
  }
}

export default function NavbarLogic(): React.ReactElement {
  const navigate = useNavigate();
  const loc = useLocation();

  const [isInboxOpen, setIsInboxOpen] = useState<boolean>(false);
  const [isGravatarModalOpen, setIsGravatarModalOpen] = useState<boolean>(false);

  const { menuOpen, toggleMenu, closeMenu } = useAppStore();

  useEffect((): void => {
    try {
      closeMenu();
    } catch (err) {
      console.error('Navbar: failed to close menu on route change.', err);
      toast.error('Menu state error.');
    }
  }, [loc.pathname, closeMenu]);

  const HIDE_ON_ADMIN: Set<string> = useMemo(
    (): Set<string> => new Set<string>(['Products', 'About', 'Contact', 'Order', 'My Portal', 'Home']),
    []
  );
  const HIDE_ON_PORTAL: Set<string> = useMemo(
    (): Set<string> => new Set<string>([]),
    []
  );

  useEffect((): (() => void) | void => {
    try {
      const { isAuthenticated, hydrated }: TAuthStateType = useAuthStore.getState();
      if (!hydrated || !isAuthenticated) return;

      let cancelled: boolean = false;
      let notifiedOnce: boolean = false;

      const load: () => Promise<void> = async (): Promise<void> => {
        try {
          const res: Response = await fetch('/api/order/inbox?unreadOnly=1', { credentials: 'include' });
          let data: unknown;
          try {
            data = await res.json();
          } catch {
            data = [];
          }
          if (!cancelled && Array.isArray(data)) {
            useNotificationStore.getState().set(data);
          }
        } catch (e) {
          console.error('Navbar: inbox hydrate failed.', e);
          if (!notifiedOnce) {
            toast.error('Failed to refresh inbox.');
            notifiedOnce = true;
          }
        }
      };

      void load();
      const id: number = window.setInterval((): undefined => void load(), 30_000);

      return (): void => {
        cancelled = true;
        try {
          window.clearInterval(id);
        } catch (err) {
          console.warn('Navbar: failed to clear inbox interval.', err);
        }
      };
    } catch (err) {
      console.error('Navbar: unexpected error in inbox effect.', err);
      toast.error('Inbox initialization error.');
      return;
    }
  }, [
    useAuthStore((s: TAuthStateType): boolean => s.hydrated),
    useAuthStore((s: TAuthStateType): boolean => s.isAuthenticated),
  ]);

  const isAuthenticated: boolean = useAuthStore((state: AuthState): boolean => state.isAuthenticated);
  const hydrated: boolean = useAuthStore((state: AuthState): boolean => state.hydrated);
  const user: { username?: string; email?: string } | null = useAuthStore((state: AuthState): { username?: string; email?: string } | null => state.user);
  const logout: () => void = useAuthStore((state: AuthState): (() => void) => state.logout);

  const dynamicLinks: NavLink[] = useMemo<NavLink[]>((): NavLink[] => {
    try {
      const base: NavLink[] = navLinks.slice();
      const extras: NavLink[] = [];

      if (hydrated && isAuthenticated) {
        extras.push({ label: 'My Portal', path: '/portal', icon: UserSquare2 } as NavLink);

        const email: string = (user?.email ?? '').toLowerCase();
        const isCompanyEmail: boolean = Boolean(email) && email.endsWith('@oneguyproductions.com');
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
            try {
              const success: boolean = await logoutUser();
              if (success) {
                try {
                  logout();
                } catch (err) {
                  console.warn('Navbar: local logout state update failed.', err);
                }
                navigate('/auth');
              } else {
                toast.error('Logout failed. Please try again.');
              }
            } catch (err) {
              console.error('Navbar: error during logout flow.', err);
              toast.error('Unexpected error while logging out.');
            }
          },
        } as NavLink);
      } else if (hydrated && !isAuthenticated) {
        extras.push({ label: 'Login / Register', path: '/auth', icon: LogIn } as NavLink);
      }

      const merged: NavLink[] = [...base, ...extras];
      const deduped: NavLink[] = Array.from(
        new Map(merged.map((l: NavLink): [string, NavLink] => [`${l.label}|${l.path}`, l])).values()
      );

      const isAdminRoute: boolean = loc.pathname.startsWith('/admin');
      const isPortalRoute: boolean = loc.pathname.startsWith('/portal');

      let scoped: NavLink[] = deduped;
      if (isAdminRoute) scoped = scoped.filter((l: NavLink): boolean => !HIDE_ON_ADMIN.has(l.label));
      if (isPortalRoute) scoped = scoped.filter((l: NavLink): boolean => !HIDE_ON_PORTAL.has(l.label));

      const logoutIndex: number = scoped.findIndex((l: NavLink): boolean => l.label === 'Logout');
      if (logoutIndex > -1) {
        const [logoutLink] = scoped.splice(logoutIndex, 1);
        scoped.push(logoutLink);
      }

      return scoped;
    } catch (err) {
      console.error('Navbar: failed to compute dynamic links.', err);
      toast.error('Navigation error.');
      return navLinks;
    }
  }, [isAuthenticated, user?.email, logout, navigate, hydrated, loc.pathname, HIDE_ON_ADMIN, HIDE_ON_PORTAL]);

  const assigningRef: RefObject<boolean> = useRef(false);

  return (
    <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-md">
      <NavbarView
        key={`${hydrated ? 'h1' : 'h0'}-${isAuthenticated ? 'auth' : 'anon'}`}
        navLinks={dynamicLinks}
        menuOpen={menuOpen}
        toggleMenu={(): void => {
          try {
            toggleMenu();
          } catch (err) {
            console.error('Navbar: toggleMenu failed.', err);
            toast.error('Menu toggle failed.');
          }
        }}
        closeMenu={(): void => {
          try {
            closeMenu();
          } catch (err) {
            console.error('Navbar: closeMenu failed.', err);
            toast.error('Menu close failed.');
          }
        }}
      />

      {hydrated && isAuthenticated && user && (
        <div className="flex justify-end px-6 pt-4 pb-2 text-xs text-[var(--theme-text)] relative">
          <div className="flex items-center gap-3">
            <span className="relative text-lg font-semibold text-[var(--theme-text)]">
              Logged In As{' '}
              <span className="font-semibold text-[var(--theme-border-red)]">
                {user.username ?? 'User'}
              </span>
            </span>

            <InboxModal
              open={isInboxOpen}
              onClose={(): void => setIsInboxOpen(false)}
              onNavigateToOrder={(orderId: number): void => {
                try {
                  if (!Number.isFinite(orderId) || orderId <= 0) {
                    console.warn('Navbar: invalid orderId for navigation.', orderId);
                    toast.error('Invalid order id.');
                    return;
                  }
                  try {
                    useOrderStore.getState().setView('timeline');
                  } catch (err) {
                    console.warn('Navbar: failed to set order view state.', err);
                  }
                  assigningRef.current = true;
                  window.location.assign(`/portal#order-${orderId}`);
                } catch (err) {
                  console.error('Navbar: window.location.assign failed, using navigate.', err);
                  assigningRef.current = false;
                  try {
                    navigate(`/portal#order-${orderId}`);
                  } catch (navErr) {
                    console.error('Navbar: navigate fallback failed.', navErr);
                    toast.error('Navigation failed.');
                  }
                }
              }}
            />

            <img
              src={getGravatarUrl(user.email)}
              alt="User Avatar"
              className="w-12 h-12 rounded-full"
              onError={(ev: SyntheticEvent<HTMLImageElement, Event>): void => {
                try {
                  (ev.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                } catch (err) {
                  console.error('Navbar: failed to hide image on error.', err);
                  toast.error('Avatar loading error.');
                }
              }}
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
