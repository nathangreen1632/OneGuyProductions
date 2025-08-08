import React, { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import type { NavLink } from '../constants/navLinks';
import type NavbarViewProps from '../types/navbarProps.types';

export default function NavbarView({ location, navLinks, menuOpen, toggleMenu, closeMenu }: Readonly<NavbarViewProps>): React.ReactElement {

  return (
    <header className="sticky top-0 z-50 bg-[var(--theme-bg)] border-b border-[var(--theme-border-red)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-[var(--theme-accent)]">
          One Guy Productions
        </Link>

        <ul className="hidden sm:flex gap-6 text-sm font-medium">
          {navLinks.map(({ label, path, icon: Icon, onClick }: NavLink): ReactElement => (
            <li key={path}>
              {onClick ? (
                <button
                  type="button"
                  onClick={onClick}
                  className={`flex items-center gap-1 border-b-2 ${
                    location.pathname === path
                      ? 'border-[var(--theme-border)] text-[var(--theme-border-red)]'
                      : 'border-transparent'
                  } hover:underline underline-offset-4 decoration-[var(--theme-border)] transition-colors duration-200`}
                >
                  {Icon && <Icon size={18} />}
                  {label}
                </button>
              ) : (
                <Link
                  to={path}
                  className={`flex items-center gap-1 border-b-2 ${
                    location.pathname === path
                      ? 'border-[var(--theme-border)] text-[var(--theme-border-red)]'
                      : 'border-transparent'
                  } hover:underline underline-offset-4 decoration-[var(--theme-border)] transition-colors duration-200`}
                >
                  {Icon && <Icon size={18} />}
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <button onClick={toggleMenu} className="sm:hidden" aria-label="Toggle menu">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <ul className="sm:hidden flex flex-col gap-4 px-6 pb-6 text-sm font-medium border-t border-[var(--theme-border)] bg-[var(--theme-bg)]">
          {navLinks.map(({ label, path, icon: Icon, onClick }: NavLink): ReactElement => (
            <li key={path}>
              {onClick ? (
                <button
                  type="button"
                  onClick={() => {
                    onClick();
                    closeMenu();
                  }}
                  className={`block w-full text-left py-2 ${
                    location.pathname === path
                      ? 'text-[var(--theme-border-red)] border-b-2 border-[var(--theme-border)]'
                      : 'border-b border-transparent'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {Icon && <Icon size={18} />}
                    {label}
                  </span>
                </button>
              ) : (
                <Link
                  to={path}
                  onClick={closeMenu}
                  className={`block py-2 ${
                    location.pathname === path
                      ? 'text-[var(--theme-border-red)] border-b-2 border-[var(--theme-border)]'
                      : 'border-b border-transparent'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {Icon && <Icon size={18} />}
                    {label}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
