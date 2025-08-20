import React, { type ReactElement } from 'react';
import { Link, NavLink, type NavLinkRenderProps, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import type { NavLink as INavLink } from '../constants/navLinks';
import type NavbarViewProps from '../types/navbarProps.types';
import { useNotificationStore } from '../store/useNotification.store';

type NotificationStoreState = ReturnType<typeof useNotificationStore.getState>;

export default function NavbarView({
                                     navLinks,
                                     menuOpen,
                                     toggleMenu,
                                     closeMenu,
                                   }: Readonly<NavbarViewProps>): React.ReactElement {
  const loc = useLocation();

  const unreadCount: number = useNotificationStore(
    (s: NotificationStoreState): number => s.unreadCount()
  );

  const desktopLinkClass: (isActive: boolean) => string = (isActive: boolean): string =>
    `relative flex items-center gap-1 border-b-2 cursor-pointer ${
      isActive
        ? 'border-[var(--theme-border)] text-[var(--theme-border-red)]'
        : 'border-transparent'
    } hover:underline underline-offset-4 decoration-[var(--theme-border)] transition-colors duration-200`;

  const mobileLinkClass: (isActive: boolean) => string = (isActive: boolean): string =>
    `relative block py-2 ${
      isActive
        ? 'text-[var(--theme-border-red)] border-b-2 border-[var(--theme-border)]'
        : 'border-b border-transparent'
    }`;

  const renderLabel: (label: string) => ReactElement = (label: string): ReactElement => {
    const isInbox: boolean =
      label.toLowerCase() === 'inbox' || label.toLowerCase().startsWith('inbox ');

    return (
      <span className="inline-flex items-center gap-1">
        <span>{isInbox ? 'Inbox' : label}</span>
        {isInbox && unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center min-w-[16px] h-4 px-1
                       rounded-full bg-[var(--theme-border-red)] text-white text-[10px] leading-none"
          >
            {unreadCount}
          </span>
        )}
      </span>
    );
  };

  const menuAriaLabel: string =
    unreadCount > 0
      ? `Toggle menu, ${unreadCount} unread notifications`
      : 'Toggle menu';

  const menuTitle: string = unreadCount > 0 ? `${unreadCount} unread notifications` : 'Menu';

  return (
    <header className="sticky top-0 z-50 bg-[var(--theme-bg)] border-b border-[var(--theme-border-red)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-[var(--theme-accent)]">
          One Guy Productions
        </Link>

        <ul className="hidden lg:flex gap-6 text-sm font-medium">
          {navLinks.map(
            ({ label, path, icon: Icon, onClick }: INavLink, idx: number): ReactElement => {
              const key = `${path}|${label}|d${idx}`;

              if (onClick) {
                const isActive: boolean = loc.pathname === path;
                return (
                  <li key={key} className={label === 'Logout' ? 'ml-16' : ''}>
                    <button
                      type="button"
                      onClick={onClick}
                      className={desktopLinkClass(isActive)}
                    >
                      {Icon && <Icon size={18} />}
                      {renderLabel(label)}
                    </button>
                  </li>
                );
              }

              return (
                <li key={key}>
                  <NavLink
                    to={path}
                    className={({ isActive }: NavLinkRenderProps): string =>
                      desktopLinkClass(isActive)
                    }
                    end
                  >
                    {Icon && <Icon size={18} />}
                    {renderLabel(label)}
                  </NavLink>
                </li>
              );
            }
          )}
        </ul>

        <button
          onClick={toggleMenu}
          className="relative lg:hidden"
          aria-label={menuAriaLabel}
          aria-expanded={menuOpen}
          title={menuTitle}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}

          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                         rounded-full bg-[var(--theme-border-red)] text-white
                         text-[10px] leading-[18px] text-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </nav>

      {menuOpen && (
        <ul className="lg:hidden flex flex-col gap-4 px-6 pb-6 text-sm font-medium border-t border-[var(--theme-border)] bg-[var(--theme-bg)]">
          {navLinks.map(
            ({ label, path, icon: Icon, onClick }: INavLink, idx: number): ReactElement => {
              const key = `${path}|${label}|m${idx}`;

              if (onClick) {
                const isActive: boolean = loc.pathname === path;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={(): void => {
                        onClick();
                        closeMenu();
                      }}
                      className={mobileLinkClass(isActive)}
                    >
                      <span className="inline-flex items-center gap-2">
                        {Icon && <Icon size={18} />}
                        {renderLabel(label)}
                      </span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={key}>
                  <NavLink
                    to={path}
                    onClick={closeMenu}
                    className={({ isActive }: NavLinkRenderProps): string =>
                      mobileLinkClass(isActive)
                    }
                    end
                  >
                    <span className="inline-flex items-center gap-2">
                      {Icon && <Icon size={18} />}
                      {renderLabel(label)}
                    </span>
                  </NavLink>
                </li>
              );
            }
          )}
        </ul>
      )}
    </header>
  );
}
