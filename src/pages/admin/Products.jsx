import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package, Plus, Search, Edit3, Trash2,
    Eye, ChevronLeft, ChevronRight,
    ArrowLeft, Loader, X,
    CheckCircle, XCircle, AlertTriangle, Info
} from "lucide-react";
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Komponent uniwersalnego modalu potwierdzenia
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


export default function Products() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Stan danych
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Stan filtrów i paginacji
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategoryName, setSelectedCategoryName] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);

    // Stan modala usuwania
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const canManageProducts = user?.role === 'owner';

    // Spłaszczanie kategorii (pomocnicza funkcja)
    const flattenCategories = (categoriesList, level = 0) => {
        let result = [];
        if (!Array.isArray(categoriesList)) return result;

        categoriesList.forEach(category => {
            result.push({
                ...category,
                displayName: '  '.repeat(level) + category.name
            });
            if (category.children && category.children.length > 0) {
                result = result.concat(flattenCategories(category.children, level + 1));
            }
        });
        return result;
    };

    // Wymuszamy, aby funkcja odświeżająca była dostępna (dla confirmDelete)
    const fetchProducts = useMemo(() => {
        // Wewnętrzna funkcja do pobierania produktów
        return async () => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams();
                if (searchTerm) params.append('query', searchTerm);
                params.append('page', currentPage);
                params.append('size', itemsPerPage);
                params.append('sort', 'id,asc');
                params.append('isActive', true); // Wyświetlamy tylko aktywne

                const requestBody = {};

                // Dodaj nazwę kategorii do query stringa
                if (selectedCategoryName) {
                    // Jeśli jest kategoria, filtrujemy po niej, dodając searchTerm do zapytania
                    if (!searchTerm) params.set('query', selectedCategoryName);
                    else params.set('query', `${searchTerm} ${selectedCategoryName}`);
                }

                // POST /api/search
                const response = await api.post(`/search?${params.toString()}`, requestBody);

                const data = response.data;
                setProducts(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalProducts(data.totalElements || 0);

            } catch (err) {
                setError("Błąd ładowania produktów: " + (err.response?.data?.message || err.message));
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
    }, [currentPage, searchTerm, selectedCategoryName, itemsPerPage]);

    // Pobieranie kategorii (tylko raz)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories/active');
                const data = response.data?.content || response.data || [];
                setCategories(flattenCategories(data));
            } catch (err) {
                console.error("Błąd pobierania kategorii:", err);
            }
        };
        fetchCategories();
    }, []);

    // Trigger pobierania produktów po zmianie filtrów/paginacji
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [currentPage, searchTerm, selectedCategoryName, fetchProducts]);

    // Reset strony przy zmianie filtrów
    useEffect(() => {
        setCurrentPage(0);
    }, [searchTerm, selectedCategoryName]);

    // Obsługa usunięcia
    const handleDeleteClick = (product) => {
        if (!canManageProducts) {
            setError("Nie masz uprawnień do usuwania produktów");
            return;
        }
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            setDeleteLoading(true);
            await api.delete(`/products/${productToDelete.id}`);
            // Odświeża listę produktów
            await fetchProducts();

        } catch (err) {
            const errorMessage = err.response?.status === 403
                ? "Brak uprawnień do usunięcia produktu."
                : "Błąd usuwania produktu: " + (err.response?.data?.message || err.message);
            setError(errorMessage);
        } finally {
            setDeleteLoading(false);
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    // Nawigacja
    const handleBackToAdmin = () => navigate("/account/admin");
    const handleAddProduct = () => navigate("/admin/products/add");
    const handleEditProduct = (productId) => navigate(`/admin/products/${productId}/edit`);
    const handleViewProduct = (productId) => navigate(`/admin/products/${productId}`);

    // Formatowanie ceny
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price || 0);
    };

    // Obliczanie zakresu elementów na stronie
    const startIndex = currentPage * itemsPerPage + 1;
    const endIndex = Math.min((currentPage + 1) * itemsPerPage, totalProducts);


    if (loading && products.length === 0 && !searchTerm) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-gray-600" />
                <p className="mt-4 text-gray-600 ml-2">Ładowanie produktów...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Nagłówek */}
                <div className="mb-8 pt-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Zarządzanie produktami</h1>
                            <p className="text-gray-600 mt-2">
                                Zarządzaj katalogiem produktów, dodawaj nowe i edytuj istniejące
                            </p>
                            {!canManageProducts && (
                                <p className="text-sm text-orange-600 mt-1">
                                    Tryb podglądu - brak uprawnień do edycji i usuwania
                                </p>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleBackToAdmin}
                                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Powrót do panelu</span>
                            </button>
                            {canManageProducts && (
                                <button
                                    onClick={handleAddProduct}
                                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Dodaj produkt</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Komunikat o błędzie */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError("")}><X className="h-5 w-5" /></button>
                    </div>
                )}

                {/* Filtry i wyszukiwanie */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Szukaj produktów
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Szukaj po nazwie..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kategoria
                            </label>
                            <select
                                value={selectedCategoryName}
                                onChange={(e) => setSelectedCategoryName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                            >
                                <option value="">Wszystkie kategorie</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.name}>
                                        {category.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalProducts}
                                </p>
                                <p className="text-sm text-gray-600">Aktywne produkty</p>
                            </div>
                            <Package className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {categories.length}
                                </p>
                                <p className="text-sm text-gray-600">Dostępne kategorie</p>
                            </div>
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabela produktów */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading && products.length === 0 ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader className="h-6 w-6 animate-spin text-gray-600" />
                            <span className="ml-2 text-gray-600">Ładowanie...</span>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produkt
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kategoria
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cena
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Akcje
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                                    <p className="text-lg font-medium">Brak produktów</p>
                                                    <p className="mt-2">
                                                        {searchTerm || selectedCategoryName
                                                            ? "Spróbuj zmienić kryteria wyszukiwania"
                                                            : "Dodaj pierwszy produkt do sklepu"}
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                {product.thumbnailUrl ? (
                                                                    <img
                                                                        className="h-10 w-10 rounded-lg object-cover"
                                                                        src={product.thumbnailUrl}
                                                                        alt={product.name}
                                                                    />
                                                                ) : (
                                                                    <Package className="h-5 w-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <button
                                                                    onClick={() => handleViewProduct(product.id)}
                                                                    className="text-sm font-medium text-gray-900 text-left hover:text-blue-600 transition-colors"
                                                                >
                                                                    {product.name}
                                                                </button>
                                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                    {product.shortDescription}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {product.categoryName || 'Brak'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatPrice(product.price)} zł
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleViewProduct(product.id)}
                                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                                title="Podgląd"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            {canManageProducts && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEditProduct(product.id)}
                                                                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                                                                        title="Edytuj"
                                                                    >
                                                                        <Edit3 className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteClick(product)}
                                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                                        title="Usuń"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginacja */}
                            {totalPages > 1 && (
                                <div className="bg-white px-6 py-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Pokazano {startIndex}-{endIndex} z {totalProducts} produktów
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                                                disabled={currentPage === 0}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>

                                            <span className="px-3 py-1 text-sm text-gray-700">
                                                Strona {currentPage + 1} z {totalPages}
                                            </span>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                                                disabled={currentPage === totalPages - 1}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal potwierdzenia usunięcia */}
                <ConfirmationModal
                    show={showDeleteModal}
                    onClose={cancelDelete}
                    onConfirm={confirmDelete}
                    title={`Potwierdź usunięcie produktu`}
                    message={`Czy na pewno chcesz trwale usunąć produkt "${productToDelete?.name}"? Tej operacji nie można cofnąć.`}
                    confirmText="Usuń produkt"
                    cancelText="Anuluj"
                    type="danger"
                    isProcessing={deleteLoading}
                />
            </div>
        </div>
    );
}