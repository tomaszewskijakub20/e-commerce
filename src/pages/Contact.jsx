import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    acceptTerms: false
  });
  const [error, setError] = useState("");

  // Obsługa zmian w formularzu
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError("");
  };

  // Walidacja formularza
  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Imię i nazwisko jest wymagane";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Proszę podać poprawny adres email";
    }
    
    if (!formData.subject) {
      return "Proszę wybrać temat";
    }
    
    if (!formData.message.trim()) {
      return "Wiadomość jest wymagana";
    }
    
    if (!formData.acceptTerms) {
      return "Musisz zaakceptować przetwarzanie danych";
    }
    
    return null;
  };

  // Obsługa wysyłania formularza
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // TODO: Dodać wysyłanie do API gdy backend będzie gotowy
    console.log('Formularz kontaktowy:', formData);
    
    // Reset formularza po wysłaniu
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
      acceptTerms: false
    });
    
    // Tymczasowy komunikat sukcesu
    alert("Wiadomość została wysłana! Odpowiemy w ciągu 24 godzin.");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Nagłówek z paddingiem na górze */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kontakt</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Masz pytania? Chętnie pomożemy! Skontaktuj się z nami, a nasz zespół odpowie tak szybko, jak to możliwe.
          </p>
        </div>

        {/* Komunikat o błędzie */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Informacje kontaktowe */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dane kontaktowe</h2>
              
              <div className="space-y-6">
                {/* Telefon */}
                <div className="flex items-start gap-4">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Telefon</h3>
                    <p className="text-gray-600">+48 123 456 789</p>
                    <p className="text-sm text-gray-500">Pon-Pt: 8:00-18:00</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">kontakt@eshop.pl</p>
                    <p className="text-sm text-gray-500">Odpowiadamy w ciągu 24h</p>
                  </div>
                </div>

                {/* Adres */}
                <div className="flex items-start gap-4">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Adres</h3>
                    <p className="text-gray-600">
                      ul. Przykładowa 123<br />
                      00-001 Warszawa<br />
                      Polska
                    </p>
                  </div>
                </div>

                {/* Godziny otwarcia */}
                <div className="flex items-start gap-4">
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Godziny otwarcia</h3>
                    <p className="text-gray-600">
                      Poniedziałek - Piątek: 8:00 - 18:00<br />
                      Sobota: 9:00 - 14:00<br />
                      Niedziela: Zamknięte
                    </p>
                  </div>
                </div>
              </div>

              {/* Mapa placeholder */}
              <div className="mt-8 bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  🗺️ Mapa będzie tutaj<br />
                  <span className="text-sm">(integracja z Google Maps)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Formularz kontaktowy */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Wyślij wiadomość</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Imię i nazwisko + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Imię i nazwisko *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      maxLength={100}
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="Wpisz imię i nazwisko"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Adres email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      maxLength={100}
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="Wpisz adres e-mail"
                    />
                  </div>
                </div>

                {/* Temat */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Temat *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="">Wybierz temat</option>
                    <option value="order">Zapytanie o zamówienie</option>
                    <option value="product">Pytanie o produkt</option>
                    <option value="shipping">Dostawa i zwroty</option>
                    <option value="complaint">Reklamacja</option>
                    <option value="other">Inne</option>
                  </select>
                </div>

                {/* Wiadomość */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Wiadomość *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    required
                    maxLength={1000}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black resize-vertical"
                    placeholder="Opisz szczegółowo swoją sprawę..."
                  />
                </div>

                {/* Checkbox zgody */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    required
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                    Wyrażam zgodę na przetwarzanie moich danych osobowych w celu udzielenia odpowiedzi na zapytanie.*
                  </label>
                </div>

                {/* Przycisk wysłania */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  <Send className="h-5 w-5" />
                  Wyślij wiadomość
                </button>

                {/* Informacja dodatkowa */}
                <p className="text-xs text-gray-500 text-center">
                  Pola oznaczone * są obowiązkowe. Odpowiadamy na wiadomości w ciągu 24 godzin w dni robocze.
                </p>
              </form>
            </div>

            {/* Sekcja FAQ */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Często zadawane pytania</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-200 pb-3">
                  <h4 className="font-semibold text-gray-900">Jak mogę śledzić moje zamówienie?</h4>
                  <p className="text-gray-600 text-sm mt-1">Numer śledzenia zostanie wysłany na Twój email po wysłaniu przesyłki.</p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <h4 className="font-semibold text-gray-900">Jaki jest czas dostawy?</h4>
                  <p className="text-gray-600 text-sm mt-1">Standardowy czas dostawy to 2-3 dni robocze w przypadku płatności z góry.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Jak mogę zwrócić produkt?</h4>
                  <p className="text-gray-600 text-sm mt-1">Masz 30 dni na zwrot produktu. Skontaktuj się z nami, a wyślemy instrukcje.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}