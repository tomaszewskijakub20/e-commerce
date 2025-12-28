import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Loader, CheckCircle } from "lucide-react";
import { contactService } from "../services/contactService";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    acceptTerms: false
  });
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Imię i nazwisko jest wymagane";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Proszę podać poprawny adres email";
    if (!formData.subject) return "Proszę wybrać temat";
    if (!formData.message.trim()) return "Wiadomość jest wymagana";
    if (!formData.acceptTerms) return "Musisz zaakceptować przetwarzanie danych";
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
      // Przygotowanie danych pod ContactRequestDTO (name, email, message)
      // Temat doklejamy do wiadomości, ponieważ backend go nie obsługuje w DTO
      const payload = {
        name: formData.name,
        email: formData.email,
        message: `[Temat: ${formData.subject}]\n\n${formData.message}`
      };

      await contactService.sendMessage(payload);
      
      setIsSent(true);
      setFormData({ name: "", email: "", subject: "", message: "", acceptTerms: false });
    } catch (err) {
      const serverMsg = err.response?.data?.message || "Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie później.";
      setError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kontakt</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Masz pytania? Chętnie pomożemy! Skontaktuj się z nami, a nasz zespół odpowie tak szybko, jak to możliwe.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center mb-6 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna: Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dane kontaktowe</h2>
              <div className="space-y-6">
                <ContactInfoItem icon={<Phone />} title="Telefon" text="+48 123 456 789" subtext="Pon-Pt: 8:00-18:00" />
                <ContactInfoItem icon={<Mail />} title="Email" text="kontakt@eshop.pl" subtext="Odpowiadamy w ciągu 24h" />
                <ContactInfoItem icon={<MapPin />} title="Adres" text="ul. Przykładowa 123, 00-001 Warszawa" />
                <ContactInfoItem icon={<Clock />} title="Godziny otwarcia" text="Pon-Pt: 8:00-18:00, Sob: 9:00-14:00" />
              </div>

              <div className="mt-8 bg-gray-100 rounded-lg h-48 flex items-center justify-center border-2 border-dashed border-gray-300">
                <p className="text-gray-400 text-center text-sm">Integracja z mapą Google</p>
              </div>
            </div>
          </div>

          {/* Prawa kolumna: Formularz */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {isSent ? (
                <div className="py-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Wiadomość wysłana!</h2>
                  <p className="text-gray-600 mb-6">Dziękujemy za kontakt. Odpowiemy na podany adres e-mail w ciągu 24 godzin.</p>
                  <button 
                    onClick={() => setIsSent(false)}
                    className="text-black font-semibold hover:underline"
                  >
                    Wyślij kolejną wiadomość
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Wyślij wiadomość</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko *</label>
                        <input
                          type="text" name="name" required value={formData.name} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                          placeholder="Wpisz Twoje imię i nazwisko"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adres email *</label>
                        <input
                          type="email" name="email" required value={formData.email} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                          placeholder="Wpisz adres e-mail"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temat *</label>
                      <select
                        name="subject" required value={formData.subject} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                      >
                        <option value="">Wybierz temat</option>
                        <option value="Zamówienie">Zapytanie o zamówienie</option>
                        <option value="Produkt">Pytanie o produkt</option>
                        <option value="Dostawa">Dostawa i zwroty</option>
                        <option value="Reklamacja">Reklamacja</option>
                        <option value="Inne">Inne</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Wiadomość *</label>
                      <textarea
                        name="message" rows="6" required maxLength={1000} value={formData.message} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none resize-none"
                        placeholder="W czym możemy pomóc?"
                      />
                    </div>

                    <div className="flex items-start">
                      <input
                        type="checkbox" id="acceptTerms" name="acceptTerms" required
                        checked={formData.acceptTerms} onChange={handleChange}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
                      />
                      <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                        Wyrażam zgodę na przetwarzanie moich danych osobowych w celu udzielenia odpowiedzi na zapytanie.*
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    >
                      {isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                      {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
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

// Mały komponent pomocniczy dla ikon
function ContactInfoItem({ icon, title, text, subtext }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-black rounded-full p-2 flex-shrink-0 text-white">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{text}</p>
        {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
      </div>
    </div>
  );
}