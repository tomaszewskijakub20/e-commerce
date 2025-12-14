import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft, Loader, X, CheckCircle, XCircle, Tag, Image as ImageIcon,
    Edit3, Trash2, UploadCloud, Save, AlertCircle, Plus, AlertTriangle, Info
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


export default function ProductEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const fileInputRef = useRef(null);

    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [currentImages, setCurrentImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // Stany dla dynamicznych atrybutów
    const [categoryAttributes, setCategoryAttributes] = useState([]);
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [showAddAttributeModal, setShowAddAttributeModal] = useState(false);
    const [newAttributeToAdd, setNewAttributeToAdd] = useState({ id: null, attributeId: null, value: '' });
    const [valueToDeleteId, setValueToDeleteId] = useState(null);
    const [showAttributeDeleteModal, setShowAttributeDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        seoSlug: "",
        sku: "",
        shortDescription: "",
        description: "",
        price: "",
        shippingCost: "",
        estimatedDeliveryTime: "",
        isFeatured: false,
        categoryId: "",
        attributeValues: {}, // Mapa: { [product_attribute_value_id]: "wartość" }
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isDirty, setIsDirty] = useState(false);

    // Modale i kontrola uprawnień
    const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
    const [imageToDeleteId, setImageToDeleteId] = useState(null);
    const [imageDeleteLoading, setImageDeleteLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Stan dla modala potwierdzenia zapisu
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
    const [dataToSave, setDataToSave] = useState(null);

    const canManage = user?.role === 'owner';


    // Funkcja ładowania wszystkich danych produktu
    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [productRes, categoriesRes, imagesRes] = await Promise.allSettled([
                api.get(`/products/${id}`),
                api.get('/categories'),
                api.get(`/products/${id}/images`)
            ]);

            if (productRes.status === 'rejected') {
                const reason = productRes.reason.response?.data?.message || productRes.reason.message;
                throw new Error(`Nie udało się załadować podstawowych danych produktu. Powód: ${reason}`);
            }

            const productData = productRes.value.data;
            const categoryId = productData.category?.id;

            // Pobieranie definicji atrybutów dla kategorii
            let categoryAttributesData = [];
            if (categoryId) {
                const categoryAttributesRes = await api.get(`/categories/${categoryId}/attributes`);
                categoryAttributesData = categoryAttributesRes.data;
                setCategoryAttributes(categoryAttributesData);
            }

            // Przygotowanie mapowania istniejących wartości atrybutów
            const attributeValueMap = {};
            const existingAttributeIds = new Set();

            if (productData.attributeValues) {
                productData.attributeValues.forEach(attr => {
                    attributeValueMap[attr.id] = attr.value;
                    existingAttributeIds.add(attr.attributeId);
                });
            }

            // Znajdowanie dostępnych atrybutów do dodania (tych, które nie mają jeszcze wartości)
            const available = categoryAttributesData.filter(
                attrDef => !existingAttributeIds.has(attrDef.attributeId)
            );
            setAvailableAttributes(available);

            setProduct(productData);
            setCategories(categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : []);
            setCurrentImages(imagesRes.status === 'fulfilled' ? imagesRes.value.data : []);

            setFormData({
                name: productData.name,
                seoSlug: productData.seoSlug,
                sku: productData.sku || '',
                shortDescription: productData.shortDescription || "",
                description: productData.description || "",
                price: productData.price || "",
                shippingCost: productData.shippingCost || "",
                estimatedDeliveryTime: productData.estimatedDeliveryTime || "",
                isFeatured: productData.isFeatured,
                categoryId: categoryId || "",
                attributeValues: attributeValueMap,
            });

            setIsDirty(false);

        } catch (err) {
            setError(err.message || "Błąd ładowania danych.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canManage) {
            loadData();
        } else if (!user) {
            setLoading(false);
            setError("Brak uprawnień do edycji produktów.");
        }
    }, [id, canManage]);

    // Helper do spłaszczania kategorii
    const flatCategories = useMemo(() => {
        const flatten = (categoriesList, level = 0) => {
            let result = [];
            if (Array.isArray(categoriesList)) {
                categoriesList.forEach(category => {
                    result.push({
                        ...category,
                        displayName: '  '.repeat(level) + category.name
                    });
                    if (category.children && category.children.length > 0) {
                        result = result.concat(flatten(category.children, level + 1));
                    }
                });
            }
            return result;
        };
        return flatten(categories);
    }, [categories]);

    // Handlery forumarza i zapis

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setSuccess("");
        setError("");
        setIsDirty(true);
    };

    // Obsługa zmiany wartości atrybutu
    const handleAttributeChange = (valueId, newValue) => {
        setFormData(prev => ({
            ...prev,
            attributeValues: {
                ...prev.attributeValues,
                [valueId]: newValue
            }
        }));
        setSuccess("");
        setError("");
        setIsDirty(true);
    };

    // Główny handler formularza (Otwiera modal)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManage) return;

        if (parseFloat(formData.price) < 0 || parseFloat(formData.shippingCost) < 0) {
            setError("Ceny nie mogą być ujemne.");
            return;
        }

        // Przygotowanie payloadu
        const attributeValuesPayload = product.attributeValues.map(originalAttr => {
            const newValue = formData.attributeValues[originalAttr.id];

            return {
                id: originalAttr.id,
                attributeId: originalAttr.attributeId,
                value: newValue !== undefined ? newValue : originalAttr.value
            };
        });

        const productUpdatePayload = {
            name: formData.name,
            seoSlug: formData.seoSlug,
            sku: formData.sku,
            shortDescription: formData.shortDescription,
            description: formData.description,
            price: parseFloat(formData.price),
            shippingCost: parseFloat(formData.shippingCost),
            estimatedDeliveryTime: formData.estimatedDeliveryTime,
            isFeatured: formData.isFeatured,
            categoryId: formData.categoryId,
            attributeValues: attributeValuesPayload,
        };

        setDataToSave(productUpdatePayload);
        setShowSaveConfirmModal(true);
    };

    // Właściwa akcja zapisu
    const confirmSaveSubmit = async () => {
        if (!dataToSave) return;

        setShowSaveConfirmModal(false);
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            // Wysłanie głównego payloadu
            await api.put(`/products/${id}`, dataToSave);

            // Wysłanie nowych zdjęć
            if (newImages.length > 0) {
                const uploadPromises = newImages.map(file => {
                    const imageFormData = new FormData();
                    imageFormData.append('file', file);
                    return api.post(`/products/${id}/images`, imageFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                });
                await Promise.all(uploadPromises);
                // Wyczyść kolejkę podglądów po udanym uploadzie
                newImages.forEach(URL.revokeObjectURL);
                setNewImages([]);
                setImagePreviews([]);
            }

            setSuccess("Produkt zaktualizowany pomyślnie!");
            setIsDirty(false);
            await loadData(); // Odświeżenie wszystkich danych, w tym listy obrazków i atrybutów

        } catch (err) {
            console.error("Błąd zapisu:", err.response);
            const errorMessage = err.response?.data?.message || "Błąd podczas aktualizacji produktu.";
            setError(errorMessage);
        } finally {
            setSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Logika zarządzania atrybutami

    // Otwarcie modala dodawania atrybutu (z odświeżeniem dostępnych opcji)
    const handleOpenAddModal = async () => {
        if (!canManage) return;

        await loadData();

        if (availableAttributes.length > 0) {
            setNewAttributeToAdd({
                id: availableAttributes[0].id,
                attributeId: availableAttributes[0].attributeId,
                value: ''
            });
            setShowAddAttributeModal(true);
        } else {
            setError("Wszystkie atrybuty kategorii są już przypisane do tego produktu.");
        }
    };

    // Obsługa zmiany wybranego atrybutu w modal dodawania
    const handleNewAttrChange = (e) => {
        const selectedCatAttrId = parseInt(e.target.value);
        const selectedAttrDef = availableAttributes.find(attr => attr.id === selectedCatAttrId);

        setNewAttributeToAdd({
            id: selectedCatAttrId,
            attributeId: selectedAttrDef ? selectedAttrDef.attributeId : null,
            value: ''
        });
    };

    // Obsługa zmiany wartości nowego atrybutu w modal dodawania
    const handleNewAttrValueChange = (e) => {
        setNewAttributeToAdd(prev => ({ ...prev, value: e.target.value }));
    };

    // Potwierdzenie i dodanie nowej wartości atrybutu do API
    const confirmAddAttribute = async (e) => {
        e.preventDefault();
        if (!newAttributeToAdd.attributeId || !newAttributeToAdd.value.trim()) {
            setError("Wybierz atrybut i wprowadź wartość.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const payload = {
                productId: parseInt(id),
                attributeId: newAttributeToAdd.attributeId,
                value: newAttributeToAdd.value.trim(),
            };

            await api.post('/product-attribute-values', payload);

            await loadData();
            setSuccess("Nowy atrybut dodany pomyślnie!");
            setShowAddAttributeModal(false);

        } catch (err) {
            console.error("Błąd dodawania atrybutu:", err.response);
            let errMsg = "Błąd dodawania atrybutu.";

            if (err.response?.status === 409) {
                await loadData();
                errMsg = "Błąd 409: Ten atrybut jest już przypisany do tego produktu. Stan został odświeżony.";
            } else if (err.response?.data?.message) {
                errMsg = err.response.data.message;
            }

            setError(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // Otwarcie modala usuwania wartości atrybutu
    const handleRemoveAttributeClick = (valueId) => {
        if (!canManage) return;
        setValueToDeleteId(valueId);
        setShowAttributeDeleteModal(true);
    };

    // Potwierdzenie i usunięcie wartości atrybutu z API
    const confirmRemoveAttribute = async () => {
        if (!valueToDeleteId) return;

        setSubmitting(true);
        setError("");
        setShowAttributeDeleteModal(false);

        try {
            await api.delete(`/product-attribute-values/${valueToDeleteId}`);

            await loadData();
            setSuccess("Wartość atrybutu usunięta pomyślnie.");

        } catch (err) {
            console.error("Błąd usuwania wartości atrybutu:", err.response);
            setError("Nie udało się usunąć wartości atrybutu.");
        } finally {
            setSubmitting(false);
            setValueToDeleteId(null);
        }
    };

    // Obsługa dodawania nowych zdjęć do kolejki
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
            setSuccess("");
            setError("");
            setIsDirty(true);
        }
        // Resetowanie inputa, aby można było wybrać ten sam plik ponownie (jeśli konieczne)
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Usuwanie zdjęcia z kolejki nowych zdjęć (przed wgraniem)
    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            // Zwolnienie pamięci dla usuniętego obiektu URL
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
        setIsDirty(true);
    };

    // Otwarcie modala usuwania istniejącego zdjęcia
    const handleImageDeleteClick = (imageId) => {
        if (!canManage) return;
        setImageToDeleteId(imageId);
        setShowImageDeleteModal(true);
    };

    // Anulowanie usuwania zdjęcia
    const cancelImageDelete = () => {
        setShowImageDeleteModal(false);
        setImageToDeleteId(null);
    };

    // Potwierdzenie i usunięcie zdjęcia z API
    const confirmImageDelete = async () => {
        if (!imageToDeleteId) return;
        setImageDeleteLoading(true);
        setError("");
        setShowImageDeleteModal(false);

        try {
            const imageToDelete = currentImages.find(img => img.id === imageToDeleteId);
            await api.delete(`/products/${id}/images/${imageToDeleteId}`);

            const remainingImages = currentImages.filter(img => img.id !== imageToDeleteId);
            setCurrentImages(remainingImages);
            setSuccess("Obrazek usunięty pomyślnie.");

            // Jeśli usuwany obrazek był miniaturką, ustaw pierwszego pozostałego jako nową miniaturkę
            if (imageToDelete?.isThumbnail && remainingImages.length > 0) {
                const newThumbnail = remainingImages[0];
                try {
                    await api.post(`/products/${id}/images/${newThumbnail.id}/thumbnail`);
                    setCurrentImages(prev => prev.map(img => ({
                        ...img,
                        isThumbnail: img.id === newThumbnail.id
                    })));
                    setSuccess("Obrazek usunięty. Nowa miniaturka ustawiona automatycznie.");
                } catch (thumbnailErr) {
                    console.error("Nie udało się automatycznie ustawić nowej miniaturki", thumbnailErr);
                }
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || "Błąd podczas usuwania obrazka.";
            setError(errMsg);
        } finally {
            setImageDeleteLoading(false);
            setImageToDeleteId(null);
        }
    };

    // Ustawienie wybranego zdjęcia jako miniaturki
    const setThumbnail = async (imageId) => {
        if (!canManage) return;
        try {
            setSubmitting(true);
            await api.post(`/products/${id}/images/${imageId}/thumbnail`);
            // Aktualizacja stanu lokalnego
            setCurrentImages(prev => prev.map(img => ({
                ...img,
                isThumbnail: img.id === imageId
            })));
            setSuccess("Miniaturka zaktualizowana pomyślnie.");
        } catch (err) {
            const errMsg = err.response?.data?.message || "Błąd podczas ustawiania miniaturki.";
            setError(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // Obsługa zmiany tekstu alternatywnego (lokalnie)
    const handleAltTextChange = (imageId, newAltText) => {
        setCurrentImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, altText: newAltText } : img
        ));
        setIsDirty(true);
    };

    // Wysłanie tekstu alternatywnego do API po utracie fokusu
    const updateImageAltText = async (imageId, altText) => {
        if (!canManage) return;
        try {
            // Wysłanie PUT do API z nowym tekstem alternatywnym
            // W tej chwili używamy mocka, ale powinno to wywołać odpowiednie API
            await api.put(`/products/${id}/images/${imageId}/alt-text`, { altText });
            setSuccess("Tekst alternatywny zapisany.");
        } catch (err) {
            setError("Nie udało się zapisać tekstu alternatywnego.");
        }
    };

    // Otwarcie modala anulowania
    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    // Potwierdzenie anulowania
    const confirmCancel = () => {
        setShowCancelModal(false);
        // Zwolnienie pamięci dla nieużywanych podglądów nowych zdjęć
        imagePreviews.forEach(URL.revokeObjectURL);
        navigate('/admin/products');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-gray-600" />
                <span className="ml-2 text-gray-600">Ładowanie danych produktu...</span>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
                <div>
                    <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
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

                {/* Nagłówek */}
                <div className="mb-8 pt-8">
                    <div className="mb-4">
                        <button
                            onClick={handleCancelClick}
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Powrót do listy produktów</span>
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edytuj produkt: {product?.name}</h1>
                            <p className="text-gray-600 mt-2">Dostosuj szczegóły, ceny, atrybuty i zdjęcia produktu.</p>
                        </div>
                    </div>
                </div>

                {/* Komunikaty */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
                        <span>{error}</span>
                        <X className="h-5 w-5 cursor-pointer" onClick={() => setError("")} />
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
                        <span>{success}</span>
                        <X className="h-5 w-5 cursor-pointer" onClick={() => setSuccess("")} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Lewa kolumna formularza (Informacje ogólne, Ceny, Klasyfikacja) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Informacje ogólne */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Informacje ogólne</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu</label>
                                    <input
                                        type="text" id="name" name="name"
                                        value={formData.name} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="seoSlug" className="block text-sm font-medium text-gray-700 mb-1">Adres internetowy (Slug)</label>
                                    <input
                                        type="text" id="seoSlug" name="seoSlug"
                                        value={formData.seoSlug} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU (kod produktu)</label>
                                    <input
                                        type="text" id="sku" name="sku"
                                        value={formData.sku || ''} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">Krótki opis</label>
                                    <textarea
                                        id="shortDescription" name="shortDescription"
                                        value={formData.shortDescription} onChange={handleChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        maxLength="255"
                                        disabled={submitting}
                                    ></textarea>
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Pełny opis</label>
                                    <textarea
                                        id="description" name="description"
                                        value={formData.description} onChange={handleChange}
                                        rows="6"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        disabled={submitting}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Ceny i Klasyfikacja</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Cena (PLN)</label>
                                    <input
                                        type="number" id="price" name="price"
                                        value={formData.price} onChange={handleChange}
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                        step="0.01" min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700 mb-1">Koszt wysyłki (PLN)</label>
                                    <input
                                        type="number" id="shippingCost" name="shippingCost"
                                        value={formData.shippingCost} onChange={handleChange}
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                        step="0.01" min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="estimatedDeliveryTime" className="block text-sm font-medium text-gray-700 mb-1">Szacowany czas dostawy</label>
                                    <input
                                        type="text" id="estimatedDeliveryTime" name="estimatedDeliveryTime"
                                        value={formData.estimatedDeliveryTime} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                                    <select
                                        id="categoryId" name="categoryId"
                                        value={formData.categoryId}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-gray-100 cursor-not-allowed"
                                        required
                                        disabled
                                    >
                                        <option value="">Wybierz kategorię</option>
                                        {flatCategories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.displayName}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Zmiana kategorii produktu jest zablokowana.</p>
                                </div>
                            </div>
                        </div>

                        {/* Atrybuty dynamiczne */}
                        {product && product.attributeValues && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Atrybuty produktu</h2>
                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={handleOpenAddModal}
                                            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                            disabled={submitting || availableAttributes.length === 0}
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Dodaj Atrybut ({availableAttributes.length} dostępnych)</span>
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {product.attributeValues.map(attrValue => (
                                        <div key={attrValue.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`attribute-${attrValue.id}`}
                                                    className="block text-sm font-medium text-gray-700 mb-1"
                                                >
                                                    {attrValue.attributeName}
                                                    {attrValue.attributeType && <span className="text-xs text-gray-400 ml-2">({attrValue.attributeType})</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`attribute-${attrValue.id}`}
                                                    value={formData.attributeValues[attrValue.id] || attrValue.value || ''}
                                                    onChange={(e) => handleAttributeChange(attrValue.id, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                                    disabled={submitting}
                                                />
                                            </div>
                                            {canManage && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAttributeClick(attrValue.id)}
                                                    title="Usuń wartość atrybutu"
                                                    className="ml-4 p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                                                    disabled={submitting}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {product.attributeValues.length === 0 && availableAttributes.length === 0 && (
                                        <div className="text-center py-4 text-gray-500">Brak przypisanych atrybutów dla tej kategorii.</div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Prawa kolumna */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
                            <div className="flex items-center justify-between">
                                <label htmlFor="isFeatured" className="text-gray-600 cursor-pointer">Polecany (na stronie głównej)</label>
                                <input type="checkbox" name="isFeatured" id="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="h-5 w-5 text-black rounded focus:ring-black border-gray-300" disabled={submitting} />
                            </div>
                            <div className="flex items-center justify-between opacity-70 cursor-not-allowed">
                                <label htmlFor="isActive" className="cursor-not-allowed text-gray-500">Aktywny w sklepie</label>
                                <input type="checkbox" name="isActive" id="isActive" checked={product?.isActive} disabled className="h-5 w-5 text-black rounded focus:ring-black border-gray-300" />
                            </div>
                            <p className="text-xs text-gray-500">Status aktywności jest zarządzany automatycznie.</p>
                        </div>

                        {/* Zarządzanie zdjęciami */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Zdjęcia produktu</h3>
                            <p className="text-sm text-gray-600 mb-4">Dodaj, usuń lub edytuj istniejące zdjęcia.</p>

                            {/* Istniejące zdjęcia */}
                            {currentImages.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    <h4 className="font-medium text-gray-800">Istniejące zdjęcia:</h4>
                                    {currentImages.map(img => (
                                        <div key={img.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg group">
                                            <img
                                                src={img.url}
                                                alt={img.altText || 'Zdjęcie produktu'}
                                                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={img.altText || ''}
                                                    onChange={(e) => handleAltTextChange(img.id, e.target.value)}
                                                    onBlur={(e) => updateImageAltText(img.id, e.target.value)}
                                                    placeholder="Tekst alternatywny (SEO)"
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                                />
                                                {img.isThumbnail && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block">Miniaturka</span>
                                                )}
                                            </div>
                                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!img.isThumbnail && canManage && ( // Dodano canManage
                                                    <button
                                                        type="button"
                                                        onClick={() => setThumbnail(img.id)}
                                                        title="Ustaw jako miniaturkę"
                                                        className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                                        disabled={submitting}
                                                    >
                                                        <ImageIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {canManage && ( // Dodano canManage
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImageDeleteClick(img.id)}
                                                        title="Usuń zdjęcie"
                                                        className="p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                                                        disabled={submitting}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Nowe zdjęcia do dodania */}
                            {newImages.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    <h4 className="font-medium text-gray-800">Nowe zdjęcia do dodania:</h4>
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg group">
                                            <img
                                                src={preview}
                                                alt="Podgląd nowego zdjęcia"
                                                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{newImages[index].name}</p>
                                                <p className="text-xs text-gray-500">Rozmiar: {(newImages[index].size / 1024).toFixed(2)} KB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                title="Usuń to zdjęcie z kolejki"
                                                className="p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                                                disabled={submitting}
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Przycisk dodawania zdjęć */}
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={submitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:border-black hover:text-black transition-colors"
                                    disabled={submitting}
                                >
                                    <UploadCloud className="h-5 w-5" />
                                    <span>Dodaj nowe zdjęcia</span>
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">Zdjęcia zostaną wgrane po kliknięciu "Zapisz zmiany".</p>
                            </div>
                        </div>

                        {/* Przyciski akcji (Zapisz/Anuluj) */}
                        <div className="flex justify-end space-x-4 lg:col-span-3 border-t border-gray-200 pt-4">
                            <button
                                type="button"
                                onClick={handleCancelClick}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={submitting}
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                                disabled={submitting || !isDirty} // Dodano !isDirty
                            >
                                {submitting && <Loader className="h-4 w-4 animate-spin" />}
                                <span>{submitting ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                                {!submitting && <Save className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Modal potwierdzenia zapisu edycji */}
                <ConfirmationModal
                    show={showSaveConfirmModal}
                    onClose={() => { setShowSaveConfirmModal(false); setDataToSave(null); }}
                    onConfirm={confirmSaveSubmit}
                    title={`Potwierdź Zapis zmian`}
                    message={`Czy na pewno chcesz zapisać zmiany dla produktu "${product?.name}"?`}
                    confirmText="Zapisz i aktualizuj"
                    cancelText="Anuluj"
                    type="warning"
                    isProcessing={submitting}
                />

                {/* Modal anulowania edycji */}
                <ConfirmationModal
                    show={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={confirmCancel}
                    title="Potwierdź opuszczenie strony"
                    message={isDirty
                        ? "Czy na pewno chcesz opuścić tę stronę? Wprowadzone niezapisane zmiany (w tym nowe zdjęcia) zostaną utracone."
                        : "Czy na pewno chcesz opuścić tę stronę i wrócić do listy produktów?"
                    }
                    confirmText="Opuść stronę"
                    cancelText="Zostań"
                    type={isDirty ? "danger" : "info"}
                    isProcessing={submitting}
                />

                {/* Modal usuwania zdjęcia */}
                <ConfirmationModal
                    show={showImageDeleteModal}
                    onClose={cancelImageDelete}
                    onConfirm={confirmImageDelete}
                    title="Usuń zdjęcie produktu"
                    message={(
                        <>
                            Czy na pewno chcesz trwale usunąć to zdjęcie?
                            {currentImages.find(img => img.id === imageToDeleteId)?.isThumbnail && (
                                <span className="font-semibold text-red-600 block mt-2">
                                    ⚠️ Uwaga: Jest to obecnie miniaturka. Po usunięciu system wybierze następne zdjęcie jako nową miniaturkę.
                                </span>
                            )}
                            Tej operacji nie można cofnąć.
                        </>
                    )}
                    confirmText="Usuń zdjęcie"
                    cancelText="Anuluj"
                    type="danger"
                    isProcessing={imageDeleteLoading || submitting}
                />

                {/* Modal usuwania wartości atrybutu */}
                <ConfirmationModal
                    show={showAttributeDeleteModal}
                    onClose={() => setShowAttributeDeleteModal(false)}
                    onConfirm={confirmRemoveAttribute}
                    title="Usuń wartość atrybutu"
                    message="Czy na pewno chcesz usunąć tę wartość atrybutu z produktu? Tej operacji nie można cofnąć."
                    confirmText="Usuń wartość"
                    cancelText="Anuluj"
                    type="danger"
                    isProcessing={submitting}
                />


                {/* Modal dodawania nowego atrybutu (NIE jest modalem potwierdzenia)  */}
                {showAddAttributeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
                            <div className="flex justify-between items-start mb-4 border-b pb-2">
                                <h3 className="text-xl font-semibold text-gray-900">Dodaj nowy atrybut</h3>
                                <button onClick={() => setShowAddAttributeModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={confirmAddAttribute} className="space-y-4">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Atrybut *</label>
                                    <select
                                        name="attributeId"
                                        value={newAttributeToAdd.id || (availableAttributes[0]?.id || '')}
                                        onChange={handleNewAttrChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                                        required
                                        disabled={submitting}
                                    >
                                        {availableAttributes.map(attr => (
                                            <option key={attr.id} value={attr.id}>
                                                {attr.attributeName} ({attr.attributeType})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Wyświetlane są tylko atrybuty, które nie mają jeszcze przypisanej wartości.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Wartość *</label>
                                    <input
                                        type="text"
                                        name="value"
                                        value={newAttributeToAdd.value}
                                        onChange={handleNewAttrValueChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddAttributeModal(false)}
                                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        disabled={submitting}
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2"
                                        disabled={submitting || !newAttributeToAdd.value.trim()}
                                    >
                                        {submitting && <Loader className="h-4 w-4 animate-spin" />}
                                        <span>Dodaj</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}