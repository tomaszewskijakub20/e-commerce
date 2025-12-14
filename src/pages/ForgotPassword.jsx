import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader, XCircle, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSent, setIsSent] = useState(false);

  // Wysyłanie żądania resetowania hasła
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Adres email jest wymagany.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsSent(false);

    try {
      await api.post('/auth/forgot-password', { email: email });

      setIsSent(true);

      // Opóźnienie przed przejściem do ekranu sukcesu
      setTimeout(() => {
        setIsSubmitted(true);
      }, 1000);

    } catch (err) {
      console.error('Błąd resetowania hasła:', err.response || err);

      if (err.response?.status === 400) {
        setError(err.response.data?.message || "Nieprawidłowy format emaila.");
      } else {
        setError("Błąd serwera. Spróbuj ponownie później.");
      }
      setIsSubmitted(false);

    } finally {
      setLoading(false);
    }
  };

  // Funkcja do ponownego wyświetlenia formularza
  const handleResend = () => {
    setIsSubmitted(false);
    setEmail("");
    setIsSent(false);
  };

  // Widok po pomyślnym wysłaniu formularza
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          {/* Nagłówek sukcesu */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Link resetujący wysłany!
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Jeśli adres <strong>{email}</strong> istnieje w naszym systemie, otrzymasz emaila z linkiem.
            </p>
          </div>

          {/* Instrukcje */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="space-y-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Ważne:</p>
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-blue-500" /> Sprawdź folder spam.
              </p>
              <p className="flex items-center text-red-600 font-medium">
                <Clock className="h-4 w-4 mr-2" /> Link wygasa za 30 minut.
              </p>
            </div>

          </div>

          {/* Przyciski */}
          <div className="space-y-3">
            <button
              onClick={handleResend}
              // Przycisk "Wyślij ponownie"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              Wyślij ponownie
            </button>

            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Widok formularza
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Nagłówek */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-black rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Resetowanie hasła
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Podaj swój adres email, a wyślemy Ci link do resetowania hasła
          </p>
        </div>

        {/* Komunikat o błędzie lub sukcesie wysłania */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
            <div className="flex items-center justify-center space-x-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        {isSent && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Wysłano! Trwa przeładowanie do ekranu sukcesu...</span>
            </div>
          </div>
        )}

        {/* Formularz */}
        <form className="mt-4 space-y-4 bg-white p-4 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adres email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isSent}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Wpisz adres e-mail"
              />
            </div>
          </div>

          {/* Przycisk submit */}
          <div>
            <button
              type="submit"
              disabled={loading || !email || isSent}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors ${loading || isSent ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                'Wyślij link resetujący'
              )}
            </button>
          </div>

          {/* Link powrotny */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-black hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Wróć do strony logowania
            </Link>
          </div>
        </form>

        {/* Informacja dodatkowa */}
        <div className="text-center text-xs text-gray-500">
          <p>Nie możesz się zalogować? <Link to="/contact" className="text-black hover:text-gray-800 underline">Skontaktuj się z nami</Link></p>
        </div>
      </div>
    </div>
  );
}