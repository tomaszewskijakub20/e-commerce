import api from './api';

export const contactService = {
    sendMessage: async (contactData) => {
        try {
            // Endpoint: POST /api/contact
            const response = await api.post('/contact', contactData);
            return response.data;
        } catch (error) {
            console.error('Błąd wysyłania wiadomości:', error);
            throw error;
        }
    }
};