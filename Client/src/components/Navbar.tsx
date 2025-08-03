import React from 'react';
import { useLocation, type Location } from 'react-router-dom';
import { navLinks } from '../constants/navLinks';
import { useAppStore } from '../store/useAppStore';
import NavbarView from '../jsx/navbarView';

export default function Navbar(): React.ReactElement {
  const location: Location = useLocation();
  const { menuOpen, toggleMenu, closeMenu } = useAppStore();

  return (
    <NavbarView
      location={location}
      navLinks={navLinks}
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      closeMenu={closeMenu}
    />
  );
}
