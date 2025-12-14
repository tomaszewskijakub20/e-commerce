import api from './api';

export const authService = {
  // Rejestracja
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Błąd rejestracji:', error);
      throw error;
    }
  },

  // Logowanie
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      console.error('Błąd logowania:', error);
      throw error;
    }
  },

  // Resetowanie hasła
  resetPassword: async ({ token, newPassword }) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Błąd resetowania hasła:', error);
      throw error;
    }
  },

  // Pobierz dane zalogowanego użytkownika (ZWERYFIKUJ TOKEN)
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Błąd pobierania danych użytkownika (token może być nieważny):', error);
      throw error;
    }
  },

  // Wylogowanie
  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  },

  // Sprawdź czy token istnieje lokalnie (szybkie sprawdzenie)
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Pobierz token
  getToken: () => {
    return localStorage.getItem('token');
  }
};