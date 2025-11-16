import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, Settings, ShoppingBag, LogOut, Shield, Package, 
  Users, BarChart3, FolderOpen, Edit3, X, Loader
} from "lucide-react";
import api from "../services/api";

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Stan dla statystyk
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    users: 0,
    revenue: 0,
    loading: true
  });

  // Pobierz statystyki gdy otwieramy panel admina
  useEffect(() => {
    if (activeTab === "admin") {
      loadStats();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Pobierz statystyki produktów z endpointu
      const [productsStatsResponse, productsResponse, categoriesResponse] = await Promise.allSettled([
        api.get('/products/stats'),
        api.get('/products?size=1000'),
        api.get('/categories')
      ]);

      let productsCount = 0;
      let categoriesCount = 0;
      let featuredProducts = 0;
      let activeProducts = 0;

      // Obsłuż statystyki produktów
      if (productsStatsResponse.status === 'fulfilled') {
        const statsData = productsStatsResponse.value.data;
        console.log('📊 Statystyki produktów:', statsData);
        
        productsCount = statsData.totalProducts || 0;
        featuredProducts = statsData.featuredProducts || 0;
        activeProducts = statsData.activeProducts || 0;
      } else if (productsResponse.status === 'fulfilled') {
        // Fallback - policz ręcznie jeśli endpoint stats nie działa
        const productsData = productsResponse.value.data;
        productsCount = productsData.totalElements || productsData.length || 0;
      }

      // Policz kategorie
      if (categoriesResponse.status === 'fulfilled') {
        const categoriesData = categoriesResponse.value.data;
        categoriesCount = flattenCategories(categoriesData).length;
      }

      // Tymczasowe statystyki - zastąp prawdziwymi danymi gdy będą endpointy
      // TODO: Dodaj endpointy dla orders, users, revenue
      setStats({
        orders: 1247, // Tymczasowo - potrzebny endpoint /api/stats/orders
        products: productsCount,
        users: 892,   // Tymczasowo - potrzebny endpoint /api/stats/users  
        revenue: 124999, // Tymczasowo - potrzebny endpoint /api/stats/revenue
        loading: false,
        featuredProducts: featuredProducts,
        activeProducts: activeProducts,
        categories: categoriesCount
      });

    } catch (error) {
      console.error('Błąd ładowania statystyk:', error);
      // Fallback do ręcznego liczenia
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          api.get('/products?size=1000'),
          api.get('/categories')
        ]);

        const productsCount = productsResponse.data.totalElements || productsResponse.data.length || 0;
        const categoriesCount = flattenCategories(categoriesResponse.data).length;

        setStats({
          orders: 1247,
          products: productsCount,
          users: 892,
          revenue: 124999,
          loading: false,
          categories: categoriesCount
        });
      } catch (fallbackError) {
        console.error('Błąd fallback:', fallbackError);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
  };

  // Funkcja do spłaszczania kategorii (tak jak w Products.jsx)
  const flattenCategories = (categoriesList, level = 0) => {
    let result = [];
    categoriesList.forEach(category => {
      result.push({
        ...category,
        displayName: '  '.repeat(level) + category.name
      });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  // Reszta kodu pozostaje bez zmian...
  const userData = {
    email: user?.email || "admin@eshop.pl",
    firstName: "Adam",
    lastName: "Nowak",
    joinDate: "2023-06-10",
    role: user?.role || "user"
  };

  const [formData, setFormData] = useState({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email
  });

  const menuItems = [
    {
      id: "profile",
      label: "Mój profil",
      icon: User,
      description: "Zarządzaj swoimi danymi osobowymi"
    },
    {
      id: "orders", 
      label: "Moje zamówienia",
      icon: ShoppingBag,
      description: "Historia i śledzenie zamówień"
    },
    {
      id: "settings",
      label: "Ustawienia",
      icon: Settings,
      description: "Preferencje konta i powiadomienia"
    }
  ];

  if (userData.role === "owner") {
    menuItems.push({
      id: "admin",
      label: "Panel administratora",
      icon: Shield,
      description: "Zarządzanie sklepem i użytkownikami"
    });
  }

  const handleEditToggle = () => {
    if (isEditing) {
      console.log('Zapisz zmiany:', formData);
    }
    setIsEditing(!isEditing);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email
    });
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const renderProfileContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Edytuj profil</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleEditToggle}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>Zapisz zmiany</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>Anuluj</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imię *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Wpisz imię"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwisko *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Wpisz nazwisko"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Wpisz email"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Mój profil</h3>
          <button
            onClick={handleEditToggle}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edytuj dane</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imię
            </label>
            <p className="text-gray-900">{userData.firstName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwisko
            </label>
            <p className="text-gray-900">{userData.lastName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900">{userData.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data dołączenia
            </label>
            <p className="text-gray-900">
              {new Date(userData.joinDate).toLocaleDateString('pl-PL')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('pl-PL').format(number);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileContent();
      
      case "orders":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Moje zamówienia</h3>
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">Brak historii zamówień</p>
              <p className="text-sm text-gray-400">Tutaj pojawią się Twoje zamówienia</p>
            </div>
          </div>
        );
      
      case "settings":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Ustawienia konta</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Powiadomienia email</p>
                  <p className="text-sm text-gray-500">Otrzymuj powiadomienia o promocjach</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Newsletter</p>
                  <p className="text-sm text-gray-500">Otrzymuj najnowsze informacje</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
            </div>
          </div>
        );
      
      case "admin":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Panel administratora</h3>
            <p className="text-gray-600">Zarządzaj wszystkimi aspektami sklepu</p>
            
            {/* Statystyki */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.loading ? (
                <>
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="flex justify-center items-center h-8">
                        <Loader className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Ładowanie...</p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.orders)}
                    </p>
                    <p className="text-sm text-gray-600">Zamówienia</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.products)}
                    </p>
                    <p className="text-sm text-gray-600">Produkty</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.users)}
                    </p>
                    <p className="text-sm text-gray-600">Użytkownicy</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.revenue)}
                    </p>
                    <p className="text-sm text-gray-600">Przychód</p>
                  </div>
                </>
              )}
            </div>

            {/* Karty funkcjonalności */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <Link 
                to="/admin/products"
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Produkty</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Zarządzaj katalogiem produktów, dodawaj nowe, edytuj ceny i stan magazynowy
                </p>
                <div className="flex space-x-2">
                  <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded">
                    Przeglądaj
                  </span>
                </div>
              </Link>

              <div className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Zamówienia</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Przeglądaj i zarządzaj wszystkimi zamówieniami, zmieniaj statusy wysyłki
                </p>
                <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                  Zarządzaj zamówieniami
                </button>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Użytkownicy</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Zarządzaj użytkownikami, przeglądaj historię, nadawaj uprawnienia
                </p>
                <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
                  Przeglądaj użytkowników
                </button>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Statystyki</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Analiza sprzedaży, popularne produkty, raporty finansowe i metryki
                </p>
                <button className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700">
                  Zobacz raporty
                </button>
              </div>

              <Link 
              to="/admin/categories"
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors block"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Kategorie</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Zarządzaj kategoriami produktów, tworz nowe, edytuj strukturę
                </p>
                <div className="flex space-x-2">
                  <span className="text-xs bg-red-600 text-white px-3 py-1 rounded">
                    Zarządzaj
                  </span>
                </div>
              </Link>

              <div className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Settings className="h-6 w-6 text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Ustawienia sklepu</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Konfiguracja sklepu, metody płatności, dostawy, waluty, podatki
                </p>
                <button className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                  Konfiguruj
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Moje konto</h1>
          <p className="text-gray-600 mt-2">
            Witaj, {userData.firstName}! Zarządzaj swoim kontem i ustawieniami.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
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
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                          activeTab === item.id
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
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

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* CUSTOM MODAL DO POTWIERDZENIA WYLOGOWANIA */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Potwierdzenie wylogowania</h3>
                <button
                  onClick={cancelLogout}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Czy na pewno chcesz się wylogować?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelLogout}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Wyloguj się
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}