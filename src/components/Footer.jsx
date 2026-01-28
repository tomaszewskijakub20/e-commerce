import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Youtube, Linkedin, Globe, Loader } from "lucide-react";
import { settingsService } from "../services/settingsService";

export default function Footer() {
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const data = await settingsService.getPublicSettings();
        setFooterData(data);
      } catch (err) {
        console.error("Błąd pobierania stopki:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  // Helper do mapowania nazw platform na ikony
  const getSocialIcon = (platformName) => {
    const name = platformName?.toLowerCase() || '';
    if (name.includes('facebook')) return <Facebook size={20} />;
    if (name.includes('twitter') || name.includes('x')) return <Twitter size={20} />;
    if (name.includes('instagram')) return <Instagram size={20} />;
    if (name.includes('youtube')) return <Youtube size={20} />;
    if (name.includes('linkedin')) return <Linkedin size={20} />;
    return <Globe size={20} />;
  };

  // Jeśli dane się ładują, pokazujemy subtelny loader
  if (loading) {
    return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-8 flex justify-center">
           <Loader className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      </footer>
    );
  }

  // Bezpieczne pobieranie danych
  const contact = footerData?.contact || {};
  const socialLinks = footerData?.socialLinks || [];
  const description = footerData?.shopDescription || footerData?.shop_description;
  const copyright = footerData?.footerCopyright || footerData?.footer_copyright || `© ${new Date().getFullYear()} Wszelkie prawa zastrzeżone.`;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Górna sekcja - 4 kolumny */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Kolumna 1 - O nas */}
          <div>
            <h3 className="text-xl font-bold mb-4">O nas</h3>
            
            {description && (
                <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                  {description}
                </p>
            )}
            
            {/* Dynamiczne Sociale */}
            <div className="flex space-x-4 flex-wrap gap-y-2">
              {socialLinks.map((link) => (
                <a 
                  key={link.id} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
                  title={link.platformName}
                >
                  {getSocialIcon(link.platformName)}
                </a>
              ))}
            </div>
          </div>

          {/* Kolumna 2 - Sklep */}
          <div>
            <h3 className="text-xl font-bold mb-4">Sklep</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
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

          {/* Kolumna 3 - Pomoc (CMS Links) */}
          <div>
            <h3 className="text-xl font-bold mb-4">Pomoc</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Kontakt</Link>
              </li>
              <li>
                <Link to="/pages/dostawa-i-zwroty" className="hover:text-white transition-colors">Dostawa i zwroty</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
              </li>
              <li>
                <Link to="/pages/regulamin" className="hover:text-white transition-colors">Regulamin</Link>
              </li>
              <li>
                <Link to="/pages/polityka-prywatnosci" className="hover:text-white transition-colors">Polityka prywatności</Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 4 - Kontakt (Dynamiczne) */}
          <div>
            <h3 className="text-xl font-bold mb-4">Kontakt</h3>
            <div className="space-y-3 text-gray-400 text-sm">
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="flex-shrink-0 text-gray-500" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="flex-shrink-0 text-gray-500" />
                  <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">{contact.email}</a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="flex-shrink-0 mt-1 text-gray-500" />
                  <span className="whitespace-pre-line">{contact.address}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Dolna sekcja - copyright */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              {copyright}
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link to="/pages/regulamin" className="hover:text-white transition-colors">Regulamin</Link>
              <Link to="/pages/polityka-prywatnosci" className="hover:text-white transition-colors">Prywatność</Link>
              <Link to="/pages/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}