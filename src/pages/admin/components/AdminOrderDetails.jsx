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

// === MAPY TŁUMACZEŃ I STYLE ===

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

const AVAILABLE_ORDER_STATUSES = [
    'NEW', 
    'CONFIRMED', 
    'PROCESSING', 
    'SHIPPED', 
    'DELIVERED', 
    'CANCELLED', 
    'REFUNDED'
];

const paymentStatusMap = {
    'PENDING': 'Oczekująca',
    'PROCESSING': 'W trakcie przetwarzania',
    'COMPLETED': 'Zakończona',
    'FAILED': 'Nieudana',
    'CANCELLED': 'Anulowana',
    'REFUNDED': 'Zwrócona',
    'DEFAULT': 'Nieznany',
};

// Mapa metod płatności zgodna z PaymentCreateDTO
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

const formatPrice = (price) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price || 0);
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

// === KOMPONENTY POMOCNICZE ===

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

// === SUB-KOMPONENTY PANELU ===

const OrderStatusManager = ({ orderId, currentStatus, onOrderUpdate }) => {
    const [newStatus, setNewStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        setNewStatus(currentStatus);
    }, [currentStatus]);

    const handleStatusChangeClick = (e) => {
        e.preventDefault();
        if (newStatus === currentStatus) {
            setMessage({ type: 'info', text: 'Status nie został zmieniony.' });
            return;
        }
        setMessage(null);
        setShowConfirmModal(true);
    };

    const confirmStatusUpdate = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        setMessage(null);
        try {
            const updateData = { status: newStatus, isActive: true };
            const updatedOrder = await orderService.updateOrderStatus(orderId, updateData);
            onOrderUpdate(updatedOrder);
            setMessage({
                type: 'success',
                text: `Status został pomyślnie zmieniony na: ${orderStatusMap[newStatus] || newStatus}.`
            });
        } catch (err) {
            const serverMessage = err.response?.data?.message;
            let friendlyMsg = "Nie udało się zaktualizować statusu.";
            if (serverMessage?.includes("Insufficient reserved stock")) {
                friendlyMsg = `Błąd magazynowy: Brak zarezerwowanej sztuki produktu w bazie.`;
            } else if (serverMessage) {
                friendlyMsg = serverMessage;
            }
            setMessage({ type: 'error', text: friendlyMsg });
        } finally {
            setLoading(false);
        }
    };

    const getModalType = (status) => {
        if (status === 'CANCELLED' || status === 'FAILED') return 'danger';
        if (status === 'SHIPPED' || status === 'DELIVERED' || status === 'COMPLETED') return 'success';
        return 'warning';
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <span>Zarządzanie Statusem</span>
            </h2>

            {message && (
                <div className={`p-3 text-sm rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleStatusChangeClick} className="space-y-4">
                <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    disabled={loading}
                >
                    {AVAILABLE_ORDER_STATUSES.map(status => (
                        <option key={status} value={status}>{orderStatusMap[status] || status}</option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                    disabled={loading || newStatus === currentStatus}
                >
                    {loading && <Loader className="h-4 w-4 animate-spin mr-2" />}
                    {loading ? 'Zapisywanie...' : 'Zapisz nowy status'}
                </button>
            </form>

            <ConfirmationModal
                show={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmStatusUpdate}
                title={`Zmień status na: ${orderStatusMap[newStatus]}`}
                message={`Czy na pewno chcesz zmienić status zamówienia #${orderId} na ${orderStatusMap[newStatus]}?`}
                type={getModalType(newStatus)}
                isProcessing={loading}
            />
        </div>
    );
};

const PaymentManager = ({ order }) => {
    const payment = (Array.isArray(order.payments) && order.payments.length > 0) ? order.payments[0] : null;

    if (!payment) return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-gray-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" /> Brak płatności.
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" /> Status Płatności
            </h2>
            <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
                <span className={`px-3 py-1 text-sm font-bold rounded ${getPaymentStatusStyle(payment.status)}`}>
                    {paymentStatusMap[payment.status] || payment.status}
                </span>
            </div>
            <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Metoda</p>
                <p className="font-semibold text-black">{paymentMethodMap[payment.method] || payment.method}</p>
                <p className="text-xs text-gray-400 mt-2">ID Transakcji: {payment.transactionId || 'Brak'}</p>
            </div>
        </div>
    );
};

// === GŁÓWNY KOMPONENT ===

export default function AdminOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadOrderDetails = useCallback(async () => {
        if (!id || isNaN(Number(id))) {
            setError("Nieprawidłowy identyfikator zamówienia.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const details = await orderService.getOrderDetails(id);
            setOrder(details);
        } catch (err) {
            setError(`Nie udało się załadować zamówienia #${id}.`);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadOrderDetails(); }, [loadOrderDetails]);

    const handleOrderUpdate = (updatedOrder) => {
        setOrder(prev => ({ ...prev, ...updatedOrder, payments: prev.payments }));
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="h-10 w-10 animate-spin text-black" /></div>;
    if (error || !order) return <div className="text-center py-12"><XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" /><p>{error}</p></div>;

    const { address, items, totalAmount, status, createdAt, firstName, lastName, userId } = order;
    
    // POBIERANIE IMIENIA I NAZWISKA Z OBIEKTU ZAMÓWIENIA (zamiast useAuth)
    const customerFullName = firstName && lastName ? `${firstName} ${lastName}` : `Użytkownik #${userId}`;

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <button onClick={() => navigate('/admin/orders')} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-black">
                <ArrowLeft className="h-5 w-5" /> Powrót do listy
            </button>

            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Zarządzanie Zamówieniem <span className="text-indigo-600">#{order.id}</span>
                </h1>
                <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(createdAt).toLocaleDateString('pl-PL')}</span>
                    <span className="font-bold text-gray-900">Klient: {customerFullName}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <OrderStatusManager orderId={order.id} currentStatus={status} onOrderUpdate={handleOrderUpdate} />
                    <PaymentManager order={order} />
                    
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-700 mb-3"><MapPin className="h-5 w-5" /><h2 className="font-semibold text-lg">Adres Dostawy</h2></div>
                        <address className="not-italic text-gray-900 space-y-1 text-sm">
                            <p className="font-bold">{customerFullName}</p>
                            <p>{address?.line1}</p>
                            {address?.line2 && <p>{address.line2}</p>}
                            <p>{address?.postalCode} {address?.city}</p>
                            <p>{address?.region}, {address?.country}</p>
                        </address>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className={`p-6 rounded-lg border shadow-md ${getStatusStyle(status)}`}>
                        <div className="flex items-center gap-3"><Package className="h-6 w-6" /><h2 className="text-xl font-bold">Status: {orderStatusMap[status]}</h2></div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="font-semibold text-xl text-gray-900 mb-4 flex items-center gap-2"><List className="h-5 w-5" /> Produkty</h2>
                        <div className="divide-y divide-gray-100">
                            {items?.map(item => (
                                <div key={item.id} className="py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <img src={item.product?.thumbnailUrl || '/api/placeholder/50/50'} className="w-12 h-12 object-cover rounded" />
                                        <div>
                                            <p className="font-bold">{item.product?.name}</p>
                                            <p className="text-sm text-gray-500">{item.quantity} x {formatPrice(item.price)}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-medium">Suma całkowita:</span>
                            <span className="text-3xl font-black">{formatPrice(totalAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}