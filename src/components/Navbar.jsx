import { NavLink } from "react-router-dom";
import { ShoppingCart, LogIn, Phone, Search, Home } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [cartCount] = useState(3);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
        {/* Logo */}
        <NavLink to="/" className="text-3xl font-bold text-black">
          E-Shop
        </NavLink>

        {/* Menu */}
        <div className="flex items-center gap-12">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 ${isActive ? "text-black font-bold" : "text-gray-600 hover:text-black"}`
            }
          >
            <Home size={24} />
            Strona główna
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex items-center gap-2 ${isActive ? "text-black font-bold" : "text-gray-600 hover:text-black"}`
            }
          >
            <Search size={24} />
            Wyszukaj
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `flex items-center gap-2 ${isActive ? "text-black font-bold" : "text-gray-600 hover:text-black"}`
            }
          >
            <Phone size={24} />
            Kontakt
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `flex items-center gap-2 relative ${isActive ? "text-black font-bold" : "text-gray-600 hover:text-black"}`
            }
          >
            <ShoppingCart size={24} />
            Koszyk
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-6 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex items-center gap-2 ${isActive ? "text-black font-bold" : "text-gray-600 hover:text-black"}`
            }
          >
            <LogIn size={24} />
            Zaloguj się
          </NavLink>
        </div>
      </div>
    </nav>
  );
}