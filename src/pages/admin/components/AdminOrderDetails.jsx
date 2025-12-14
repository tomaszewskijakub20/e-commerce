import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../../services/orderService';
import { paymentService } from '../../../services/paymentService'; 
import { useAuth } from '../../../context/AuthContext';
import {
    Loader, Package, MapPin, List, ArrowLeft, Calendar, CreditCard, X,
    AlertTriangle, XCircle, CheckCircle, Trash2, Edit3, Clock, Tag, RefreshCw, DollarSign,
    Info
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

// Dostępne statusy do zmiany przez administratora
const AVAILABLE_ORDER_STATUSES = [
    'NEW', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'
];

// Mapa statusów płatności
const paymentStatusMap = {
    'PENDING': 'Oczekująca',
    'PROCESSING': 'W trakcie przetwarzania',
    'COMPLETED': 'Zakończona',
    'FAILED': 'Nieudana',
    'CANCELLED': 'Anulowana',
    'REFUNDED': 'Zwrócona',
    'DEFAULT': 'Nieznany',
};

// Mapa metod płatności
const paymentMethodMap = {
    'CREDIT_CARD': 'Karta Kredytowa',
    'DEBIT_CARD': 'Karta Debetowa',
    'PAYPAL': 'PayPal',
    'BANK_TRANSFER': 'Przelew Bankowy',
    'CASH_ON_DELIVERY': 'Za Pobraniem',
    'BLIK': 'BLIK',
    'APPLE_PAY': 'Apple Pay',
    'GOOGLE_PAY': 'Google Pay',
};

// Funkcja formatująca cenę
const formatPrice = (price) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price || 0);
};

// Funkcja zwracająca styl dla statusu zamówienia
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

