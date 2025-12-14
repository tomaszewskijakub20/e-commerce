import api from './api';

export const addressService = {
    // GET /api/addresses/user/{userId}/active
    getAddresses: async (userId) => {
        try {
            const response = await api.get(`/addresses/user/${userId}/active`);
            return response.data;
        } catch (error) {
            console.error('Błąd pobierania adresów:', error);
            throw error;
        }
    },

    // POST /api/addresses
    addAddress: async (addressData) => {
        try {
            const response = await api.post('/addresses', addressData);
            return response.data;
        } catch (error) {
            console.error('Błąd dodawania adresu:', error);
            throw error;
        }
    },

    // PUT /api/addresses/{id}
    updateAddress: async (id, addressData) => {
        try {
            const response = await api.put(`/addresses/${id}`, addressData);
            return response.data;
        } catch (error) {
            console.error(`Błąd aktualizacji adresu ${id}:`, error);
            throw error;
        }
    },

    // DELETE /api/addresses/{id} (soft delete)
    deleteAddress: async (id) => {
        try {
            await api.delete(`/addresses/${id}`);
            return true;
        } catch (error) {
            console.error(`Błąd usuwania adresu ${id}:`, error);
            throw error;
        }
    }
};