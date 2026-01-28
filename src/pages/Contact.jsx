import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock, Send, Loader, CheckCircle, AlertCircle } from "lucide-react";
import { contactService } from "../services/contactService";
import { settingsService } from "../services/settingsService";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    acceptTerms: false
  });
  
  // Stan dla danych sklepu
  const [storeData, setStoreData] = useState(null);
  const [loadingStoreData, setLoadingStoreData] = useState(true);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Pobieranie danych sklepu
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const data = await settingsService.getPublicSettings();
        setStoreData(data);
      } catch (err) {
        console.error("Błąd pobierania ustawień kontaktu:", err);
      } finally {
        setLoadingStoreData(false);
      }
    };
    fetchStoreSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Imię i nazwisko jest wymagane.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Proszę podać poprawny adres email.";
    if (!formData.subject) return "Proszę wybrać temat wiadomości.";
    if (!formData.message.trim()) return "Treść wiadomości jest wymagana.";
    if (formData.message.trim().length < 10) return "Wiadomość jest zbyt krótka.";
    if (!formData.acceptTerms) return "Wymagana jest zgoda na przetwarzanie danych.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: `DOTYCZY: ${formData.subject}\n----------------------------------------\n\n${formData.message}`
      };

      await contactService.sendMessage(payload);
      
      setIsSent(true);
      setFormData({ name: "", email: "", subject: "", message: "", acceptTerms: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error("Błąd wysyłki:", err);
      let serverMsg = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.";
      if (err.response) {
        if (err.response.status === 400) {
            serverMsg = "Dane formularza są niepoprawne. Sprawdź czy wszystkie pola są wypełnione.";
        } else if (err.response.data?.message) {
            serverMsg = err.response.data.message;
        }
      }
      setError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Przygotowanie danych do wyświetlenia (zabezpieczenie przed brakami)
  const contact = storeData?.contact || {};
  const phone = contact.phone || "Brak danych";
  const email = contact.email || "kontakt@sklep.pl";
  const address = contact.address || "Brak danych adresowych";
  // Godziny otwarcia mogą być w przyszłości dodane do Settings API, na razie fallback
  const openingHours = contact.openingHours || "Pon-Pt: 9:00 - 17:00"; 

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Nagłówek */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Skontaktuj się z nami</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Masz pytania dotyczące produktów lub zamówienia? Jesteśmy tutaj, aby Ci pomóc.
          </p>
        </div>

        {/* Sekcja Błędów Globalnych */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Lewa kolumna: Informacje */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-full relative overflow-hidden">
              {loadingStoreData && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                      <Loader className="animate-spin text-gray-400" />
                  </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900 mb-8">Dane kontaktowe</h2>
              
              <div className="space-y-8">
                <ContactInfoItem 
                    icon={<Phone className="h-5 w-5" />} 
                    title="Infolinia" 
                    text={phone} 
                    subtext="Zadzwoń do nas" 
                />
                <ContactInfoItem 
                    icon={<Mail className="h-5 w-5" />} 
                    title="Napisz do nas" 
                    text={email} 
                    subtext="Odpowiadamy w 24h" 
                />
                <ContactInfoItem 
                    icon={<MapPin className="h-5 w-5" />} 
                    title="Siedziba" 
                    text={address} 
                    subtext="Główny magazyn" 
                />
                <ContactInfoItem 
                    icon={<Clock className="h-5 w-5" />} 
                    title="Godziny pracy" 
                    text={openingHours}
                    subtext="Obsługa klienta" 
                />
              </div>
            </div>
          </div>

          {/* Prawa kolumna: Formularz */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {isSent ? (
                <div className="py-16 text-center animate-in zoom-in duration-300">
                  <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Wiadomość wysłana!</h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Dziękujemy za kontakt. Nasz zespół skontaktuje się z Tobą najszybciej jak to możliwe.
                  </p>
                  <button 
                    onClick={() => setIsSent(false)}
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                  >
                    Wyślij kolejną wiadomość
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Napisz wiadomość</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                            Imię i nazwisko <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          autoComplete="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder-gray-400"
                          placeholder="Twoje imię i nazwisko"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                            Adres email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder-gray-400"
                          placeholder="Wpisz adres e-mail"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">
                        Temat <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                            id="subject"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none appearance-none bg-white transition-all cursor-pointer"
                        >
                            <option value="" disabled>Wybierz temat rozmowy</option>
                            <option value="Zamówienie">Zapytanie o zamówienie</option>
                            <option value="Produkt">Szczegóły produktu</option>
                            <option value="Dostawa">Dostawa i płatności</option>
                            <option value="Zwrot/Reklamacja">Zwrot lub reklamacja</option>
                            <option value="Współpraca">Współpraca</option>
                            <option value="Inne">Inny temat</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                        Wiadomość <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows="6"
                        required
                        maxLength={2000}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-y min-h-[120px]"
                        placeholder="Opisz dokładnie, w czym możemy Ci pomóc..."
                      />
                      <p className="text-xs text-gray-400 text-right">
                        {formData.message.length}/2000
                      </p>
                    </div>

                    <div className="flex items-start bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center h-5">
                        <input
                          id="acceptTerms"
                          name="acceptTerms"
                          type="checkbox"
                          required
                          checked={formData.acceptTerms}
                          onChange={handleChange}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="acceptTerms" className="font-medium text-gray-700 cursor-pointer">
                          Zgoda na przetwarzanie danych
                        </label>
                        <p className="text-gray-500 mt-1">
                          Wyrażam zgodę na przetwarzanie moich danych osobowych w celu obsługi zapytania zgodnie z polityką prywatności.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-4 px-8 border border-transparent text-base font-semibold rounded-lg text-white bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
                    >
                      {isSubmitting ? (
                        <>
                            <Loader className="animate-spin h-5 w-5" />
                            <span>Wysyłanie...</span>
                        </>
                      ) : (
                        <>
                            <Send className="h-5 w-5" />
                            <span>Wyślij wiadomość</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponent pomocniczy dla elementów listy kontaktowej
function ContactInfoItem({ icon, title, text, subtext }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="bg-gray-50 group-hover:bg-black transition-colors duration-300 rounded-xl p-3 flex-shrink-0 text-black group-hover:text-white">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-lg font-medium text-gray-800 whitespace-pre-line">{text}</p>
        {subtext && <p className="text-sm text-gray-500 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}