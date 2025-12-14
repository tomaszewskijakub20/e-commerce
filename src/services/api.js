import axios from 'axios';

// Odczyt bazowego URL z zmiennych środowiskowych (fallback na localhost)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Główna instancja klienta HTTP Axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor żądania: Automatyczne dodawanie tokena autoryzacyjnego (Bearer Token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor odpowiedzi: Globalna obsługa błędów autoryzacji (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sprawdź, czy status błędu to 401
    if (error.response?.status === 401) {
      // Wyczyść token i usuń nagłówek autoryzacyjny
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];

      // Przekierowanie do strony logowania, jeśli użytkownik nie jest już na niej
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;