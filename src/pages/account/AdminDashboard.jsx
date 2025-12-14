import { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { Loader, Package, Users, BarChart3, FolderOpen, ShoppingBag, Settings, XCircle } from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useAuth(); // Weryfikacja roli
    const navigate = useNavigate();
    
    // Obiekt danych użytkownika
    const userData = user ? {
        id: user.id,
        role: user.role
    } : { id: null, role: 'guest' };

    // Weryfikacja uprawnień: blokowanie dostępu, jeśli rola nie jest 'owner'.
    if (userData.role !== 'owner') {
        return (
            <div className="text-center py-12">
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-xl font-bold text-gray-900">Brak dostępu</h3>
                <p className="text-gray-600">Nie masz uprawnień do Panelu Administratora.</p>
                <Link to="/account/profile" className="mt-4 inline-flex text-blue-600 hover:text-blue-800">
                    Wróć do mojego profilu
                </Link>
            </div>
        );
    }
    
    // Funkcja formatowania liczby
    const formatNumber = (number) => {
        return new Intl.NumberFormat('pl-PL').format(number);
    };

    // Funkcja formatowania waluty
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Mock danych dla statystyk
    const stats = {
        orders: 1247, products: 80, users: 892, revenue: 124999, loading: false
    };


    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Panel administratora</h3>
            <p className="text-gray-600">Wybierz sekcję, którą chcesz zarządzać.</p>

            {/* Sekcja kart nawigacyjnych */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                
                {/* Karta: Zarządzanie Produktami */}
                <Link
                    to="/admin/products"
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Zarządzanie Produktami</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Dodawaj, edytuj i przeglądaj produkty.</p>
                    <div className="flex space-x-2">
                        <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded">
                            Przeglądaj
                        </span>
                    </div>
                </Link>

                {/* Karta: Zarządzanie Kategoriami */}
                <Link
                    to="/admin/categories"
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FolderOpen className="h-6 w-6 text-red-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Zarządzanie Kategoriami</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Zarządzaj kategoriami produktów, twórz nowe, edytuj strukturę</p>
                    <div className="flex space-x-2">
                        <span className="text-xs bg-red-600 text-white px-3 py-1 rounded">
                            Zarządzaj
                        </span>
                    </div>
                </Link>
                
                {/* Karta: Zarządzanie Zamówieniami */}
                <Link
                    to="/admin/orders"
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ShoppingBag className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Zarządzanie Zamówieniami</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Monitoruj statusy i realizuj zamówienia.</p>
                    <div className="flex space-x-2">
                        <span className="text-xs bg-green-600 text-white px-3 py-1 rounded">
                            Zarządzaj zamówieniami
                        </span>
                    </div>
                </Link>

                {/* Karta: Zarządzanie Użytkownikami */}
                <Link
                    to="/admin/users"
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Zarządzanie Użytkownikami</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Zarządzaj użytkownikami, przeglądaj historię, nadawaj uprawnienia</p>
                    <div className="flex space-x-2">
                        <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded">
                            Przeglądaj użytkowników
                        </span>
                    </div>
                </Link>

                {/* Karta: Raporty i Statystyki */}
                <Link
                    to="/admin/stats"
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-orange-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Raporty i Statystyki</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Analiza sprzedaży, popularne produkty, raporty finansowe i metryki</p>
                    <div className="flex space-x-2">
                        <span className="text-xs bg-orange-600 text-white px-3 py-1 rounded">
                            Zobacz raporty
                        </span>
                    </div>
                </Link>

                {/* Karta: Ustawienia Sklepu */}
                <Link
                    to="/admin/settings"
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
                >
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Settings className="h-6 w-6 text-gray-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Ustawienia Sklepu</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Konfiguracja sklepu, metody płatności, dostawy, waluty, podatki</p>
                    <div className="flex space-x-2">
                        <span className="text-xs bg-gray-600 text-white px-3 py-1 rounded">
                            Konfiguruj
                        </span>
                    </div>
                </Link>
            </div>
        </div>
    );
}