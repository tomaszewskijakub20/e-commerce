import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import {
    Loader, Package, MapPin, List, ArrowLeft, Calendar, CreditCard, X,
    AlertTriangle, XCircle, CheckCircle, Clock, Trash2, Info
} from 'lucide-react';

const orderStatusMap = {
    'NEW': 'Nowe',
    'CONFIRMED': 'Potwierdzone',
    'PROCESSING': 'W trakcie realizacji',
    'SHIPPED': 'Wysłane',
    'DELIVERED': 'Dostarczone',
    'CANCELLED': 'Anulowane',
    'REFUNDED': 'Zwrócona płatność',
    'DEFAULT': 'Nieznany',
};

const paymentStatusMap = {
    'PENDING': 'Oczekująca',
    'PROCESSING': 'W trakcie przetwarzania',
    'COMPLETED': 'Zakończona',
    'FAILED': 'Nieudana',
    'CANCELLED': 'Anulowana',
    'REFUNDED': 'Zwrócona',
    'DEFAULT': 'Nieznany',
};

const paymentMethodMap = {
    'CREDIT_CARD': 'Karta Kredytowa',
    'DEBIT_CARD': 'Karta Debetowa',
    'PAYPAL': 'PayPal',
    'BANK_TRANSFER': 'Przelew Bankowy',
    'CASH_ON_DELIVERY': 'Za Pobraniem',
    'BLIK': 'BLIK',
    'APPLE_PAY': 'Apple Pay',
    'GOOGLE_PAY': 'Google Pay',
    'DEFAULT': 'Nieznana metoda',
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'DELIVERED':
        case 'COMPLETED': return 'bg-green-100 border-green-300 text-green-800';
        case 'SHIPPED': return 'bg-blue-100 border-blue-300 text-blue-800';
        case 'CONFIRMED': return 'bg-indigo-100 border-indigo-300 text-indigo-800';
        case 'NEW': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        case 'CANCELLED':
        case 'FAILED': return 'bg-red-100 border-red-300 text-red-800';
        case 'REFUNDED': return 'bg-purple-100 border-purple-300 text-purple-800';
        case 'PROCESSING': return 'bg-orange-100 border-orange-300 text-orange-800';
        default: return 'bg-gray-100 border-gray-300 text-gray-600';
    }
};

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
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50" disabled={isProcessing}>
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg ${confirmBg} flex items-center`} disabled={isProcessing}>
                        {isProcessing && <Loader className="h-4 w-4 animate-spin mr-2" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(null);
    const [cancelError, setCancelError] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const loadOrderDetails = useCallback(async () => {
        if (!id || isNaN(Number(id))) {
            setError("Nieprawidłowy identyfikator zamówienia.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const details = await orderService.getOrderDetails(id);
            setOrder(details);
        } catch (err) {
            console.error(`Błąd ładowania zamówienia ${id}:`, err);
            setError(`Nie udało się załadować szczegółów zamówienia #${id}.`);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrderDetails();
    }, [loadOrderDetails]);

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
            const errMsg = err.response?.data?.message || "Błąd podczas anulowania.";
            setCancelError(errMsg);
        } finally {
            setIsCancelling(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price || 0);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader className="h-10 w-10 animate-spin text-black" />
        </div>
    );

    if (error || !order) return (
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Błąd ładowania</h1>
            <p className="text-gray-600">{error}</p>
            <button onClick={() => navigate('/account/orders')} className="mt-6 inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                <ArrowLeft className="h-4 w-4" />
                <span>Powrót do listy zamówień</span>
            </button>
        </div>
    );

    const { address, items, totalAmount, status, createdAt, payments, firstName, lastName, userId } = order;

    const customerFullName = firstName && lastName ? `${firstName} ${lastName}` : `Użytkownik #${userId}`;

    const mainPayment = (Array.isArray(payments) && payments.length > 0) ? payments[0] : null;
    const translatedOrderStatus = orderStatusMap[status] || orderStatusMap['DEFAULT'];
    const translatedPaymentStatus = mainPayment ? (paymentStatusMap[mainPayment.status] || paymentStatusMap['DEFAULT']) : null;
    
    const translatedPaymentMethod = mainPayment ? (paymentMethodMap[mainPayment.method] || paymentMethodMap['DEFAULT']) : 'Nie określono';

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
                <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 gap-2 sm:gap-6">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Złożono: {new Date(createdAt).toLocaleDateString('pl-PL')}
                    </span>
                    <span className="font-semibold text-gray-800">
                        Klient: {customerFullName}
                    </span>
                </div>
            </header>

            {cancelSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center shadow-sm">
                    <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> {cancelSuccess}</span>
                    <button onClick={() => setCancelSuccess(null)}><X className="h-4 w-4" /></button>
                </div>
            )}
            {cancelError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center shadow-sm">
                    <span className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> {cancelError}</span>
                    <button onClick={() => setCancelError(null)}><X className="h-4 w-4" /></button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className={`p-6 rounded-lg border shadow-md ${getStatusStyle(status)}`}>
                        <div className="flex items-center gap-3">
                            <Package className="h-6 w-6" />
                            <h2 className="text-xl font-bold">Aktualny Status</h2>
                        </div>
                        <p className="text-4xl font-black mt-3 uppercase tracking-tight">{translatedOrderStatus}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-700 mb-4">
                            <MapPin className="h-5 w-5" />
                            <h2 className="font-semibold text-lg">Adres Dostawy</h2>
                        </div>
                        <address className="not-italic text-gray-900 space-y-1 text-sm">
                            <p className="font-bold text-base">{customerFullName}</p>
                            <p>{address?.line1}</p>
                            {address?.line2 && <p>{address.line2}</p>}
                            <p>{address?.postalCode} {address?.city}</p>
                            <p>{address?.region}, {address?.country}</p>
                        </address>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-900 mb-6">
                            <List className="h-5 w-5" />
                            <h2 className="font-semibold text-xl">Pozycje zamówienia ({items?.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {items?.map(item => (
                                <div key={item.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded border overflow-hidden flex-shrink-0">
                                            <img 
                                                src={item.product?.thumbnailUrl || '/api/placeholder/64/64'} 
                                                alt={item.product?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <Link to={`/product/${item.product?.seoSlug}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
                                                {item.product?.name}
                                            </Link>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {item.quantity} szt. × {formatPrice(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-black text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-900 mb-6">
                            <CreditCard className="h-5 w-5" />
                            <h2 className="font-semibold text-xl">Podsumowanie i Płatność</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Metoda płatności</p>
                                    <p className="font-bold text-gray-900">{translatedPaymentMethod}</p>
                                </div>
                                {mainPayment && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status transakcji</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                            mainPayment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                            mainPayment.status === 'FAILED' || mainPayment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {translatedPaymentStatus}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-end pt-2">
                                <span className="text-gray-600 font-medium">Łączna kwota do zapłaty:</span>
                                <span className="text-4xl font-black text-gray-900">{formatPrice(totalAmount)}</span>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                {canCancel ? (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={isCancelling}
                                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                        ANULUJ TO ZAMÓWIENIE
                                    </button>
                                ) : (
                                    status === 'CANCELLED' ? (
                                        <div className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100">
                                            <XCircle className="h-5 w-5" /> ZAMÓWIENIE ANULOWANE
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-500 rounded-xl font-medium border border-gray-100">
                                            <Info className="h-5 w-5" /> Zamówienie w realizacji - brak możliwości anulowania
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancellation}
                title="Anulować zamówienie?"
                message={`Czy na pewno chcesz anulować zamówienie #${id}? Rezerwacja towarów zostanie zwolniona.`}
                confirmText="Tak, anuluj"
                type="danger"
                isProcessing={isCancelling}
            />
        </div>
    );
}