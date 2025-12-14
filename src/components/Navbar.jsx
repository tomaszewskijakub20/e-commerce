import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, LogIn, Phone, Search, Home, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cartCount } = useCart();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleSearch = (e) => {
    e.preventDefault(); // Zapobiegaj domyślnej akcji formularza
    if (searchQuery.trim()) {
      // Przekieruj do strony wyników wyszukiwania
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-3xl font-bold text-black">
          E-Shop
        </Link>

        {/* Pole wyszukiwania */}
        <div className="flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj produktów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-lg"
              />
            </div>
          </form>
        </div>

        {/* Menu */}
        <div className="flex items-center gap-8 text-lg font-medium">
          <Link
            to="/"
            className={`flex items-center gap-2 ${isActive("/") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}
          >
            <Home size={24} />
            Strona główna
          </Link>

          <Link
            to="/contact"
            className={`flex items-center gap-2 ${isActive("/contact") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}
          >
            <Phone size={24} />
            Kontakt
          </Link>

          <Link
            to="/cart"
            className={`relative flex items-center gap-2 ${isActive("/cart") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}
          >
            <ShoppingCart size={24} />
            Koszyk
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-6 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Warunkowe wyświetlanie */}
          {isAuthenticated ? (
            <Link
              to="/account"
              className={`flex items-center gap-2 ${isActive("/account") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}
            >
              <User size={24} />
              Moje konto
            </Link>
          ) : (
            <Link
              to="/login"
              className={`flex items-center gap-2 ${isActive("/login") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}
            >
              <LogIn size={24} />
              Zaloguj się
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}