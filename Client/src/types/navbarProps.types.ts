import type {Location} from "react-router-dom";
import type {NavLink} from "../constants/navLinks";

export default interface NavbarViewProps {
  location: Location;
  navLinks: NavLink[];
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}