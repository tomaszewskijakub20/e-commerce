import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Górna sekcja - 4 kolumny */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Kolumna 1 - O nas */}
          <div>
            <h3 className="text-xl font-bold mb-4">O nas</h3>
            <p className="text-gray-400 mb-4">
              Jesteśmy liderem w sprzedaży online, oferując najwyższej jakości produkty z szybką dostawą i doskonałą obsługą klienta.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Kolumna 2 - Sklep */}
          <div>
            <h3 className="text-xl font-bold mb-4">Sklep</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Strona główna</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">Wszystkie produkty</Link>
              </li>
              <li>
                <Link to="/promotions" className="hover:text-white transition-colors">Promocje</Link>
              </li>
              <li>
                <Link to="/new" className="hover:text-white transition-colors">Nowości</Link>
              </li>
              <li>
                <Link to="/bestsellers" className="hover:text-white transition-colors">Bestsellery</Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 3 - Pomoc */}
          <div>
            <h3 className="text-xl font-bold mb-4">Pomoc</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Kontakt</Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-white transition-colors">Dostawa i zwroty</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">Regulamin</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">Polityka prywatności</Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 4 - Kontakt */}
          <div>
            <h3 className="text-xl font-bold mb-4">Kontakt</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center gap-3">
                <Phone size={18} />
                <span>+48 123 456 789</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} />
                <span>kontakt@eshop.pl</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} />
                <span>ul. Przykładowa 123<br />00-001 Warszawa</span>
              </div>
            </div>
          </div>

        </div>

        {/* Dolna sekcja - copyright */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 E-Shop. Wszelkie prawa zastrzeżone.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link to="/terms" className="hover:text-white transition-colors">Regulamin</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Polityka prywatności</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}