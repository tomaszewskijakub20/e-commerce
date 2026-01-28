import api from './api';

export const paymentService = {
    // Tworzenie płatności (Zalogowany użytkownik)
    createPayment: async (paymentData) => {
        try {
            const response = await api.post('/payments', paymentData);
            return response.data;
        } catch (error) {
            console.error('Błąd tworzenia płatności:', error);
            throw error;
        }
    },

    // Tworzenie płatności (Gość)
    createGuestPayment: async (guestPaymentData) => {
        try {
            const response = await api.post('/payments/guest', guestPaymentData);
            return response.data;
        } catch (error) {
            console.error('Błąd tworzenia płatności dla gościa:', error);
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

    // Symulacja płatności (Zalogowany użytkownik)
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

    // Symulacja płatności (Gość)
    simulateGuestPayment: async (paymentId, email, scenario = 'SUCCESS') => {
        // Endpoint: POST /api/payments/guest/{paymentId}/simulate
        try {
            const response = await api.post(`/payments/guest/${paymentId}/simulate`, null, {
                params: {
                    email: email,
                    scenario: scenario
                }
            });
            return response.data;
        } catch (error) {
            console.error('Błąd symulacji płatności dla gościa:', error);
            throw error;
        }
    },
};