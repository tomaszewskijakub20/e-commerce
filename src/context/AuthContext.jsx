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

// Funkcja do dekodowania tokena JWT
const decodeJWT = (token) => {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch (error) {
        // Usunięto log
        return null;
    }
};

// Funkcja do pobierania roli z tokena
const getRoleFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (decoded && decoded.roles) {
        const roles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
        
        if (roles.includes('ROLE_OWNER')) return 'owner';
        if (roles.includes('ROLE_ADMIN')) return 'admin';
        if (roles.includes('ROLE_USER')) return 'user';
    }
    return 'user';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        setLoading(true);
        try {
            if (authService.isAuthenticated()) {
                const userData = await authService.getMe();
                
                const token = authService.getToken();
                const userRole = getRoleFromToken(token);
                
                setUser({ 
                    id: userData.id, 
                    email: userData.email, 
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userRole,
                    isAuthenticated: true
                });
            }
        } catch (error) {
            // Uproszczony log
            console.warn('Weryfikacja tokena nieudana, automatyczne wylogowanie.');
            authService.logout(); 
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            
            if (response.token) {
                // Po udanym logowaniu, wzywamy /auth/me, aby pobrać pełne dane (w tym ID)
                const userData = await authService.getMe();
                
                const token = response.token;
                const userRole = getRoleFromToken(token);
                
                const userObj = { 
                    id: userData.id, 
                    email: userData.email, 
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userRole,
                    isAuthenticated: true
                };
                
                setUser(userObj);
                
                return response;
            }
        } catch (error) {
            // Uproszczony log i przekazanie błędu dalej
            console.error('Błąd logowania:', error.response?.data?.message || 'Nieznany błąd logowania.');
            throw error;
        }
        
        throw new Error('Brak tokena w odpowiedzi');
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        logout,
        isAuthenticated: !!user
    };

    if (loading) {
        return <div>Ładowanie...</div>; 
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};