// Funkcja zwracająca styl dla statusu płatności
const getPaymentStatusStyle = (status) => {
    switch (status) {
        case 'COMPLETED': return 'bg-green-600 text-white';
        case 'REFUNDED': return 'bg-blue-600 text-white';
        case 'FAILED':
        case 'CANCELLED': return 'bg-red-600 text-white';
        case 'PENDING':
        case 'PROCESSING': return 'bg-orange-600 text-white';
        default: return 'bg-gray-500 text-white';
    }
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


// Panel zarządzania statusem zamówienia
const OrderStatusManager = ({ orderId, currentStatus, onOrderUpdate }) => {
    const [newStatus, setNewStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    
    // Stan modala potwierdzenia
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        setNewStatus(currentStatus);
    }, [currentStatus]);

    // Otwiera modal potwierdzenia zmiany statusu
    const handleStatusChangeClick = (e) => {
        e.preventDefault();
        if (newStatus === currentStatus) {
            setMessage({ type: 'info', text: 'Status nie został zmieniony.' });
            return;
        }
        setMessage(null);
        setShowConfirmModal(true);
    };

    // Właściwa logika zapisu statusu (po potwierdzeniu)
    const confirmStatusUpdate = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        setMessage(null);
        try {
            // Wywołanie API do aktualizacji statusu
            const updatedOrder = await orderService.updateOrderStatus(orderId, { status: newStatus });
            onOrderUpdate(updatedOrder);
            setMessage({ type: 'success', text: `Status zmieniony na ${orderStatusMap[newStatus]}.` });
        } catch (err) {
            console.error("Błąd aktualizacji statusu:", err.response || err);
            const errMsg = err.response?.data?.message || "Nie udało się zaktualizować statusu.";
            setMessage({ type: 'error', text: errMsg });
        } finally {
            setLoading(false);
        }
    };

    // Dynamiczny typ modala w zależności od nowej akcji
    const getModalType = (status) => {
        if (status === 'CANCELLED' || status === 'FAILED') return 'danger';
        if (status === 'SHIPPED' || status === 'DELIVERED' || status === 'COMPLETED') return 'success';
        return 'warning';
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <span>Zarządzanie Statusem Zamówienia</span>
            </h2>
            
            {/* Komunikaty po zmianie statusu */}
            {message && (
                <div className={`p-3 text-sm rounded-lg mb-4 ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 
                    message.type === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleStatusChangeClick} className="space-y-4">
                <div>
                    <label htmlFor="order-status" className="block text-sm font-medium text-gray-700">
                        Zmień status na:
                    </label>
                    <select
                        id="order-status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        disabled={loading}
                    >
                        {AVAILABLE_ORDER_STATUSES.map(status => (
                            <option key={status} value={status}>
                                {orderStatusMap[status] || status}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={loading || newStatus === currentStatus}
                >
                    {loading && <Loader className="h-4 w-4 animate-spin mr-2" />}
                    {loading ? 'Zapisywanie...' : 'Zapisz nowy status'}
                </button>
            </form>
            
            {/* Modal Potwierdzenia Zmiany Statusu */}
            <ConfirmationModal
                show={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmStatusUpdate}
                title={`Zmień status na: ${orderStatusMap[newStatus]}`}
                message={
                    <>
                        Czy na pewno chcesz zmienić status zamówienia #{orderId} na {orderStatusMap[newStatus]}?
                        <br /><br />
                        {(newStatus === 'CANCELLED' || newStatus === 'FAILED') && (
                            <span className="font-semibold text-red-600">
                                Ta akcja jest nieodwracalna i może wymagać zwrotu płatności.
                            </span>
                        )}
                    </>
                }
                confirmText={`Zatwierdź status: ${orderStatusMap[newStatus]}`}
                cancelText="Anuluj"
                type={getModalType(newStatus)}
                isProcessing={loading}
            />
        </div>
    );
};

// Panel zarządzania płatnościami
const PaymentManager = ({ order }) => { 
    const initialPayment = (Array.isArray(order.payments) && order.payments.length > 0) ? order.payments[0] : null;

    if (!initialPayment) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-gray-500">
                <p className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span>Brak płatności powiązanych z tym zamówieniem.</span>
                </p>
            </div>
        );
    }

    const payment = initialPayment;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-green-600" /> 
                <span>Status Płatności ({payment.id})</span>
            </h2>

            <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Aktualny status:</p>
                <span className={`inline-block mt-1 px-3 py-1 text-sm font-bold rounded ${getPaymentStatusStyle(payment.status)}`}>
                    {paymentStatusMap[payment.status] || payment.status}
                </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">Rodzaj płatności:</p>
                <p className="font-semibold text-black mt-1">
                    {paymentMethodMap[payment.method] || payment.method}
                </p>
                <p className="text-xs text-gray-500 mt-1">Transakcja ID: {payment.transactionId || 'Brak'}</p>
            </div>
        </div>
    );
};

// Główny komponent widoku szczegółów zamówienia dla administratora
export default function AdminOrderDetails() {
    const { id } = useParams();
    const { user } = useAuth(); 
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Funkcja ładowania szczegółów zamówienia
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
            console.error(`Błąd ładowania zamówienia ${id}:`, err.response || err);
            setError(`Nie udało się załadować szczegółów zamówienia #${id}. Sprawdź, czy masz uprawnienia OWNER.`);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrderDetails();
    }, [loadOrderDetails]);

    // Funkcja aktualizująca stan zamówienia po zmianie statusu przez admina
    const handleOrderUpdate = (updatedOrder) => {
        setOrder(prev => ({ 
            ...prev, 
            ...updatedOrder,
            payments: prev.payments 
        }));
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
                <button onClick={() => navigate('/admin/orders')} className="mt-6 inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-800">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Powrót do listy zamówień admina</span>
                </button>
            </div>
        );
    }

    const { address, items, totalAmount, status, createdAt, payments, userId } = order;

    // Logika identyfikacji klienta dla widoku administracyjnego
    const customer = order.customer || order.user || {}; 
    
    let customerName = 'Klient Anonimowy';
    if (customer.firstName && customer.lastName) {
        customerName = `${customer.firstName} ${customer.lastName}`;
    } else if (customer.email) {
        customerName = customer.email;
    } else if (userId) {
        customerName = `Użytkownik #${userId}`;
    }


    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <button
                onClick={() => navigate('/admin/orders')}
                className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                <span>Powrót do listy zamówień</span>
            </button>

            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Zarządzanie Zamówieniem <span className="text-indigo-600">#{order.id}</span>
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Złożono: {new Date(createdAt).toLocaleDateString('pl-PL')}</span>
                    <span className="ml-4 font-medium">
                        Klient:{customerName} (ID Użytkownika: {userId || 'N/A'})
                    </span>
                </p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Kolumna 1: Narzędzia Administracyjne (Status, Płatności, Adres) */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Panel Zarządzania Statusem */}
                    <OrderStatusManager 
                        orderId={order.id}
                        currentStatus={status}
                        onOrderUpdate={handleOrderUpdate}
                    />

                    {/* Panel Zarządzania Płatnościami */}
                    <PaymentManager 
                        order={order}
                    />

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

                {/* Kolumna 2: Podgląd Zamówienia (Status, Produkty, Suma) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Status Box (Tylko dla podglądu) */}
                    <div className={`p-6 rounded-lg border shadow-md ${getStatusStyle(status)}`}>
                        <div className="flex items-center space-x-3">
                            <Package className="h-6 w-6" />
                            <h2 className="text-xl font-bold">Aktualny Status Zamówienia</h2>
                        </div>
                        <p className="text-4xl font-black mt-3">{orderStatusMap[status] || 'Nieznany'}</p>
                        <p className="text-sm mt-1">Status po ostatniej aktualizacji.</p>
                    </div>

                    {/* Lista Produktów */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center space-x-2">
                            <List className="h-5 w-5" />
                            <span>Produkty w Zamówieniu ({items.length})</span>
                        </h2>
                        <div className="space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <div className="flex items-center space-x-3">
                                        <img src={item.product?.thumbnailUrl || '/api/placeholder/50/50'} alt={item.product.name || 'Brak nazwy'} className="w-12 h-12 object-cover rounded" />
                                        <div className="text-sm">
                                            <p className="font-medium">{item.product.name || 'Brak nazwy'}</p>
                                            <p className="text-gray-500">Ilość: {item.quantity} x {formatPrice(item.price)}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Podsumowanie */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between text-xl font-bold">
                            <span>Całkowita kwota zamówienia:</span>
                            <span className="text-3xl text-black">{formatPrice(totalAmount)}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}