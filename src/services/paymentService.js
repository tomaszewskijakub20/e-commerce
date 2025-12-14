import api from './api';

export const paymentService = {
    // Tworzenie płatności
    createPayment: async (paymentData) => {
        // paymentData: { orderId, amount, method, transactionId, notes }
        try {
            const response = await api.post('/payments', paymentData);
            return response.data;
        } catch (error) {
            console.error('Błąd tworzenia płatności:', error);
            throw error;
        }
    },

    // Pobieranie listy płatności dla zamówienia
    getPaymentsForOrder: async (orderId) => {
        // Endpoint: GET /api/payments/order/{orderId}
        try {
            const response = await api.get(`/payments/order/${orderId}`);
            return response.data;
        } catch (error) {
            console.error(`Błąd pobierania płatności dla zamówienia ${orderId}:`, error);
            // Zwracamy pustą tablicę w przypadku błędu 404/204, jeśli płatności nie istnieją
            if (error.response && (error.response.status === 404 || error.response.status === 204)) return [];
            throw error;
        }
    },

    // Aktualizacja statusu płatności
    updatePaymentStatus: async (paymentId, data) => {
        // Endpoint: PUT /api/payments/{id} (tylko status)
        try {
            const response = await api.put(`/payments/${paymentId}`, data);
            return response.data;
        } catch (error) {
            console.error(`Błąd aktualizacji statusu płatności ${paymentId}:`, error);
            throw error;
        }
    },

    // Symulacja płatności
    simulatePayment: async (paymentId, scenario = 'SUCCESS') => {
        // Endpoint: POST /api/payments/{paymentId}/simulate
        try {
            const response = await api.post(`/payments/${paymentId}/simulate?scenario=${scenario}`);
            return response.data;
        } catch (error) {
            console.error('Błąd symulacji płatności:', error);
            throw error;
        }
    },
};