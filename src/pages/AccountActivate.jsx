import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Loader, XCircle, CheckCircle2, Mail, ArrowLeft, LogIn } from 'lucide-react';
import api from '../services/api';

const AUTO_REDIRECT_DELAY = 3000; // 3 sekundy

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
            setMessage('Brak wymaganego tokena aktywacyjnego. Prosimy o sprawdzenie poprawności linku.');
            return;
        }

        const activateAccount = async () => {
            try {
                // Wywołanie endpointu aktywacji konta
                const response = await api.post(`/auth/activate?token=${token}`);

                setStatus('success');
                setMessage('Konto zostało pomyślnie aktywowane. Zostaniesz automatycznie przekierowany do strony logowania.');

                // Automatyczne przekierowanie
                setTimeout(() => {
                    navigate('/login', { state: { message: 'Konto aktywowane! Możesz się zalogować.' } });
                }, AUTO_REDIRECT_DELAY);


            } catch (err) {
                console.error("Błąd aktywacji:", err.response || err);

                let errorMessage = 'Wystąpił błąd podczas aktywacji. Prosimy o ponowną próbę.';

                // Parsowanie komunikatów o błędach z API
                if (err.response?.status === 400) {
                    errorMessage = 'Wysłany token jest nieprawidłowy, został już wykorzystany lub jego ważność wygasła (Token jest ważny przez 15 minut).';
                } else if (err.response?.status === 404) {
                    errorMessage = 'Nie odnaleziono konta dla podanego tokena. Prosimy o weryfikację linku.';
                } else if (err.response?.status === 500) {
                    errorMessage = 'Wystąpił wewnętrzny błąd serwera. Prosimy o kontakt z obsługą lub ponowne wysłanie linku.';
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }

                setStatus('error');
                setMessage(errorMessage);
            }
        };

        activateAccount();
    }, [token, navigate]);

    // Funkcja do ponownego wysłania linku (wykorzystuje /forgot-password do wygenerowania nowego, ważnego tokena)
    const handleResendLink = async (e) => {
        e.preventDefault();
        if (!resendEmail) return;

        setResendLoading(true);
        setResendSuccess(false);

        try {
            // Wykorzystujemy endpoint resetowania hasła, który wygeneruje nowy, ważny token
            await api.post('/auth/forgot-password', { email: resendEmail });

            setResendSuccess(true);

        } catch (err) {
            alert("Wystąpił błąd podczas wysyłania linku. Prosimy o sprawdzenie poprawności emaila i ponowną próbę.");
            setResendLoading(false);
        } finally {
            setResendLoading(false);
        }
    };

    const IconMap = {
        'loading': Loader,
        'success': CheckCircle2,
        'error': XCircle
    };

    const StatusColor = {
        'loading': 'text-gray-500',
        'success': 'text-green-600',
        'error': 'text-red-600'
    };

    const StatusBg = {
        'loading': 'bg-gray-100',
        'success': 'bg-green-50',
        'error': 'bg-red-50'
    };

    const CurrentIcon = IconMap[status];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
            <div className="max-w-md w-full space-y-6 text-center p-6 rounded-lg shadow-xl bg-white">

                <CurrentIcon
                    className={`h-16 w-16 mx-auto ${StatusColor[status]} ${status === 'loading' ? 'animate-spin' : ''}`}
                />

                <h1 className="text-2xl font-bold text-gray-900">
                    {status === 'loading' ? 'Aktywacja konta...' : (status === 'success' ? 'Aktywacja zakończona!' : 'Aktywacja nieudana')}
                </h1>

                <div className={`p-4 rounded-md ${StatusBg[status]} border ${StatusColor[status].replace('text-', 'border-')}`}>
                    <p className={`font-medium ${StatusColor[status]}`}>
                        {message}
                    </p>

                    {/* Formularz ponownego wysłania linku (widoczny tylko w przypadku błędu) */}
                    {status === 'error' && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            {resendSuccess ? (
                                <div className="text-sm text-green-700 font-semibold flex items-center justify-center">
                                    <CheckCircle2 className='h-4 w-4 mr-2' /> Nowy link resetujący został wysłany na podany adres e-mail.
                                </div>
                            ) : (
                                <form onSubmit={handleResendLink}>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Prosimy o wprowadzenie adresu e-mail, aby wysłać nowy link resetujący.
                                    </p>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Twój adres e-mail"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm focus:ring-black focus:border-black"
                                    />
                                    <button
                                        type="submit"
                                        disabled={resendLoading || !resendEmail}
                                        className="w-full py-2 px-4 text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {resendLoading ? <Loader className='h-4 w-4 mr-2 animate-spin' /> : <Mail className='h-4 w-4 mr-2' />}
                                        Wyślij nowy link
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-3 pt-4">
                    <Link
                        to="/login"
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-md text-white ${status === 'success' ? 'bg-black hover:bg-gray-800' : 'bg-black hover:bg-gray-800'
                            } transition-colors`}
                        // Zapobiegamy kliknięciu, jeśli trwa auto-przekierowanie po sukcesie
                        onClick={(e) => { if (status === 'success') e.preventDefault(); }}
                    >
                        <LogIn className="h-4 w-4" />
                        {status === 'success' ? 'Trwa przekierowanie...' : 'Wróć do logowania'}
                    </Link>

                    {status !== 'success' && (
                        <Link
                            to="/register"
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            <Mail className="h-4 w-4" />
                            Zarejestruj się ponownie
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}