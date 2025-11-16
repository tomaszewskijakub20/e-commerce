import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, XCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError("Wypełnij wszystkie pola");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password
      });
      
      navigate('/');
      
    } catch (error) {
      let errorMessage = "Błędny email lub hasło";
      
      if (!error.response) {
        errorMessage = "Problem z połączeniem. Sprawdź połączenie internetowe.";
      } else if (error.response.status === 401) {
        errorMessage = "Błędny email lub hasło";
      } else if (error.response.status === 400) {
        errorMessage = "Nieprawidłowy format danych";
      } else if (error.response.status === 404) {
        errorMessage = "Serwer nie odpowiada. Spróbuj ponownie później.";
      } else if (error.response.status >= 500) {
        errorMessage = "Błąd serwera. Spróbuj ponownie za chwilę.";
      }
      
      // Jeśli backend zwraca komunikat, użyj go (możesz dodać tłumaczenie)
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        // Tłumaczenie komunikatów z backendu
        if (backendMessage === "Invalid username or password") {
          errorMessage = "Błędny email lub hasło";
        } else if (backendMessage.includes("Authentication Failed")) {
          errorMessage = "Błąd uwierzytelniania";
        } else {
          errorMessage = backendMessage; // Lub pozostaw oryginalny komunikat
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Nagłówek */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-black rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Zaloguj się do konta
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Lub{" "}
            <Link
              to="/register"
              className="font-medium text-black hover:text-gray-800 transition-colors"
            >
              załóż nowe konto
            </Link>
          </p>
        </div>

        {/* Komunikat o błędzie */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
            <div className="flex items-center justify-center space-x-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Formularz */}
        <form className="mt-4 space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Wpisz adres e-mail"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {/* Hasło */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Wpisz hasło"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Link do resetowania hasła */}
          <div className="flex justify-end">
            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-medium text-black hover:text-gray-800 transition-colors"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
          </div>

          {/* Przycisk submit */}
          <div>
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${
                loading || !formData.email || !formData.password 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-md'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Logowanie...</span>
                </div>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <LogIn className="h-5 w-5 text-white" />
                  </span>
                  Zaloguj się
                </>
              )}
            </button>
          </div>
        </form>

        {/* Informacja o testowych kontach */}
        <div className="text-center text-xs text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="font-medium mb-1">Konta testowe:</p>
          <p>Właściciel: owner@example.com / Password</p>
          <p>Użytkownik: user@example.com / Password</p>
        </div>
      </div>
    </div>
  );
}