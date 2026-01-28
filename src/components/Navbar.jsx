import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, LogIn, Phone, Search, Home, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { settingsService } from "../services/settingsService"; 

const API_BASE_URL = 'http://localhost:8080';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Stan dla konfiguracji sklepu
  const [storeConfig, setStoreConfig] = useState({
    name: 'E-Shop', 
    logoUrl: null
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cartCount } = useCart();

  // Pobieranie ustawień sklepu
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getPublicSettings();
        
        setStoreConfig({
          name: settings.shopName || 'E-Shop',
          logoUrl: settings.logoUrl
        });
      } catch (err) {
        console.warn("Navbar: brak konfiguracji sklepu");
      }
    };

    fetchSettings();
  }, []);

  const getLogoSrc = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center h-24">
        
        {/* LOGO I NAZWA SKLEPU */}
        <Link to="/" className="flex items-center gap-3 text-black hover:opacity-80 transition-opacity">
          {storeConfig.logoUrl ? (
            <img 
              src={getLogoSrc(storeConfig.logoUrl)} 
              alt={storeConfig.name} 
              className="h-16 w-auto object-contain"
              onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block'; 
              }}
            />
          ) : null}
          
          <span 
            className={`text-2xl font-bold tracking-tight ${storeConfig.logoUrl ? 'hidden md:block' : 'block'}`}
            style={{ display: storeConfig.logoUrl ? 'none' : 'block' }} 
          >
            {storeConfig.name}
          </span>
        </Link>

        <div className="flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj produktów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-lg shadow-sm"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-8 text-lg font-medium">
          <Link to="/" className={`flex items-center gap-2 ${isActive("/") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}>
            <Home size={24} />
            <span className="hidden xl:inline">Strona główna</span>
          </Link>

          <Link to="/contact" className={`flex items-center gap-2 ${isActive("/contact") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}>
            <Phone size={24} />
            <span className="hidden xl:inline">Kontakt</span>
          </Link>

          <Link to="/cart" className={`relative flex items-center gap-2 ${isActive("/cart") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}>
            <ShoppingCart size={24} />
            <span className="hidden xl:inline">Koszyk</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 xl:-right-4 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <Link to="/account" className={`flex items-center gap-2 ${isActive("/account") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}>
              <User size={24} />
              <span className="hidden xl:inline">Konto</span>
            </Link>
          ) : (
            <Link to="/login" className={`flex items-center gap-2 ${isActive("/login") ? "text-black font-bold" : "text-gray-600 hover:text-black"}`}>
              <LogIn size={24} />
              <span className="hidden xl:inline">Zaloguj</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}