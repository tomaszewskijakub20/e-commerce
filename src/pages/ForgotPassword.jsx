import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Reset hasła dla:', email);
    // Tutaj dodasz logikę resetowania hasła
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          {/* Nagłówek */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Sprawdź swoją skrzynkę
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Wysłaliśmy link do resetowania hasła na adres:<br />
              <strong>{email}</strong>
            </p>
          </div>

          {/* Instrukcje */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="space-y-3 text-sm text-gray-600">
              <p>✓ Sprawdź folder spam, jeśli nie widzisz wiadomości</p>
              <p>✓ Link wygaśnie za 1 godzinę</p>
              <p>✓ Kliknij w link, aby ustawić nowe hasło</p>
            </div>
          </div>

          {/* Przyciski */}
          <div className="space-y-3">
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Wpisz adres e-mail"
              />
            </div>
          </div>

          {/* Przycisk submit */}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              Wyślij link resetujący
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