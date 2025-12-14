import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import {
    Loader, Package, MapPin, List, ArrowLeft, Calendar, CreditCard, X,
    AlertTriangle, XCircle, CheckCircle, Clock, Trash2, Info
} from 'lucide-react';

// Mapa tłumaczeń statusów zamówienia
const orderStatusMap = {
    'NEW': 'Nowe',
    'PENDING': 'W trakcie realizacji',
    'CONFIRMED': 'Potwierdzone',
    'SHIPPED': 'Wysłane',
    'DELIVERED': 'Dostarczone',
    'COMPLETED': 'Zakończone',
    'CANCELLED': 'Anulowane',
    'FAILED': 'Błąd zamówienia',
    'DEFAULT': 'Nieznany',
};

// Mapa tłumaczeń statusów płatności
const paymentStatusMap = {
    'PENDING': 'Oczekująca',
    'PROCESSING': 'W trakcie przetwarzania',
    'COMPLETED': 'Zakończona',
    'FAILED': 'Nieudana',
    'CANCELLED': 'Anulowana',
    'REFUNDED': 'Zwrócona',
    'DEFAULT': 'Nieznany',
};

// Komponent uniwersalnego modalu potwierdzenia
const ConfirmationModal = ({
    show, onClose, title, message, onConfirm,
    confirmText = 'Potwierdź', cancelText = 'Anuluj',
    type = 'info', isProcessing = false
}) => {
    if (!show) return null;

    const styles = {
        success: { Icon: CheckCircle, iconColor: 'text-green-600', confirmBg: 'bg-green-600 hover:bg-green-700' },
        danger: { Icon: XCircle, iconColor: 'text-red-600', confirmBg: 'bg-red-600 hover:bg-red-700' },
        warning: { Icon: AlertTriangle, iconColor: 'text-yellow-500', confirmBg: 'bg-yellow-600 hover:bg-yellow-700' },
        info: { Icon: Info, iconColor: 'text-blue-500', confirmBg: 'bg-blue-600 hover:bg-blue-700' },
    };

    const { Icon, iconColor, confirmBg } = styles[type] || styles.info;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <Icon className={`h-6 w-6 mr-3 ${iconColor}`} />
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4" disabled={isProcessing}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        disabled={isProcessing}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-white rounded-lg ${confirmBg} disabled:opacity-50 flex items-center`}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


// Główny komponent OrderDetails
export default function OrderDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(null);
    const [cancelError, setCancelError] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Funkcja ładowania szczegółów zamówienia z API
    const loadOrderDetails = useCallback(async () => {
        if (!id || isNaN(Number(id))) {
            setError("Nieprawidłowy identyfikator zamówienia.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setCancelSuccess(null);
        setCancelError(null);
        try {
            const details = await orderService.getOrderDetails(id);
            setOrder(details);
        } catch (err) {
            console.error(`Błąd ładowania zamówienia ${id}:`, err.response || err);
            setError(`Nie udało się załadować szczegółów zamówienia #${id}. Sprawdź, czy masz do niego uprawnienia.`);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Funkcja wykonująca anulowanie zamówienia po potwierdzeniu
    const confirmCancellation = async () => {
        setShowCancelModal(false); 
        setIsCancelling(true);
        setCancelError(null);

        try {
            const updatedOrder = await orderService.cancelOrder(id);
            setOrder(updatedOrder);
            setCancelSuccess(`Zamówienie #${id} zostało pomyślnie anulowane.`);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error('Błąd anulowania:', err.response || err);
            const errMsg = err.response?.data?.message || "Wystąpił błąd podczas anulowania zamówienia. Spróbuj ponownie.";
            setCancelError(errMsg);
        } finally {
            setIsCancelling(false);
        }
    };

    // Obsługa kliknięcia przycisku "Anuluj" (otwiera modal potwierdzenia)
    const handleCancelClick = () => {
        setCancelSuccess(null);
        setCancelError(null);
        setShowCancelModal(true);
    };

    useEffect(() => {
        loadOrderDetails();
    }, [loadOrderDetails]);

    // Funkcja formatująca cenę
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price || 0);
    };

    // Funkcja zwracająca style CSS na podstawie statusu zamówienia
    const getStatusStyle = (status) => {
        switch (status) {
            case 'DELIVERED':
            case 'COMPLETED': return 'bg-green-100 border-green-300 text-green-800';
            case 'SHIPPED': return 'bg-blue-100 border-blue-300 text-blue-800';
            case 'CONFIRMED': return 'bg-indigo-100 border-indigo-300 text-indigo-800';
            case 'NEW': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
            case 'CANCELLED':
            case 'FAILED': return 'bg-red-100 border-red-300 text-red-800';
            case 'PENDING': return 'bg-orange-100 border-orange-300 text-orange-800';
            default: return 'bg-gray-100 border-gray-300 text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="h-10 w-10 animate-spin text-black" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Błąd ładowania</h1>
                <p className="text-gray-600">{error || "Nie znaleziono szczegółów zamówienia."}</p>
                <button onClick={() => navigate('/account/orders')} className="mt-6 inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Powrót do listy zamówień</span>
                </button>
            </div>
        );
    }

    const { address, items, totalAmount, status, createdAt, payments } = order;

    const mainPayment = (Array.isArray(payments) && payments.length > 0) ? payments[0] : null;

    const translatedOrderStatus = orderStatusMap[status] || orderStatusMap['DEFAULT'];
    const translatedPaymentStatus = mainPayment ? (paymentStatusMap[mainPayment.status] || paymentStatusMap['DEFAULT']) : null;

    const customerName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.email || 'Klient');

    // Możliwe statusy do anulowania
    const canCancel = ['NEW', 'CONFIRMED'].includes(status);


    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <button
                onClick={() => navigate('/account/orders')}
                className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                <span>Powrót do listy zamówień</span>
            </button>

            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Zamówienie <span className="text-blue-600">#{order.id}</span>
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Złożono: {new Date(createdAt).toLocaleDateString('pl-PL')}</span>
                </p>
            </header>

            {/* Komunikat sukcesu/błędu anulowania */}
            {cancelSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
                    <span className="flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {cancelSuccess}
                    </span>
                    <button onClick={() => setCancelSuccess(null)}><X className="h-4 w-4" /></button>
                </div>
            )}
            {cancelError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
                    <span className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        {cancelError}
                    </span>
                    <button onClick={() => setCancelError(null)}><X className="h-4 w-4" /></button>
                </div>
            )}
            {/* Koniec sekcji komunikatów */}


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Kolumna 1: Adres i Status */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Box */}
                    <div className={`p-6 rounded-lg border shadow-md ${getStatusStyle(status)}`}>
                        <div className="flex items-center space-x-3">
                            <Package className="h-6 w-6" />
                            <h2 className="text-xl font-bold">Aktualny Status</h2>
                        </div>
                        <p className="text-4xl font-black mt-3">{translatedOrderStatus}</p>
                        <p className="text-sm mt-1">{status === 'DELIVERED' ? 'Potwierdzenie doręczenia.' : 'Oczekuje na realizację.'}</p>
                    </div>

                    {/* Adres Dostawy */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3 text-gray-700 mb-3">
                            <MapPin className="h-5 w-5" />
                            <h2 className="font-semibold text-lg">Adres Dostawy</h2>
                        </div>
                        <address className="not-italic text-gray-900 space-y-0.5 text-sm">
                            <p className="font-medium">{customerName}</p>
                            <p>{address.line1} {address.line2}</p>
                            <p>{address.postalCode} {address.city}</p>
                            <p>{address.region}, {address.country}</p>
                        </address>
                    </div>
                </div>

                {/* Kolumna 2: Produkty i Podsumowanie */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Lista Produktów */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center space-x-2">
                            <List className="h-5 w-5" />
                            <span>Produkty w Zamówieniu ({items.length})</span>
                        </h2>
                        <div className="space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <Link to={`/product/${item.productSeoSlug}`} className="flex items-center space-x-3">
                                        <img src={item.product?.thumbnailUrl || '/api/placeholder/50/50'} alt={item.productName} className="w-12 h-12 object-cover rounded" />
                                        <div className="text-sm">
                                            <p className="font-medium hover:text-blue-600">{item.productName}</p>
                                            <p className="text-gray-500">Ilość: {item.quantity} x {formatPrice(item.price)}</p>
                                        </div>
                                    </Link>
                                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Podsumowanie i Płatność */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center space-x-2">
                            <CreditCard className="h-5 w-5" />
                            <span>Informacje Finansowe</span>
                        </h2>

                        <div className="space-y-3">
                            {/* Płatność */}
                            <div className="pt-2 border-b pb-3 border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-1">Metoda Płatności:</p>
                                {mainPayment ? (
                                    <div className="text-sm text-gray-900">
                                        <p><span className="font-semibold">{mainPayment.method}</span></p>
                                        <p className="mt-1">Status:
                                            <span className={`font-bold ml-1 px-2 py-0.5 rounded-full text-xs ${mainPayment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                mainPayment.status === 'FAILED' || mainPayment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                {translatedPaymentStatus}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Transakcja: {mainPayment.transactionId || 'Brak'}</p>
                                    </div>
                                ) : (
                                    <p className="text-orange-500 text-sm">Płatność oczekuje lub wybrano metodę "za pobraniem".</p>
                                )}
                            </div>

                            {/* Suma */}
                            <div className="flex justify-between text-xl font-bold pt-3">
                                <span>Całkowita kwota zamówienia:</span>
                                <span className="text-3xl text-black">{formatPrice(totalAmount)}</span>
                            </div>

                            {/* Przycisk anulowania zamówienia */}
                            {canCancel && (
                                <button
                                    onClick={handleCancelClick}
                                    disabled={isCancelling}
                                    className="mt-4 w-full py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                                >
                                    {isCancelling ? (
                                        <>
                                            <Loader className="h-4 w-4 animate-spin" />
                                            <span>Anulowanie...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            <span>Anuluj Zamówienie</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {status === 'CANCELLED' && (
                                <p className="mt-4 text-center text-red-600 font-medium bg-red-50 p-2 rounded-lg">
                                    <XCircle className="h-4 w-4 inline mr-2" />
                                    To zamówienie zostało anulowane.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal anulowania zamówienia */}
            <ConfirmationModal
                show={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancellation}
                title={`Potwierdź Anulowanie Zamówienia #${id}`}
                message={(
                    <>
                        Czy na pewno chcesz zrezygnować z zamówienia #{id}? 
                        <br /><br />
                        Pamiętaj, że ta akcja jest nieodwracalna. Po anulowaniu, rezerwacja produktów zostanie zwolniona, a zamówienie nie będzie mogło zostać wznowione.
                    </>
                )}
                confirmText="Anuluj zamówienie"
                type="danger"
                isProcessing={isCancelling}
            />

        </div>
    );
}