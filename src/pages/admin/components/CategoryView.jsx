import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
    ArrowLeft, Folder, Package, Calendar, Edit3, Trash2, 
    Loader, X, CheckSquare, Plus, Shield, 
    CheckCircle, AlertTriangle, XCircle, Info
} from "lucide-react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

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


export default function CategoryView() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { user } = useAuth();

    const [category, setCategory] = useState(null);
    const [subcategories, setSubcategories] = useState([]);
    const [products, setProducts] = useState([]); 
    const [totalProductsCount, setTotalProductsCount] = useState(0); 
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Stan modala usuwania kategorii
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Stan modala usuwania atrybutu
    const [showAttrDeleteModal, setShowAttrDeleteModal] = useState(false);
    const [attrToDelete, setAttrToDelete] = useState(null);
    const [attrDeleteLoading, setAttrDeleteLoading] = useState(false);

    const canManage = user?.role === 'owner';

    useEffect(() => {
        loadCategoryData();
    }, [id]);

    // Funkcja ładowania wszystkich danych kategorii
    const loadCategoryData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                categoryResponse, 
                subcategoriesResponse, 
                productsResponse,
                attributesResponse,
                productsCountResponse
            ] = await Promise.allSettled([
                api.get(`/categories/${id}`),
                api.get(`/categories/parent/${id}`),
                // Paginacja: Pobieramy tylko 5 produktów do podglądu
                api.get(`/products/category/${id}?page=0&size=5`), 
                api.get(`/categories/${id}/attributes`),
                api.get(`/products/stats/category/${id}/count`) 
            ]);

            if (categoryResponse.status === 'fulfilled') {
                setCategory(categoryResponse.value.data);
            } else {
                throw new Error("Nie udało się załadować kategorii.");
            }

            if (subcategoriesResponse.status === 'fulfilled') {
                setSubcategories(subcategoriesResponse.value.data);
            } else {
                console.error("Błąd ładowania podkategorii:", subcategoriesResponse.reason);
            }
            
            if (productsResponse.status === 'fulfilled') {
                setProducts(productsResponse.value.data.content || []); 
            } else {
                console.error("Błąd ładowania produktów:", productsResponse.reason);
            }

            if (productsCountResponse.status === 'fulfilled') {
                setTotalProductsCount(productsCountResponse.value.data || 0);
            } else {
                setTotalProductsCount(products.length); 
            }

            if (attributesResponse.status === 'fulfilled') {
                setAttributes(attributesResponse.value.data || []);
            } else {
                console.error("Błąd ładowania atrybutów:", attributesResponse.reason);
            }

        } catch (err) {
            setError(err.message || "Błąd ładowania danych kategorii");
        } finally {
            setLoading(false);
        }
    };
    
    // Logika usuwania kategorii (otwiera modal)
    const handleDeleteClick = () => {
        if (!canManage) return;
        setShowDeleteModal(true);
    };

    // Anulowanie usuwania kategorii
    const cancelDelete = () => {
        setShowDeleteModal(false);
    };

    // Potwierdzenie i wykonanie usuwania kategorii
    const confirmDelete = async () => {
        if (!canManage) return;
        try {
            setDeleteLoading(true);
            setError("");
            await api.delete(`/categories/${id}`);
            setDeleteLoading(false);
            setShowDeleteModal(false);
            // Przekierowanie z komunikatem sukcesu
            navigate('/admin/categories', { state: { successMessage: `Kategoria "${category?.name}" została usunięta.` } });
        } catch (err) {
            setError("Błąd podczas usuwania kategorii. Upewnij się, że nie ma do niej przypisanych produktów.");
            setDeleteLoading(false);
            setShowDeleteModal(false);
        }
    };

    // Logika usuwania atrybutu (otwiera modal)
    const handleAttributeDeleteClick = (attribute) => {
        if (!canManage) return;
        setAttrToDelete(attribute);
        setShowAttrDeleteModal(true);
    };

    // Anulowanie usuwania atrybutu
    const cancelAttributeDelete = () => {
        setShowAttrDeleteModal(false);
        setAttrToDelete(null);
    };

    // Potwierdzenie i wykonanie usuwania atrybutu
    const confirmAttributeDelete = async () => {
        if (!canManage || !attrToDelete) return;
        
        setAttrDeleteLoading(true);
        setError('');
        try {
            await api.delete(`/categories/${id}/attributes/${attrToDelete.id}`);
            
            setShowAttrDeleteModal(false);
            // Usuwanie z lokalnego stanu
            setAttributes(prev => prev.filter(attr => attr.id !== attrToDelete.id)); 
            setAttrToDelete(null);
        } catch (err) {
            setError("Błąd podczas usuwania atrybutu.");
        } finally {
            setAttrDeleteLoading(false);
        }
    };
    
    // Nawigacja do edycji kategorii
    const handleEdit = () => {
        if (!canManage) return;
        navigate(`/admin/categories/${id}/edit`);
    };

    // Nawigacja do dodawania podkategorii
    const handleAddSubcategory = () => {
        if (!canManage) return;
        navigate('/admin/categories/add', { state: { parentId: id } });
    };
    
    // Nawigacja do dodawania atrybutu
    const handleAddAttribute = () => {
        if (!canManage) return;
        navigate(`/admin/categories/${id}/attributes/add`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
                    <p className="mt-4 text-gray-600">Ładowanie kategorii...</p>
                </div>
            </div>
        );
    }

    if (error && !category) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Błąd ładowania</h3>
                    <p className="text-gray-600 mb-4">{error || "Kategoria nie istnieje"}</p>
                    <div className="flex space-x-3 justify-center">
                        <button 
                            onClick={() => navigate('/admin/categories')}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Powrót do listy
                        </button>
                        <button 
                            onClick={loadCategoryData}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Nagłówek */}
                <div className="mb-8 pt-8">
                    <div className="mb-4">
                        <Link 
                            to="/admin/categories"
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Powrót do listy kategorii</span>
                        </Link>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                            <p className="text-gray-600 mt-2">Szczegóły kategorii</p>
                        </div>
                        {canManage && (
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    <span>Edytuj</span>
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    className="flex items-center space-x-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Usuń</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Komunikat o błędzie */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                       {error}
                    </div>
                )}

                {/* Główna siatka */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Lewa kolumna (Informacje, Atrybuty, Produkty) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Podstawowe informacje */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Informacje o kategorii</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
                                    <p className="text-gray-900 font-medium">{category.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres internetowy (Link/Slug)</label>
                                    <p className="text-gray-900 font-mono">{category.seoSlug}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                                    <p className="text-gray-900">{category.description || "Brak opisu"}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data utworzenia</label>
                                    <div className="flex items-center space-x-2 text-gray-900">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(category.createdAt).toLocaleDateString('pl-PL')}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ostatnia aktualizacja</label>
                                    <div className="flex items-center space-x-2 text-gray-900">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(category.updatedAt).toLocaleDateString('pl-PL')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Atrybuty kategorii */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Atrybuty kategorii</h2>
                                {canManage && (
                                    <button 
                                        onClick={handleAddAttribute}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Dodaj atrybut</span>
                                    </button>
                                )}
                            </div>
                            {attributes.length > 0 ? (
                                <div className="space-y-3">
                                    {attributes.map(attr => (
                                        <div key={attr.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <CheckSquare className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {attr.attributeName || attr.name} 
                                                        {attr.isKeyAttribute && <Shield className="h-4 w-4 ml-2 inline text-orange-500" title="Atrybut kluczowy dla wariantów" />}
                                                    </p>
                                                    <p className="text-sm text-gray-500">Typ: {attr.attributeType || attr.type}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-3">
                                                <Link 
                                                    to={`/admin/categories/${id}/attributes/${attr.id}/edit`}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Edytuj
                                                </Link>
                                                {canManage && (
                                                    <button 
                                                        onClick={() => handleAttributeDeleteClick(attr)}
                                                        className="text-sm font-medium text-red-600 hover:text-red-800"
                                                    >
                                                        Usuń
                                                    </button>
                                                )}
                                            </div>
                                            
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">Brak atrybutów dla tej kategorii</p>
                                    <button 
                                        onClick={handleAddAttribute}
                                        className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Dodaj pierwszy atrybut
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Produkty w kategorii */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Podgląd produktów</h2>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                    {totalProductsCount} produktów
                                </span>
                            </div>
                            
                            {products.length > 0 ? (
                                <div className="space-y-3">
                                    {products.map(product => (
                                        <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    {product.thumbnailUrl ? (
                                                         <img src={product.thumbnailUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                         <Package className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{product.name}</p>
                                                    <p className="text-sm text-gray-500">{product.price?.toFixed(2)} zł</p>
                                                </div>
                                            </div>
                                            <Link 
                                                to={`/admin/products/${product.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Zobacz szczegóły
                                            </Link>
                                        </div>
                                    ))}
                                    {totalProductsCount > products.length && (
                                        <div className="text-center pt-2">
                                            <Link 
                                                to={`/category/${category.seoSlug}`} 
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Zobacz wszystkie {totalProductsCount} produktów →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">Brak produktów w tej kategorii</p>
                                    <Link 
                                        to="/admin/products/add"
                                        className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Dodaj pierwszy produkt
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prawa kolumna (Statystyki i Podkategorie) */}
                    <div className="space-y-6">
                        
                        {/* Statystyki */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Statystyki</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Produkty</span>
                                    <span className="font-semibold text-gray-900">{totalProductsCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Podkategorie</span>
                                    <span className="font-semibold text-gray-900">{subcategories.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Podkategorie */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Podkategorie</h3>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                                    {subcategories.length}
                                </span>
                            </div>
                            
                            {subcategories.length > 0 ? (
                                <div className="space-y-2">
                                    {subcategories.map(subcategory => (
                                        <Link 
                                            key={subcategory.id}
                                            to={`/admin/categories/${subcategory.id}`}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Folder className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-700 group-hover:text-gray-900">{subcategory.name}</span>
                                            </div>
                                            <span className="text-gray-400 group-hover:text-gray-600">→</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Brak podkategorii</p>
                            )}
                            
                            {canManage && (
                                <button 
                                    onClick={handleAddSubcategory}
                                    className="w-full mt-4 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Dodaj podkategorię
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal usuwania kategorii */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={`Usuń kategorię: ${category?.name}`}
                message={(
                    <>
                        Czy na pewno chcesz trwale usunąć kategorię "{category?.name}"?
                        <br /><br />
                        {subcategories.length > 0 && (
                            <span className="font-semibold text-red-600 block mb-2">
                                ⚠️ UWAGA: Usunięcie tej kategorii spowoduje również usunięcie {subcategories.length} zagnieżdżonych podkategorii!
                            </span>
                        )}
                        Tej operacji nie można cofnąć.
                    </>
                )}
                confirmText={`Usuń kategorię`}
                cancelText="Anuluj"
                type="danger"
                isProcessing={deleteLoading}
            />

            {/* Modal usuwania atrybutu */}
            <ConfirmationModal
                show={showAttrDeleteModal}
                onClose={cancelAttributeDelete}
                onConfirm={confirmAttributeDelete}
                title={`Usuń atrybut: ${attrToDelete?.attributeName || attrToDelete?.name}`}
                message={(
                    <>
                        Czy na pewno chcesz usunąć atrybut "{attrToDelete?.attributeName || attrToDelete?.name}" z tej kategorii?
                        <br /><br />
                        Może to mieć wpływ na produkty, które używają tego atrybutu. Tej operacji nie można cofnąć.
                    </>
                )}
                confirmText="Usuń atrybut"
                cancelText="Anuluj"
                type="danger"
                isProcessing={attrDeleteLoading}
            />
        </div>
    );
}