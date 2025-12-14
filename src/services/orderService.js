import api from './api';

const getOrders = async ({ page = 0, size = 10, search = '' }) => {
    // Endpoint: GET /api/orders
    try {
        const response = await api.get('/orders', {
            params: {
                page,
                size,
                search,
                sort: 'createdAt,desc' 
            }
        });
        return response.data;
    } catch (error) {
        console.error('Błąd pobierania wszystkich zamówień:', error);
        throw error;
    }
};

export const orderService = {
    // Tworzenie zamówienia
    createOrder: async (orderData) => {
        try {
            const response = await api.post('/orders', orderData);
            return response.data;
        } catch (error) {
            console.error('Błąd tworzenia zamówienia:', error);
            throw error;
        }
    },

    // Pobieranie listy własnych zamówień
    getMyOrders: async (userId) => {
        // Endpoint: GET /api/orders/user/{userId}
        try {
            const response = await api.get(`/orders/user/${userId}`);
            // Zakładamy, że ten endpoint może zwrócić paginowany obiekt lub tablicę
            return response.data; 
        } catch (error) {
            console.error(`Błąd pobierania zamówień dla użytkownika ${userId}:`, error);
            throw error;
        }
    },

    // Anulowanie zamówienia
    cancelOrder: async (orderId) => {
        // Endpoint: PATCH /api/orders/{id}/cancel
        try {
            const response = await api.patch(`/orders/${orderId}/cancel`);
            return response.data;
        } catch (error) {
            console.error(`Błąd anulowania zamówienia ${orderId}:`, error);
            throw error;
        }
    },

    // Pobieranie szczegółów zamówienia
    getOrderDetails: async (orderId) => {
        // Endpoint: GET /api/orders/{id}
        // Endpoint ten zwraca również zagnieżdżone płatności.
        try {
            const response = await api.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error(`Błąd pobierania szczegółów zamówienia ${orderId}:`, error);
            throw error;
        }
    },

    // Aktualizacja statusu zamówienia
    updateOrderStatus: async (orderId, data) => {
        // Endpoint: PUT /api/orders/{id} (tylko status)
        try {
            const response = await api.put(`/orders/${orderId}`, data);
            return response.data;
        } catch (error) {
            console.error(`Błąd aktualizacji zamówienia ${orderId}:`, error);
            throw error;
        }
    },
    
    // Pobieranie WSZYSTKICH zamówień (Dla Admina)
    getOrders,
};