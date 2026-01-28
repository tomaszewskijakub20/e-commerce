import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import {
    Loader, ShoppingBag, Eye, ArrowLeft, ChevronLeft, ChevronRight, User
} from 'lucide-react';

// Stała domyślna wielkość strony
const DEFAULT_PAGE_SIZE = 50;

// Mapa tłumaczeń statusów zamówienia
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

export default function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalElements: 0
    });

    // Funkcja formatująca cenę
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price || 0);
    };

    // Funkcja zwracająca styl statusu
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

    // Funkcja tłumacząca status
    const translateStatus = (status) => {
        return orderStatusMap[status] || orderStatusMap['DEFAULT'];
    };

    // Funkcja pobierająca listę zamówień z API
    const fetchOrders = useCallback(async (page, size) => {
        setLoading(true);
        setError(null);
        try {
            // Wywołanie API z paginacją
            const response = await orderService.getOrders({ page, size });

            setOrders(response.content || []);
            setPagination({
                page: response.number || 0,
                size: response.size || DEFAULT_PAGE_SIZE,
                totalPages: response.totalPages || 1,
                totalElements: response.totalElements || 0,
            });

        } catch (err) {
            console.error('Błąd ładowania zamówień admina:', err);
            setError("Nie udało się załadować listy zamówień. Sprawdź połączenie lub uprawnienia.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Ładowanie danych przy zmianie strony
        fetchOrders(pagination.page, pagination.size);
    }, [pagination.page, fetchOrders]);


    // Nawigacja do szczegółów zamówienia
    const handleViewDetails = (orderId) => {
        navigate(`/admin/orders/${orderId}`);
    }

    const handleBackToAdmin = () => navigate("/account/admin");

    // Helper do inteligentnego wyświetlania danych klienta
    const getCustomerName = (order) => {
        // Sprawdzamy czy są dane gościa
        if (order.firstName || order.lastName) {
             return `${order.firstName || ''} ${order.lastName || ''}`.trim();
        }
        
        // Sprawdzamy pole guestEmail
        if (order.guestEmail) {
            return order.guestEmail;
        }

        // Fallback dla userów
        if (order.user) {
             if (order.user.firstName || order.user.lastName) {
                 return `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
             }
             return order.user.email;
        }

        return `Użytkownik #${order.userId || 'Nieznany'}`;
    };

    // Obliczanie zakresu wyświetlanych elementów dla paginacji
    const startIndex = pagination.page * pagination.size + 1;
    const endIndex = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements);

    const paginatedOrders = useMemo(() => orders, [orders]);


    // Komponent ładujący (pełnoekranowy, jeśli lista jest pusta)
    if (loading && orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
                    <p className="mt-4 text-gray-600">Ładowanie zamówień...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Nagłówek strony */}
                <div className="mb-8 pt-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Zamówieniami</h1>
                            <p className="text-gray-600 mt-2">
                                Przeglądaj i zarządzaj wszystkimi złożonymi zamówieniami.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleBackToAdmin}
                                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Powrót do panelu</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Komunikat o błędach */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                        <button
                            onClick={() => fetchOrders(pagination.page, pagination.size)}
                            className="ml-4 text-sm underline hover:no-underline"
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                )}

                {/* Tabela zamówień */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

                    {loading && orders.length > 0 ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader className="h-6 w-6 animate-spin text-gray-600" />
                            <span className="ml-2 text-gray-600">Ładowanie...</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg">
                            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-gray-600">Brak zamówień do wyświetlenia.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klient</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kwota</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                    <div className="flex items-center text-sm font-medium text-gray-900">
                                                        <User className="h-3 w-3 mr-2 text-gray-400" />
                                                        {getCustomerName(order)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                                                        {translateStatus(order.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                                    {formatPrice(order.totalAmount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleViewDetails(order.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                                        title="Zobacz szczegóły"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginacja */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-white px-6 py-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Pokazano {startIndex}-{endIndex} z {pagination.totalElements} zamówień
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                disabled={pagination.page === 0}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>

                                            <span className="px-3 py-1 text-sm text-gray-700">
                                                Strona {pagination.page + 1} z {pagination.totalPages}
                                            </span>

                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                disabled={pagination.page >= pagination.totalPages - 1}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}