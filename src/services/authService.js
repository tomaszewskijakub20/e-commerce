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

  // Pobierz dane zalogowanego użytkownika (ZWERYFIKUJ TOKEN)
  getMe: async () => {
    try {
      // Interceptor w api.js automatycznie doda token z localStorage
      const response = await api.get('/auth/me');
      return response.data; // Zwraca { email: "..." }
    } catch (error) {
      console.error('Błąd pobierania danych użytkownika (token może być nieważny):', error);
      throw error;
    }
  },

  // Wylogowanie
  logout: () => {
    localStorage.removeItem('token');
    // Usuń token z headers axios
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