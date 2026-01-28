import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Loader, Save, ArrowLeft, XCircle, Tag,
    Image as ImageIcon, UploadCloud, X, AlertCircle,
    CheckCircle, AlertTriangle, Info
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


export default function ProductAdd() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [categoryAttributes, setCategoryAttributes] = useState([]);

    // Stan dla zdjęć
    const [newImages, setNewImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        seoSlug: "",
        sku: "",
        shortDescription: "",
        description: "",
        price: "",
        isActive: true,
        isFeatured: false,
        categoryId: "",
        attributeValues: {},
    });

    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingAttributes, setLoadingAttributes] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Stan modala anulowania
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Stan dla modala potwierdzenia zapisu
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);

    // Stan kontrolujący zmiany
    const [isDirty, setIsDirty] = useState(false);

    const canManage = user?.roles?.includes('ROLE_OWNER') || user?.role === 'owner';

    // Pobieranie kategorii
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true);
                const categoriesRes = await api.get('/categories');
                setCategories(categoriesRes.data);
            } catch (err) {
                setError("Nie udało się załadować listy kategorii.");
            } finally {
                setLoadingCategories(false);
            }
        };
        loadCategories();
    }, []);

    // Pobieranie atrybutów po zmianie kategorii
    useEffect(() => {
        const fetchCategoryAttributes = async (categoryId) => {
            if (!categoryId) {
                setCategoryAttributes([]);
                return;
            }
            try {
                setLoadingAttributes(true);
                const response = await api.get(`/categories/${categoryId}/attributes`);
                setCategoryAttributes(response.data);
                // Resetowanie wartości atrybutów przy zmianie kategorii
                setFormData(prev => ({ ...prev, attributeValues: {} }));
            } catch (err) {
                console.error("Błąd ładowania atrybutów:", err);
                setCategoryAttributes([]);
            } finally {
                setLoadingAttributes(false);
            }
        };

        fetchCategoryAttributes(formData.categoryId);
    }, [formData.categoryId]);

    // Helper do spłaszczania kategorii
    const flatCategories = useMemo(() => {
        const flatten = (categoriesList, level = 0) => {
            let result = [];
            if (Array.isArray(categoriesList)) {
                categoriesList.forEach(category => {
                    result.push({
                        ...category,
                        displayName: '\u00A0\u00A0'.repeat(level) + (level > 0 ? '↳ ' : '') + category.name
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

    // Obsługa zmiany standardowych pól i generowanie slug
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setIsDirty(true);

        if (name === 'name') {
            const slug = value.toLowerCase().trim()
                .replace(/ł/g, 'l').replace(/ą/g, 'a').replace(/ę/g, 'e')
                .replace(/ś/g, 's').replace(/ć/g, 'c').replace(/ż/g, 'z')
                .replace(/ź/g, 'z').replace(/ń/g, 'n')
                .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            setFormData(prev => ({ ...prev, name: value, seoSlug: slug }));
        } else {
            const finalValue = (name === 'sku' && value.trim() === '') ? "" : value;
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));
        }
        setError("");
    };

    // Zapobieganie wprowadzeniu minusów/E w polach numerycznych
    const handlePriceKeyDown = (e) => {
        if (e.key === '-' || e.key === 'e') {
            e.preventDefault();
        }
    };

    // Obsługa zmiany wartości atrybutu
    const handleAttributeChange = (attributeId, value) => {
        setFormData(prev => ({
            ...prev,
            attributeValues: {
                ...prev.attributeValues,
                [attributeId]: value
            }
        }));
        setIsDirty(true);
    };

    // Obsługa dodawania nowych zdjęć
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
            setIsDirty(true);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Usuwanie zdjęcia z kolejki do uploadu
    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
        setIsDirty(true);
    };

    const handleCancelClick = () => {
        if (isDirty) setShowCancelModal(true);
        else navigate('/admin/products');
    };

    const confirmCancel = () => {
        setShowCancelModal(false);
        imagePreviews.forEach(URL.revokeObjectURL);
        setNewImages([]);
        setImagePreviews([]);
        navigate('/admin/products');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManage) {
            setError("Brak uprawnień do wykonania tej akcji.");
            return;
        }

        if (!formData.name || !formData.categoryId || !formData.price || !formData.description) {
            setError("Wypełnij wymagane pola: Nazwa, Kategoria, Cena oraz Pełny opis.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setError("");
        setShowSaveConfirmModal(true);
    };

    // Właściwa akcja tworzenia produktu
    const confirmSubmit = async () => {
        setShowSaveConfirmModal(false);
        setSubmitting(true);
        setError("");

        try {
            const attributeValuesPayload = categoryAttributes
                .filter(attrDef => {
                    const val = formData.attributeValues[attrDef.id];
                    return val !== undefined && val !== null && String(val).trim() !== "";
                })
                .map(attrDef => ({
                    productId: 0,
                    attributeId: parseInt(attrDef.attributeId),
                    attributeValue: String(formData.attributeValues[attrDef.id]).trim()
                }));

            const productCreatePayload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                shortDescription: formData.shortDescription.trim() || "",
                price: parseFloat(formData.price),
                vatRate: 23.0,
                shippingCost: 20.0,
                estimatedDeliveryTime: "3-5 dni",
                seoSlug: formData.seoSlug.trim(),
                sku: formData.sku?.trim() || null,
                categoryId: parseInt(formData.categoryId),
                isFeatured: formData.isFeatured || false,
                isActive: true,
                attributeValues: attributeValuesPayload
            };

            const response = await api.post('/products', productCreatePayload);
            const newProductId = response.data.id;

            // Obsługa zdjęć (jeśli są)
            if (newImages.length > 0) {
                for (let i = 0; i < newImages.length; i++) {
                    const imgFormData = new FormData();
                    imgFormData.append('file', newImages[i]);
                    try {
                        const uploadRes = await api.post(`/products/${newProductId}/images`, imgFormData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (i === 0 && uploadRes.data?.id) {
                            await api.post(`/products/${newProductId}/images/${uploadRes.data.id}/thumbnail`);
                        }
                    } catch (imgErr) {
                        console.error("Błąd uploadu zdjęcia:", imgErr);
                    }
                }
            }

            setIsDirty(false);
            navigate(`/admin/products`, { state: { successMessage: "Produkt utworzony pomyślnie!" } });

        } catch (err) {
            console.error("Błąd API (szczegóły):", err.response?.data);
            const serverMessage = err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;

            setError(serverMessage || "Błąd serwera podczas tworzenia produktu.");

            if (validationErrors) {
                console.log("Błędy walidacji z serwera:", validationErrors);
            }
            setSubmitting(false);
        }
    };

    if (loadingCategories) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-gray-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

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
                    <h1 className="text-3xl font-bold text-gray-900">Dodaj nowy produkt</h1>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between shadow-sm">
                        <div className="flex items-center">
                            <XCircle className="h-5 w-5 mr-2" />
                            <span>{error}</span>
                        </div>
                        <X className="h-5 w-5 cursor-pointer hover:text-red-900" onClick={() => setError("")} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEWA KOLUMNA: Pola formularza */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Informacje ogólne */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Informacje podstawowe</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu *</label>
                                <input
                                    type="text" name="name" value={formData.name} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    required
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adres internetowy (Slug)</label>
                                <input
                                    type="text" name="seoSlug" value={formData.seoSlug} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm bg-gray-50"
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Kod produktu)</label>
                                <input
                                    type="text" name="sku" value={formData.sku || ''} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Pozostaw puste dla auto-generacji"
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opisy</label>
                                <textarea
                                    name="shortDescription" value={formData.shortDescription} onChange={handleChange}
                                    rows="2" placeholder="Krótki opis na listę produktów..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-black"
                                    maxLength="255"
                                    disabled={submitting}
                                ></textarea>
                                <textarea
                                    name="description" value={formData.description} onChange={handleChange}
                                    rows="5" placeholder="Pełny opis produktu (wymagany)..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    required
                                    disabled={submitting}
                                ></textarea>
                            </div>
                        </div>

                        {/* Ceny i Kategoria */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Cena i Kategoria</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cena (PLN) *</label>
                                    <input
                                        type="number" name="price" value={formData.price} onChange={handleChange}
                                        onKeyDown={handlePriceKeyDown}
                                        step="0.01" min="0.01" required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                                    <select
                                        name="categoryId" value={formData.categoryId} onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                                        disabled={submitting}
                                    >
                                        <option value="">Wybierz kategorię</option>
                                        {flatCategories.map(category => (
                                            <option key={category.id} value={category.id}>{category.displayName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Atrybuty dynamiczne */}
                        
                        {formData.categoryId && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Specyfikacja kategorii</h2>
                                    {loadingAttributes && <Loader className="h-5 w-5 animate-spin text-gray-400" />}
                                </div>
                                {categoryAttributes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {categoryAttributes.map(attr => (
                                            <div key={attr.id}>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {attr.attributeName}
                                                    {attr.isKeyAttribute && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase">Kluczowy</span>}
                                                </label>

                                                {attr.attributeType === 'BOOLEAN' ? (
                                                    <select
                                                        value={formData.attributeValues[attr.id] || ''}
                                                        onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                                                        disabled={submitting}
                                                    >
                                                        <option value="">Wybierz...</option>
                                                        <option value="true">Tak</option>
                                                        <option value="false">Nie</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={attr.attributeType === 'NUMBER' ? 'number' : 'text'}
                                                        value={formData.attributeValues[attr.id] || ''}
                                                        onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                                                        placeholder={`Wpisz ${attr.attributeName.toLowerCase()}...`}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                                        disabled={submitting}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : !loadingAttributes && (
                                    <p className="text-sm text-gray-500 italic">Brak dodatkowych atrybutów dla tej kategorii.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* PRAWA KOLUMNA: Status i Zdjęcia */}
                    <div className="space-y-6">

                        {/* Status */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Ustawienia</h3>
                            <div className="flex items-center justify-between">
                                <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Wyróżnij produkt</label>
                                <input
                                    type="checkbox" name="isFeatured" id="isFeatured"
                                    checked={formData.isFeatured} onChange={handleChange}
                                    className="h-5 w-5 text-black rounded focus:ring-black border-gray-300"
                                    disabled={submitting}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-400">Aktywny w sklepie</span>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                        </div>

                        {/* Zdjęcia */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Zdjęcia</h3>
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {imagePreviews.map((src, idx) => (
                                        <div key={idx} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                                            <img src={src} alt="Podgląd" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={submitting}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            {idx === 0 && (
                                                <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/70 text-white text-center py-0.5">Główne</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                type="file" ref={fileInputRef} multiple accept="image/*"
                                onChange={handleImageChange} className="hidden"
                                disabled={submitting}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:border-black hover:text-black transition-colors"
                                disabled={submitting}
                            >
                                <UploadCloud className="h-5 w-5" />
                                <span>Wgraj zdjęcia</span>
                            </button>
                        </div>

                        {/* Akcje */}
                        <div className="flex flex-col space-y-3">
                            <button
                                type="submit"
                                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center space-x-2 font-bold transition-colors disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? <Loader className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                <span>{submitting ? 'Zapisywanie...' : 'Utwórz produkt'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelClick}
                                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                disabled={submitting}
                            >
                                Anuluj
                            </button>
                        </div>

                    </div>
                </form>
            </div>

            {/* Modal potwierdzenia zapisu */}
            <ConfirmationModal
                show={showSaveConfirmModal}
                onClose={() => setShowSaveConfirmModal(false)}
                onConfirm={confirmSubmit}
                title="Potwierdź utworzenie"
                message={`Czy na pewno chcesz utworzyć produkt "${formData.name}"?`}
                type="success"
                confirmText="Tak, zapisz"
                isProcessing={submitting}
            />

            {/* Modal anulowania */}
            <ConfirmationModal
                show={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancel}
                title="Niezapisane zmiany"
                message="Wszystkie wprowadzone dane i zdjęcia zostaną utracone. Czy na pewno chcesz wyjść?"
                type="warning"
                confirmText="Opuść stronę"
                cancelText="Zostań"
            />
        </div>
    );
}