import React, { type ReactElement } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import type { NavLink as INavLink } from '../constants/navLinks';
import type NavbarViewProps from '../types/navbarProps.types';

export default function NavbarView({
                                     location,
                                     navLinks,
                                     menuOpen,
                                     toggleMenu,
                                     closeMenu,
                                   }: Readonly<NavbarViewProps>): React.ReactElement {
  const desktopLinkClass = (isActive: boolean): string =>
    `flex items-center gap-1 border-b-2 ${
      isActive
        ? 'border-[var(--theme-border)] text-[var(--theme-border-red)]'
        : 'border-transparent'
    } hover:underline underline-offset-4 decoration-[var(--theme-border)] transition-colors duration-200`;

  const mobileLinkClass = (isActive: boolean): string =>
    `block py-2 ${
      isActive
        ? 'text-[var(--theme-border-red)] border-b-2 border-[var(--theme-border)]'
        : 'border-b border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[var(--theme-bg)] border-b border-[var(--theme-border-red)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-[var(--theme-accent)]">
          One Guy Productions
        </Link>

        {/* Desktop */}
        <ul className="hidden lg:flex gap-6 text-sm font-medium">
          {navLinks.map(({ label, path, icon: Icon, onClick }: INavLink): ReactElement => {
            // Button-style (e.g., logout)
            if (onClick) {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <button
                    type="button"
                    onClick={onClick}
                    className={desktopLinkClass(isActive)}
                  >
                    {Icon && <Icon size={18} />}
                    {label}
                  </button>
                </li>
              );
            }

            // Regular nav link (active state handled by NavLink)
            return (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) => desktopLinkClass(isActive)}
                  end
                >
                  {Icon && <Icon size={18} />}
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Mobile menu toggle */}
        <button
          onClick={toggleMenu}
          className="lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile */}
      {menuOpen && (
        <ul className="lg:hidden flex flex-col gap-4 px-6 pb-6 text-sm font-medium border-t border-[var(--theme-border)] bg-[var(--theme-bg)]">
          {navLinks.map(({ label, path, icon: Icon, onClick }: INavLink): ReactElement => {
            if (onClick) {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <button
                    type="button"
                    onClick={() => {
                      onClick();
                      closeMenu();
                    }}
                    className={mobileLinkClass(isActive)}
                  >
                    <span className="inline-flex items-center gap-2">
                      {Icon && <Icon size={18} />}
                      {label}
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li key={path}>
                <NavLink
                  to={path}
                  onClick={closeMenu}
                  className={({ isActive }) => mobileLinkClass(isActive)}
                  end
                >
                  <span className="inline-flex items-center gap-2">
                    {Icon && <Icon size={18} />}
                    {label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}
