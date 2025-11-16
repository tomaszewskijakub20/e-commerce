import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, XCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { authService } from "../services/authService";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError("");
    setSuccess("");
  };

  // Funkcja sprawdzająca wymagania hasła
  const getPasswordRequirements = (password) => {
    return {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
  };

  const validatePassword = (password) => {
    const requirements = getPasswordRequirements(password);
    
    if (!requirements.length) return "Hasło musi mieć co najmniej 6 znaków";
    if (!requirements.uppercase) return "Hasło musi zawierać przynajmniej 1 dużą literę";
    if (!requirements.lowercase) return "Hasło musi zawierać przynajmniej 1 małą literę";
    if (!requirements.number) return "Hasło musi zawierać przynajmniej 1 cyfrę";
    
    return null;
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      formData.acceptTerms &&
      !validatePassword(formData.password)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Walidacja formularza
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const requestData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password
    };

    try {
      await authService.register(requestData);
      
      setSuccess("Konto zostało pomyślnie utworzone! Za chwilę zostaniesz przekierowany do logowania.");
      
      // Przekierowanie po 3 sekundach
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Rejestracja udana! Możesz się teraz zalogować.' } 
        });
      }, 3000);
      
    } catch (error) {      
      let errorMessage = 'Wystąpił błąd podczas rejestracji.';
      
      if (error.response?.status === 400) {
        errorMessage = 'Nieprawidłowe dane rejestracji. Sprawdź format email i hasło.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Użytkownik z tym adresem email już istnieje.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return "Imię jest wymagane";
    }
    if (!formData.lastName.trim()) {
      return "Nazwisko jest wymagane";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Hasła nie są identyczne";
    }
    if (!formData.acceptTerms) {
      return "Musisz zaakceptować regulamin i politykę prywatności";
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      return passwordError;
    }
    
    return null;
  };

  const passwordRequirements = getPasswordRequirements(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Nagłówek */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-black rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Załóż nowe konto
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Lub{" "}
            <Link
              to="/login"
              className="font-medium text-black hover:text-gray-800 transition-colors"
            >
              zaloguj się do istniejącego konta
            </Link>
          </p>
        </div>

        {/* Komunikat sukcesu */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Wyświetlanie błędów */}
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
            <div className="grid grid-cols-2 gap-3">
              {/* Imię */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Imię *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="Twoje imię"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Nazwisko */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwisko *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="Twoje nazwisko"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adres email *
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
                  disabled={loading}
                />
              </div>
            </div>

            {/* Hasło */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Minimum 6 znaków"
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
              
              {/* Wymagania hasła */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className={`text-xs flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.length ? (
                      <CheckCircle2 className="w-3 h-3 mr-2" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-2" />
                    )}
                    Min. 6 znaków
                  </div>
                  <div className={`text-xs flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.uppercase ? (
                      <CheckCircle2 className="w-3 h-3 mr-2" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-2" />
                    )}
                    Co najmniej 1 duża litera
                  </div>
                  <div className={`text-xs flex items-center ${passwordRequirements.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.lowercase ? (
                      <CheckCircle2 className="w-3 h-3 mr-2" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-2" />
                    )}
                    Co najmniej 1 mała litera
                  </div>
                  <div className={`text-xs flex items-center ${passwordRequirements.number ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.number ? (
                      <CheckCircle2 className="w-3 h-3 mr-2" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-2" />
                    )}
                    Co najmniej 1 cyfra
                  </div>
                </div>
              )}
            </div>

            {/* Potwierdź hasło */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Potwierdź hasło *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Powtórz hasło"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-start">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              required
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
              disabled={loading}
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
              Akceptuję{" "}
              <Link
                to="/terms"
                className="font-medium text-black hover:text-gray-800 underline"
              >
                regulamin
              </Link>{" "}
              i{" "}
              <Link
                to="/privacy"
                className="font-medium text-black hover:text-gray-800 underline"
              >
                politykę prywatności
              </Link>{" "}
              *
            </label>
          </div>

          {/* Przycisk submit */}
          <div>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${
                loading || !isFormValid() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-md'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Rejestracja...</span>
                </div>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <UserPlus className="h-5 w-5 text-white" />
                  </span>
                  Załóż konto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}