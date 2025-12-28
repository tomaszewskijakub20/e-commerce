import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Loader, XCircle, CheckCircle2, Mail, ArrowLeft, LogIn, RefreshCcw } from 'lucide-react';
import api from '../services/api';

const AUTO_REDIRECT_DELAY = 4000;

export default function AccountActivate() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Trwa aktywacja konta...');

    // Stan do ponownego wysłania linku
    const [resendEmail, setResendEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Brak tokena aktywacyjnego. Sprawdź, czy link w wiadomości e-mail jest kompletny.');
            return;
        }

        const activateAccount = async () => {
            try {
                // GET /api/auth/activate?token=...
                await api.post(`/auth/activate?token=${token}`);

                setStatus('success');
                setMessage('Konto zostało pomyślnie aktywowane! Za chwilę zostaniesz przekierowany do strony logowania.');

                setTimeout(() => {
                    navigate('/login', { state: { message: 'Konto aktywne! Możesz się zalogować.' } });
                }, AUTO_REDIRECT_DELAY);

            } catch (err) {
                console.error("Błąd aktywacji:", err.response || err);
                setStatus('error');
                
                if (err.response?.status === 400) {
                    setMessage('Link aktywacyjny wygasł lub jest nieprawidłowy. Tokeny są ważne przez 15 minut.');
                } else {
                    setMessage(err.response?.data?.message || 'Wystąpił problem podczas aktywacji konta.');
                }
            }
        };

        activateAccount();
    }, [token, navigate]);

    // Ponowne wysyłanie linku aktywacyjnego
    const handleResendLink = async (e) => {
        e.preventDefault();
        if (!resendEmail) return;

        setResendLoading(true);
        setResendSuccess(false);

        try {
            await api.post('/auth/resend-activation', { email: resendEmail });

            setResendSuccess(true);
            setResendEmail(''); // Czyścimy formularz po sukcesie
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Nie udało się wysłać linku. Upewnij się, że podany e-mail jest poprawny.";
            alert(errorMsg);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8 text-center p-10 rounded-2xl shadow-2xl bg-white border border-gray-100">
                
                {/* Ikona Statusu */}
                <div className="flex justify-center">
                    {status === 'loading' && <Loader className="h-20 w-20 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="h-20 w-20 text-green-500" />}
                    {status === 'error' && <XCircle className="h-20 w-20 text-red-500" />}
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {status === 'loading' && 'Weryfikacja...'}
                    {status === 'success' && 'Sukces!'}
                    {status === 'error' && 'Coś poszło nie tak'}
                </h1>

                <div className={`p-5 rounded-xl border ${
                    status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
                    status === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                    <p className="font-medium leading-relaxed">{message}</p>
                </div>

                {/* Sekcja ponownego wysyłania - tylko przy błędzie */}
                {status === 'error' && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        {resendSuccess ? (
                            <div className="bg-green-100 p-4 rounded-lg flex items-center text-green-800 font-semibold animate-pulse">
                                <Mail className="h-5 w-5 mr-3" />
                                Nowy link został wysłany! Sprawdź skrzynkę.
                            </div>
                        ) : (
                            <form onSubmit={handleResendLink} className="space-y-4">
                                <div className="text-left">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                                        Twój adres e-mail
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="np. jan@kowalski.pl"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={resendLoading || !resendEmail}
                                    className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg disabled:bg-gray-400"
                                >
                                    {resendLoading ? <Loader className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
                                    Wyślij nowy link aktywacyjny
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-3 pt-6">
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 py-3 px-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md"
                    >
                        <LogIn className="h-5 w-5" />
                        Przejdź do logowania
                    </Link>
                    
                    <Link
                        to="/register"
                        className="flex items-center justify-center gap-2 py-3 px-4 font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Wróć do rejestracji
                    </Link>
                </div>
            </div>
        </div>
    );
}