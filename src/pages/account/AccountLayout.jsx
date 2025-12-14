import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
    User, Settings, ShoppingBag, LogOut, Shield, MapPin, X, CheckCircle,
    AlertTriangle, XCircle, Info, Loader
} from "lucide-react";

// Mapa tłumaczeń statusów zamówienia
const orderStatusMap = {
    'NEW': 'Nowe',
    'PENDING': 'W trakcie realizacji',
    'CONFIRMED': 'Potwierdzone',
    'SHIPPED': 'Wysłane',
    'DELIVERED': 'Dostarczone',
    'COMPLETED': 'Zakończone',
    'CANCELLED': 'Anulowane',
    'FAILED': 'Błąd zamówienia',
    'DEFAULT': 'Nieznany',
};


// Uniwersalny komponent modalu potwierdzenia
const ConfirmationModal = ({
    show, onClose, title, message, onConfirm,
    confirmText = 'Potwierdź', cancelText = 'Anuluj',
    type = 'info', isProcessing = false
}) => {
    if (!show) return null;

    const styles = {
        success: { Icon: CheckCircle, iconColor: 'text-green-600', confirmBg: 'bg-green-600 hover:bg-green-700' },
        danger: { Icon: XCircle, iconColor: 'text-red-600', confirmBg: 'bg-red-600 hover:bg-red-700' },
        warning: { Icon: AlertTriangle, iconColor: 'text-yellow-500', confirmBg: 'bg-yellow-600 hover:bg-yellow-700' },
        info: { Icon: Info, iconColor: 'text-blue-500', confirmBg: 'bg-blue-600 hover:bg-blue-700' },
    };

    const { Icon, iconColor, confirmBg } = styles[type] || styles.info;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <Icon className={`h-6 w-6 mr-3 ${iconColor}`} />
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4" disabled={isProcessing}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        disabled={isProcessing}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-white rounded-lg ${confirmBg} disabled:opacity-50 flex items-center`}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function AccountLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Ustalanie aktywnej zakładki na podstawie ścieżki URL
    const activeTab = useMemo(() => {
        const path = location.pathname.split('/').filter(p => p);

        if (path.length === 1 || (path[1] && path[1] === 'profile')) return 'profile';
        
        if (path.includes('orders')) return 'orders';

        return path[1] || 'profile'; 
    }, [location.pathname]);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null); 
    const [addressesError, setAddressesError] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false); // Stan ładowania dla wylogowania

    // Dane użytkownika
    const userData = useMemo(() => ({
        id: user?.id || 1,
        email: user?.email || "user@example.pl",
        firstName: user?.firstName || "Klient",
        lastName: user?.lastName || "Anonimowy",
        joinDate: "2023-06-10", 
        role: user?.role || "user"
    }), [user]);

    // Elementy menu nawigacyjnego
    const menuItems = [
        { id: "profile", label: "Mój profil", icon: User, description: "Zarządzaj swoimi danymi osobowymi" },
        { id: "orders", label: "Moje zamówienia", icon: ShoppingBag, description: "Historia i śledzenie zamówień" },
        { id: "addresses", label: "Adresy", icon: MapPin, description: "Adresy wysyłki i faktury" },
        { id: "settings", label: "Ustawienia", icon: Settings, description: "Preferencje konta i powiadomienia" }
    ];

    if (userData.role === "owner") {
        menuItems.push({ id: "admin", label: "Panel administratora", icon: Shield, description: "Zarządzanie sklepem i użytkownikami" });
    }
    
    // Funkcje obsługi wylogowania i modalu
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setIsLoggingOut(true);
        // Symulacja asynchronicznego wylogowania
        setTimeout(() => {
            logout();
            navigate('/');
            setShowLogoutModal(false);
            setIsLoggingOut(false);
        }, 500); 
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    // Kontekst przekazywany do zagnieżdżonych tras (Outlet)
    const accountContext = {
        userData,
        setSuccessMessage, 
        setAddressesError, 
        addressesError,
        orderStatusMap,
    };


    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 pt-8">
                    <h1 className="text-3xl font-bold text-gray-900">Moje konto</h1>
                    <p className="text-gray-600 mt-2">
                        Witaj, {userData.firstName}! Zarządzaj swoim kontem i ustawieniami.
                    </p>
                </div>

                {/* Komunikaty sukcesu/błędu */}
                {addressesError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
                        <X className="h-5 w-5 mr-2" />
                        <span>{addressesError}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            {successMessage}
                        </span>
                        <button onClick={() => setSuccessMessage(null)} className="text-green-700 font-bold ml-4">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}


                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Lewa kolumna: Nawigacja */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    {/* Profil użytkownika */}
                                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {userData.firstName} {userData.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500">{userData.email}</p>
                                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                            {userData.role === 'owner' ? 'Właściciel' : 'Użytkownik'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <nav className="p-4">
                                <ul className="space-y-2">
                                    {menuItems.map((item) => (
                                        <li key={item.id}>
                                            <Link
                                                to={item.id === 'profile' ? '/account' : `/account/${item.id}`}
                                                onClick={() => setAddressesError(null)}
                                                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${activeTab === item.id 
                                                    ? 'bg-black text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            <div className="p-4 border-t border-gray-200">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="font-medium">Wyloguj się</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Prawa kolumna: Treść (renderowana przez Outlet) */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[500px]">
                            <Outlet context={accountContext} />
                        </div>
                    </div>
                </div>

                {/* Modal potwierdzenia wylogowania */}
                <ConfirmationModal
                    show={showLogoutModal}
                    onClose={cancelLogout}
                    onConfirm={confirmLogout}
                    title="Potwierdzenie wylogowania"
                    message="Czy na pewno chcesz się wylogować z konta?"
                    confirmText="Wyloguj się"
                    cancelText="Anuluj"
                    type="danger"
                    isProcessing={isLoggingOut}
                />

            </div>
        </div>
    );
}