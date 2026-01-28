import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import {
    Loader, ClipboardList, ArrowLeft, ChevronLeft, ChevronRight,
    Edit3, X, Save, Package, ImageOff
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080';

// Ilość produktów wyświetlana na stronę
const DEFAULT_PAGE_SIZE = 20;

// Helper do obrazków
const getImageUrl = (path) => {
    if (!path) return null;
    // Jeśli link jest już pełny (np. zewnętrzny CDN), zwróć go
    if (path.startsWith('http')) return path;
    // W przeciwnym razie doklej adres backendu
    return `${API_BASE_URL}${path}`;
};

// Modal do edycji
const EditInventoryModal = ({ show, onClose, item, onSave, isProcessing }) => {
    const [quantity, setQuantity] = useState(0);

    useEffect(() => {
        if (item) {
            setQuantity(item.availableQuantity || 0);
        }
    }, [item]);

    if (!show || !item) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(item.id, quantity);
    };

    const imageUrl = getImageUrl(item.thumbnailUrl);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Edytuj stan magazynowy</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={item.productName} 
                            className="h-10 w-10 object-cover rounded bg-white border border-gray-200"
                            onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.className = 'hidden'; }} 
                        />
                    ) : (
                        <div className="h-10 w-10 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-400">
                            <Package className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1" title={item.productName}>
                            {item.productName}
                        </p>
                        {item.sku && (
                            <p className="text-xs text-gray-500 font-mono">SKU: {item.sku}</p>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                            Dostępna ilość (szt.)
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Zarezerwowane: {item.reservedQuantity || 0} | Minimum: {item.minimumStockLevel || 0}
                        </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                            disabled={isProcessing}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 flex items-center"
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Zapisz
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Inventory() {
    const navigate = useNavigate();
    
    // Stan danych
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Stan edycji
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Inicjalizacja paginacji z większym rozmiarem strony
    const [pagination, setPagination] = useState({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalElements: 0
    });

    const getStockStyle = (quantity, minLevel = 0) => {
        if (quantity === 0) return 'text-red-600 bg-red-50 border-red-200';
        if (quantity <= minLevel) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-green-700 bg-green-50 border-green-200';
    };

    const fetchInventory = useCallback(async (page, size) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                size,
                sortBy: 'id',
                sortDir: 'asc'
            };
            
            const response = await api.get('/inventory', { params });
            const data = response.data;

            setInventory(data.content || []);
            setPagination({
                page: data.number || 0,
                size: data.size || size,
                totalPages: data.totalPages || 1,
                totalElements: data.totalElements || 0,
            });

        } catch (err) {
            console.error('Błąd ładowania magazynu:', err);
            setError("Nie udało się załadować stanów magazynowych.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Ładowanie przy zmianie strony
    useEffect(() => {
        fetchInventory(pagination.page, pagination.size);
    }, [pagination.page, fetchInventory]); 

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setEditModalOpen(true);
    };

    const handleSaveInventory = async (id, newQuantity) => {
        setActionLoading(true);
        try {
            const payload = {
                availableQuantity: newQuantity,
                reservedQuantity: selectedItem.reservedQuantity,
                minimumStockLevel: selectedItem.minimumStockLevel,
                isActive: selectedItem.isActive
            };

            await api.put(`/inventory/${id}`, payload);
            
            setEditModalOpen(false);
            setSelectedItem(null);
            fetchInventory(pagination.page, pagination.size);
        } catch (err) {
            console.error(err);
            alert("Błąd zapisu: " + (err.response?.data?.message || "Wystąpił błąd"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleBackToAdmin = () => navigate("/account/admin");

    const startIndex = pagination.page * pagination.size + 1;
    const endIndex = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements);
    
    const paginatedInventory = useMemo(() => inventory, [inventory]);

    if (loading && inventory.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
                    <p className="mt-4 text-gray-600">Ładowanie asortymentu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                <div className="mb-8 pt-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Asortymentem</h1>
                            <p className="text-gray-600 mt-2">
                                Przeglądaj i edytuj stany magazynowe produktów.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleBackToAdmin}
                                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Powrót do panelu</span>
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                        <button
                            onClick={() => fetchInventory(pagination.page, pagination.size)}
                            className="ml-4 text-sm underline hover:no-underline"
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading && inventory.length > 0 ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader className="h-6 w-6 animate-spin text-gray-600" />
                            <span className="ml-2 text-gray-600">Odświeżanie...</span>
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg">
                            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-gray-600">Brak pozycji w magazynie.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                                ID Produktu
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produkt
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dostępna Ilość
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Akcje
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedInventory.map((item) => {
                                            // Generujemy pełny URL do miniatury
                                            const thumbSrc = getImageUrl(item.thumbnailUrl);
                                            
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                        #{item.productId}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-12 w-12 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                                                {thumbSrc ? (
                                                                    <img
                                                                        className="h-full w-full object-cover"
                                                                        src={thumbSrc}
                                                                        alt={item.productName}
                                                                        onError={(e) => {
                                                                            // Fallback jeśli obrazek nie istnieje
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'block';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <ImageOff className="h-5 w-5 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
                                                                    {item.productName || "Nieznany produkt"}
                                                                </div>
                                                                <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                                    SKU: {item.sku || "-"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStockStyle(item.availableQuantity, item.minimumStockLevel)}`}>
                                                                {item.availableQuantity} szt.
                                                            </span>
                                                            {(item.reservedQuantity > 0 || item.minimumStockLevel > 0) && (
                                                                <div className="text-[10px] text-gray-400 mt-1 flex gap-2">
                                                                    {item.reservedQuantity > 0 && <span>Rez: {item.reservedQuantity}</span>}
                                                                    {item.minimumStockLevel > 0 && <span>Min: {item.minimumStockLevel}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50 transition-colors inline-flex items-center"
                                                            title="Edytuj ilość"
                                                        >
                                                            <Edit3 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.totalPages > 1 && (
                                <div className="bg-white px-6 py-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Pokazano {startIndex}-{endIndex} z {pagination.totalElements} pozycji
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                disabled={pagination.page === 0}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>

                                            <span className="px-3 py-1 text-sm text-gray-700">
                                                Strona {pagination.page + 1} z {pagination.totalPages}
                                            </span>

                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                disabled={pagination.page >= pagination.totalPages - 1}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            <EditInventoryModal 
                show={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                item={selectedItem}
                onSave={handleSaveInventory}
                isProcessing={actionLoading}
            />
        </div>
    );
}