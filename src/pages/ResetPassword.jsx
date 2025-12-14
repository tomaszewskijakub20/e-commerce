import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, XCircle, CheckCircle2, Loader, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { authService } from "../services/authService";

export default function ResetPassword() {
    // Pobieranie tokena z URL
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Walidacja obecności tokena
    useEffect(() => {
        if (!token) {
            setError("Brak tokena resetującego. Prosimy przejść na stronę Zapomniane Hasło i wygenerować nowy link.");
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError("");
    };

    // Funkcja walidująca hasło (ZWRACA STRING Z BŁĘDEM lub null)
    const validatePasswordRequirements = (password, confirmPassword) => {
        if (password !== confirmPassword) return "Hasła nie są identyczne";
        if (password.length < 6) return "Hasło musi mieć co najmniej 6 znaków";
        if (!/[A-Z]/.test(password)) return "Hasło musi zawierać przynajmniej 1 dużą literę";
        if (!/[a-z]/.test(password)) return "Hasło musi zawierać przynajmniej 1 małą literę";
        if (!/[0-9]/.test(password)) return "Hasło musi zawierać przynajmniej 1 cyfrę";

        return null; // Walidacja pomyślna
    };

    // Obliczenie aktualnego błędu walidacji (do wyświetlania)
    const validationError = validatePasswordRequirements(
        formData.newPassword,
        formData.confirmPassword
    );

    // Wysłanie żądania resetowania hasła
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setError("Token jest nieobecny lub nieprawidłowy.");
            return;
        }

        // Ponowna walidacja przed wysłaniem
        const finalValidationError = validatePasswordRequirements(formData.newPassword, formData.confirmPassword);
        if (finalValidationError) {
            setError(finalValidationError);
            return;
        }

        setLoading(true);
        setError("");

        try {
            await authService.resetPassword({
                token: token,
                newPassword: formData.newPassword
            });

            setSuccess("Hasło zostało pomyślnie zmienione! Nastąpi przekierowanie...");

            // Automatyczne przekierowanie
            setTimeout(() => {
                navigate('/login', { state: { message: 'Hasło zmienione. Możesz się zalogować.' } });
            }, 3000);

        } catch (error) {
            let errorMessage = 'Wystąpił błąd podczas zmiany hasła.';

            if (error.response?.status === 400) {
                errorMessage = 'Hasło nie spełnia wymagań lub token wygasł (30 min).';
            } else if (error.response?.status === 404) {
                errorMessage = 'Nieprawidłowy token resetujący. Prosimy wygenerować nowy link.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Uproszczona wizualizacja wymagań hasła
    const passwordRequirements = {
        length: formData.newPassword.length >= 6,
        uppercase: /[A-Z]/.test(formData.newPassword),
        lowercase: /[a-z]/.test(formData.newPassword),
        number: /[0-9]/.test(formData.newPassword),
        match: formData.newPassword === formData.confirmPassword
    };


    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-6 text-center p-6 rounded-lg shadow-xl bg-white">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Sukces! Hasło zmienione.</h2>
                    <p className="text-gray-600">{success}</p>
                    <Link to="/login" className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors">
                        <LogIn className="h-4 w-4" /> Zaloguj się
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6">
                {/* Nagłówek */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-16 bg-black rounded-full flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Ustaw nowe hasło</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Wprowadź nowe hasło dla swojego konta.
                    </p>
                    {token && (
                        <p className="text-xs text-gray-500 mt-1">Token aktywny (ważny 30 minut)</p>
                    )}
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

                <form className="mt-4 space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Nowe Hasło */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Nowe Hasło *
                            </label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={loading || !token}
                                    className="block w-full pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                                    placeholder="Minimum 6 znaków"
                                />
                            </div>

                            {/* Wymagania hasła (Wizualizacja) */}
                            {formData.newPassword && (
                                <div className="mt-2 space-y-1 text-left">
                                    <div className={`text-xs flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordRequirements.length ? <CheckCircle2 className="w-3 h-3 mr-2" /> : <XCircle className="w-3 h-3 mr-2" />}
                                        Min. 6 znaków
                                    </div>
                                    <div className={`text-xs flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordRequirements.uppercase ? <CheckCircle2 className="w-3 h-3 mr-2" /> : <XCircle className="w-3 h-3 mr-2" />}
                                        Co najmniej 1 duża litera
                                    </div>
                                    <div className={`text-xs flex items-center ${passwordRequirements.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordRequirements.lowercase ? <CheckCircle2 className="w-3 h-3 mr-2" /> : <XCircle className="w-3 h-3 mr-2" />}
                                        Co najmniej 1 mała litera
                                    </div>
                                    <div className={`text-xs flex items-center ${passwordRequirements.number ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordRequirements.number ? <CheckCircle2 className="w-3 h-3 mr-2" /> : <XCircle className="w-3 h-3 mr-2" />}
                                        Co najmniej 1 cyfra
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Potwierdź nowe hasło */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Potwierdź Hasło *
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading || !token}
                                    className="block w-full pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                                    placeholder="Powtórz nowe hasło"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading || !token}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Przycisk submit */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading || !token || validationError !== null}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors ${loading || !token || validationError ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                'Zmień hasło'
                            )}
                        </button>
                    </div>
                </form>

                {/* Komunikat o braku tokena */}
                {!token && (
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
                        Otworzyłeś stronę bezpośrednio. Wróć do <Link to="/forgot-password" className="font-medium text-black underline">Zapomniałem Hasła</Link>, aby wygenerować link.
                    </div>
                )}

            </div>
        </div>
    );
}