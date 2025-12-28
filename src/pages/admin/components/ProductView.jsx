import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft, Package, Edit3, Trash2,
    Loader, CheckCircle, XCircle, Tag, Image as ImageIcon,
    Shield, X, AlertTriangle, Info
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


export default function ProductView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const canManage = user?.role === 'owner';

    useEffect(() => {
        const loadProductData = async () => {
            try {
                setLoading(true);
                setError("");

                // Pobieramy produkt, obrazy oraz wartości atrybutów
                const [productResponse, imagesResponse, attributesResponse] = await Promise.allSettled([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/images`),
                    api.get(`/product-attribute-values/product/${id}`)
                ]);

                if (productResponse.status === 'fulfilled') {
                    setProduct(productResponse.value.data);
                } else {
                    throw new Error("Nie udało się załadować produktu.");
                }

                if (imagesResponse.status === 'fulfilled') {
                    setImages(imagesResponse.value.data);
                }

                // Przypisujemy atrybuty z dedykowanego endpointu
                if (attributesResponse.status === 'fulfilled') {
                    setAttributes(attributesResponse.value.data);
                }

            } catch (err) {
                setError(err.message || "Błąd ładowania danych produktu");
            } finally {
                setLoading(false);
            }
        };

        loadProductData();
    }, [id]);

    // Otwarcie modala usuwania
    const handleDeleteClick = () => {
        if (!canManage) return;
        setShowDeleteModal(true);
    };

    // Anulowanie usuwania
    const cancelDelete = () => {
        setShowDeleteModal(false);
    };

    // Potwierdzenie i wykonanie usuwania
    const confirmDelete = async () => {
        if (!canManage) return;
        try {
            setDeleteLoading(true);
            setError("");
            await api.delete(`/products/${id}`);
            setDeleteLoading(false);
            setShowDeleteModal(false);
            // Przekierowanie z komunikatem sukcesu
            navigate('/admin/products', { state: { successMessage: `Produkt "${product?.name}" został usunięty.` } });
        } catch (err) {
            setError("Błąd podczas usuwania produktu. Upewnij się, że nie ma powiązanych zamówień.");
            setDeleteLoading(false);
            setShowDeleteModal(false);
        }
    };

    // Nawigacja do edycji
    const handleEdit = () => {
        if (!canManage) return;
        navigate(`/admin/products/${id}/edit`);
    };

    // Formatowanie ceny
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(price || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-gray-600" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
                <div>
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Błąd ładowania</h3>
                    <p className="text-gray-600 mb-4">{error || "Produkt nie istnieje"}</p>
                    <Link
                        to="/admin/products"
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Powrót do listy
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Nagłówek i przyciski akcji */}
                <div className="mb-8 pt-8">
                    <div className="mb-4">
                        <Link to="/admin/products" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                            <span>Powrót do listy produktów</span>
                        </Link>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                            <p className="text-gray-600 mt-2">Szczegóły produktu (SKU: {product.sku || 'Brak'})</p>
                        </div>
                        {canManage && (
                            <div className="flex space-x-3">
                                <button onClick={() => navigate(`/admin/products/${id}/edit`)} className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                                    <Edit3 className="h-4 w-4" />
                                    <span>Edytuj</span>
                                </button>
                                <button onClick={() => setShowDeleteModal(true)} className="flex items-center space-x-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                    <span>Usuń</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">

                        {/* Ceny i Klasyfikacja */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Ceny i Klasyfikacja</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cena</label>
                                    <p className="text-gray-900 font-bold text-2xl">{new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(product.price)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                                    <p className="text-gray-900 font-medium">{product.category ? product.category.name : 'Brak'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Opisy */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Opisy</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Krótki opis</label>
                                    <p className="text-gray-800">{product.shortDescription || 'Brak opisu'}</p>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pełny opis</label>
                                    <p className="text-gray-800 whitespace-pre-line">{product.description || 'Brak opisu'}</p>
                                </div>
                            </div>
                        </div>

                        {/* POPRAWIONA SEKCJA ATRYBUTÓW */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Specyfikacja techniczna</h2>
                            {attributes && attributes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {attributes.map((attr) => (
                                        <div key={attr.id} className="flex items-start p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                            <Tag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {attr.attributeName}
                                                    {attr.isKeyAttribute && (
                                                        <Shield className="h-3 w-3 ml-1 inline text-blue-600" />
                                                    )}
                                                </p>
                                                <p className="text-gray-900 font-medium">
                                                    {attr.attributeValue || <span className="text-gray-400 italic">Nie ustawiono</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4 italic">Brak dodatkowych atrybutów dla tego produktu.</p>
                            )}
                        </div>
                    </div>

                    {/* Prawa kolumna - Obrazki i Status */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Galeria zdjęć</h3>
                            {images.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {images.map(img => (
                                        <div key={img.id} className={`relative aspect-square rounded-lg overflow-hidden border ${img.isThumbnail ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                                            <img src={img.url} alt={img.altText || 'Zdjęcie'} className="w-full h-full object-cover" />
                                            {img.isThumbnail && (
                                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">Główne</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Brak zdjęć</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Usuń produkt"
                message={`Czy na pewno chcesz usunąć produkt "${product?.name}"?`}
                confirmText="Usuń trwale"
                type="danger"
                isProcessing={deleteLoading}
            />
        </div>
    );
}