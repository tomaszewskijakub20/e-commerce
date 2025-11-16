import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Funkcja do dekodowania tokena JWT (nadal potrzebna do ról)
const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Błąd dekodowania tokena:', error);
    return null;
  }
};

// Funkcja do pobierania roli z tokena
const getRoleFromToken = (token) => {
  const decoded = decodeJWT(token);
  // Zgodnie z dokumentacją, backend może nie umieszczać ról w /auth/me,
  // więc dekodowanie tokena jest najlepszym miejscem na to.
  if (decoded && decoded.roles) {
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
    
    if (roles.includes('ROLE_OWNER')) return 'owner';
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_USER')) return 'user';
  }
  return 'user'; // Domyślnie
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] =useState(true); // Zaczynamy jako true

  useEffect(() => {
    // Ta funkcja uruchomi się tylko raz, przy starcie aplikacji
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Sprawdź, czy token w ogóle istnieje
      if (authService.isAuthenticated()) {
        
        // 1. KLUCZOWY KROK: Weryfikujemy token z backendem
        const userData = await authService.getMe(); // To jest GET /api/auth/me

        // 2. Token jest ważny. Pobierzmy go, by odczytać rolę
        const token = authService.getToken();
        const userRole = getRoleFromToken(token);
        
        setUser({ 
          email: userData.email, // Używamy emaila z odpowiedzi /me
          role: userRole,
          isAuthenticated: true
        });

      }
    } catch (error) {
      // Jeśli authService.getMe() zwróci błąd (np. 401), to znaczy, że token jest nieważny
      console.log('Automatyczne wylogowanie z powodu błędu weryfikacji tokena:', error);
      authService.logout(); // Wyczyść zły token
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    // authService.login zapisuje token w localStorage
    const response = await authService.login(credentials); 
    const token = response.token;
    
    if (token) {
      const userRole = getRoleFromToken(token);
      
      setUser({ 
        email: response.email, // Używamy emaila z odpowiedzi /login
        role: userRole,
        isAuthenticated: true
      });
      
      return response;
    }
    
    throw new Error('Brak tokena w odpowiedzi');
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // Przekierowanie jest OK, ale czystsze będzie użycie useNavigate w komponencie
    // window.location.href = '/'; 
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  // Nie renderuj aplikacji, dopóki sprawdzanie się nie zakończy
  if (loading) {
    // Możesz tu wstawić globalny spinner / ekran ładowania
    return <div>Ładowanie...</div>; 
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};