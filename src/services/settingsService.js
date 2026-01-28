import api from './api';

export const settingsService = {
    // Sklep
    getSettingsMap: async () => {
        try {
            const response = await api.get('/settings/map');
            return response.data;
        } catch (error) {
            // Jeśli mapa jest pusta lub endpoint nie działa, zwracamy pusty obiekt
            return {};
        }
    },

    getPublicSettings: async () => {
        try {
            const response = await api.get('/settings/public/footer');
            return response.data;
        } catch (error) {
            return {};
        }
    },

    // Inteligentny zapis (Update lub Create)
    updateSettingByKey: async (key, value) => {
        try {
            // Próbujemy zaktualizować istniejące ustawienie
            const response = await api.put(`/settings/key/${key}`, { value });
            return response.data;
        } catch (error) {
            // Jeśli otrzymamy 404 (Not Found), to znaczy, że ustawienie nie istnieje.
            // Musimy je utworzyć metodą POST.
            if (error.response && error.response.status === 404) {
                console.log(`Tworzenie nowego ustawienia: ${key}`);
                const createResponse = await api.post('/settings', {
                    key: key,
                    value: value,
                    description: `Ustawienie: ${key}`
                });
                return createResponse.data;
            }
            throw error;
        }
    },

    uploadLogo: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/settings/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteLogo: async () => {
        await api.delete('/settings/logo');
    },

    // Strony
    getAllPages: async () => {
        const response = await api.get('/pages');
        return response.data;
    },

    getPageBySlug: async (slug) => {
        const response = await api.get(`/pages/slug/${slug}`);
        return response.data;
    },

    createPage: async (pageData) => {
        const response = await api.post('/pages', pageData);
        return response.data;
    },

    updatePage: async (id, pageData) => {
        const response = await api.put(`/pages/${id}`, pageData);
        return response.data;
    },

    deletePage: async (id) => {
        await api.delete(`/pages/${id}`);
    },

    // Social Links
    getSocialLinks: async () => {
        const response = await api.get('/social-links');
        return response.data;
    },

    createSocialLink: async (data) => {
        const response = await api.post('/social-links', data);
        return response.data;
    },

    updateSocialLink: async (id, data) => {
        const response = await api.put(`/social-links/${id}`, data);
        return response.data;
    },

    deleteSocialLink: async (id) => {
        await api.delete(`/social-links/${id}`);
    },

    // FAQ
    getFaqItems: async () => {
        const response = await api.get('/faq');
        return response.data;
    },

    createFaqItem: async (data) => {
        const response = await api.post('/faq', data);
        return response.data;
    },

    updateFaqItem: async (id, data) => {
        const response = await api.put(`/faq/${id}`, data);
        return response.data;
    },

    deleteFaqItem: async (id) => {
        await api.delete(`/faq/${id}`);
    },

    // NEWSLETTER
    getSubscribers: async () => {
        const response = await api.get('/newsletter/subscriptions');
        return response.data;
    },

    sendNewsletter: async (data) => {
        const response = await api.post('/newsletter/send', data);
        return response.data;
    }
};