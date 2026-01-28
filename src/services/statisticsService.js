import api from './api';

export const statisticsService = {
    // GET /api/statistics/sales
    getSalesStatistics: async (startDate, endDate) => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const response = await api.get('/statistics/sales', { params });
            return response.data;
        } catch (error) {
            console.error('Błąd pobierania statystyk sprzedaży:', error);
            throw error;
        }
    },

    // GET /api/statistics/sales/monthly
    getMonthlySales: async (startDate, endDate) => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const response = await api.get('/statistics/sales/monthly', { params });
            return response.data;
        } catch (error) {
            console.error('Błąd pobierania sprzedaży miesięcznej:', error);
            throw error;
        }
    },

    // GET /api/statistics/products/top-by-quantity
    getTopProductsByQuantity: async (startDate, endDate, limit = 5) => {
        try {
            const params = { limit };
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const response = await api.get('/statistics/products/top-by-quantity', { params });
            return response.data;
        } catch (error) {
            console.error('Błąd pobierania top produktów (ilość):', error);
            throw error;
        }
    },

    // GET /api/statistics/products/top-by-revenue
    getTopProductsByRevenue: async (startDate, endDate, limit = 5) => {
        try {
            const params = { limit };
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const response = await api.get('/statistics/products/top-by-revenue', { params });
            return response.data;
        } catch (error) {
            console.error('Błąd pobierania top produktów (przychód):', error);
            throw error;
        }
    }
};