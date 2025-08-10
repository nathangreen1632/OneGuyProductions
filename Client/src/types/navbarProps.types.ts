import type {NavLink} from "../constants/navLinks";

export default interface NavbarViewProps {
  navLinks: NavLink[];
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}