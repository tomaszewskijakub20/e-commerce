import { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Loader, ShoppingBag, Calendar, CheckCircle } from 'lucide-react';

export default function OrdersList() {
    const { userData, orderStatusMap } = useOutletContext();
    
    const [userOrders, setUserOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState(null);
    
    // Funkcja formatująca cenę
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price || 0);
    };

    // Funkcja określająca styl statusu zamówienia
    const getStatusStyle = (status) => {
        switch (status) {
            case 'DELIVERED':
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'SHIPPED': return 'bg-blue-100 text-blue-800';
            case 'NEW':
            case 'CONFIRMED': return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'PENDING': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };
    
    // Funkcja tłumacząca status zamówienia
    const translateStatus = (status) => {
        return orderStatusMap[status] || orderStatusMap['DEFAULT'];
    };

    // Funkcja pobierająca listę zamówień użytkownika
    const loadUserOrders = useCallback(async () => {
        const userId = userData.id; 
        setOrdersLoading(true);
        setOrdersError(null);

        if (!userId) {
            setOrdersLoading(false);
            return;
        }

        try {
            const responseData = await orderService.getMyOrders(userId);
            
            const ordersFromContent = responseData && responseData.content
                ? responseData.content
                : responseData;

            let ordersArray = Array.isArray(ordersFromContent) ? ordersFromContent : [];

            // Sortowanie zamówień od najnowszego
            const sortedOrders = ordersArray.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setUserOrders(sortedOrders);

        } catch (err) {
            console.error(`Błąd ładowania zamówień dla użytkownika ${userId}:`, err.response || err);
            setOrdersError("Nie udało się załadować listy zamówień.");
        } finally {
            setOrdersLoading(false);
        }
    }, [userData.id]);
    
    useEffect(() => {
        if (userData.id) loadUserOrders();
    }, [userData.id, loadUserOrders]);

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Moje zamówienia</h3>
            {ordersLoading && (
                <div className="text-center py-12"><Loader className="h-6 w-6 animate-spin mx-auto text-gray-600" /></div>
            )}
            
            {ordersError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {ordersError}
                </div>
            )}

            {!ordersLoading && userOrders.length === 0 && !ordersError && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">Brak historii zamówień</p>
                    <p className="text-sm text-gray-400">Tutaj pojawią się Twoje zamówienia po złożeniu.</p>
                </div>
            )}
            
            {!ordersLoading && userOrders.length > 0 && (
                <div className="space-y-4">
                    {userOrders.map(order => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center border-b pb-3 mb-3">
                                    <h4 className="font-semibold text-gray-900">Zamówienie #{order.id}</h4>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                                        {translateStatus(order.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        Data: {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                                    </div>
                                    <div className="text-right font-bold text-lg text-black">
                                        {formatPrice(order.totalAmount)}
                                    </div>
                                </div>

                                <p className="mt-2 text-sm text-gray-600">
                                    Liczba pozycji: {order.items?.length || 0}
                                </p>
                            </div>

                            <div className="ml-4 flex-shrink-0">
                                <Link 
                                    to={`/account/orders/${order.id}`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Szczegóły
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}