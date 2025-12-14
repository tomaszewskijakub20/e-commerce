import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader, Save, ArrowLeft, XCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import api from '../../../services/api';

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


export default function CategoryEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        seoSlug: '',
        parentId: null,
        isActive: true
    });
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Stany dla modala potwierdzenia zapisu
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [dataToConfirm, setDataToConfirm] = useState(null);

    // Stany dla śledzenia zmian i modala anulowania
    const [isDirty, setIsDirty] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);


    // Pobieranie danych kategorii oraz listy wszystkich kategorii
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [categoryResponse, allCategoriesResponse] = await Promise.allSettled([
                    api.get(`/categories/${id}`),
                    api.get('/categories')
                ]);

                if (categoryResponse.status === 'fulfilled') {
                    const catData = categoryResponse.value.data;
                    setFormData({
                        name: catData.name,
                        description: catData.description || '',
                        seoSlug: catData.seoSlug,
                        parentId: catData.parentId,
                        isActive: catData.isActive
                    });
                } else {
                    const reason = categoryResponse.reason?.response?.data?.message || "Nie udało się załadować kategorii.";
                    throw new Error(reason);
                }

                if (allCategoriesResponse.status === 'fulfilled') {
                    setAllCategories(allCategoriesResponse.value.data);
                } else {
                    throw new Error("Nie udało się załadować listy kategorii.");
                }

            } catch (err) {
                console.error("Błąd ładowania danych:", err);
                setError(err.message || "Wystąpił błąd.");
            } finally {
                setLoading(false);
                setIsDirty(false); // Resetujemy isDirty po załadowaniu danych
            }
        };

        loadData();
    }, [id]);

    // Spłaszczanie struktury kategorii do płaskiej listy
    const flattenCategories = (categoriesList, level = 0) => {
        let result = [];
        categoriesList.forEach(category => {
            result.push({
                ...category,
                level: level,
                displayName: '— '.repeat(level) + category.name
            });
            if (category.children && category.children.length > 0) {
                result = result.concat(flattenCategories(category.children, level + 1));
            }
        });
        return result;
    };

    // Rekurencyjne znajdowanie ID kategorii i jej dzieci (do wykluczenia z listy rodziców)
    const getCategoryAndChildrenIds = (categoriesList, categoryId) => {
        let ids = [parseInt(categoryId)];

        const findCategory = (list, id) => {
            for (const category of list) {
                if (category.id === id) return category;
                if (category.children) {
                    const found = findCategory(category.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const collectChildrenIds = (category) => {
            if (category.children && category.children.length > 0) {
                category.children.forEach(child => {
                    ids.push(child.id);
                    collectChildrenIds(child);
                });
            }
        };

        const targetCategory = findCategory(categoriesList, parseInt(categoryId));
        if (targetCategory) {
            collectChildrenIds(targetCategory);
        }

        return ids;
    };

    // Opcje dla pola wyboru kategorii nadrzędnej (z wykluczeniem siebie i podkategorii)
    const parentOptions = useMemo(() => {
        const flatList = flattenCategories(allCategories);
        const disabledIds = getCategoryAndChildrenIds(allCategories, id);

        return flatList.map(category => ({
            ...category,
            disabled: disabledIds.includes(category.id)
        }));
    }, [allCategories, id]);

    // Obsługa zmian w formularzu
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
        setIsDirty(true); // Oznacz jako zmienione
    };

    // Logika opuszczania strony
    const handleCancelClick = () => {
        if (isDirty) {
            setShowCancelConfirmModal(true);
        } else {
            navigate('/admin/categories');
        }
    };

    // Potwierdzenie opuszczenia strony
    const confirmCancel = () => {
        setShowCancelConfirmModal(false);
        navigate('/admin/categories');
    };

    // Walidacja formularza i otwarcie modala przed zapisem
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.seoSlug.trim()) {
            setError("Nazwa kategorii i jej adres internetowy (link) są wymagane.");
            return;
        }

        setError('');

        const parentIdValue = formData.parentId === "null" || !formData.parentId
            ? null
            : parseInt(formData.parentId);

        const dataToSend = {
            ...formData,
            parentId: parentIdValue
        };

        setDataToConfirm(dataToSend);
        setShowConfirmModal(true);
    };

    // Wysyłanie danych do API po potwierdzeniu
    const confirmSubmit = async () => {
        if (!dataToConfirm) return;

        setShowConfirmModal(false);
        setSaving(true);
        setError('');

        try {
            // Endpoint: PUT /api/categories/{id}
            await api.put(`/categories/${id}`, dataToConfirm);

            setSaving(false);
            setIsDirty(false); // Zapisano, więc jest czysto

            navigate('/admin/categories', { state: { successMessage: `Kategoria "${dataToConfirm.name}" zaktualizowana pomyślnie.` } });

        } catch (err) {
            console.error("Błąd zapisu kategorii:", err.response);
            let detailedError = "Wystąpił nieoczekiwany błąd podczas zapisu zmian.";

            if (err.response?.status === 400) {
                // Konkretny komunikat dla błędu walidacji/struktury
                detailedError = "Wystąpił błąd w danych. Sprawdź, czy nazwa jest unikalna, czy adres internetowy (Link/Slug) nie jest zajęty i czy nie próbujesz ustawić kategorii jako rodzica samej sobie lub jej podkategorii.";
            } else if (err.response?.data?.message) {
                detailedError = err.response.data.message;
            }

            setError(detailedError);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-gray-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Nagłówek */}
                <div className="mb-8 pt-8">
                    <div className="mb-4">
                        <button
                            onClick={handleCancelClick}
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                            disabled={saving}
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Powrót do listy kategorii</span>
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Edytuj kategorię
                    </h1>
                    {isDirty && !saving && (
                        <p className="text-sm text-red-500 mt-2 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" /> Nie zapisano zmian!
                        </p>
                    )}
                </div>

                {/* Komunikat o błędzie */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <XCircle className="h-5 w-5 mr-2" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-700 font-bold">X</button>
                    </div>
                )}

                {/* Formularz */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nazwa kategorii *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label htmlFor="seoSlug" className="block text-sm font-medium text-gray-700 mb-1">
                            Adres internetowy (Link/Slug) *
                        </label>
                        <input
                            type="text"
                            id="seoSlug"
                            name="seoSlug"
                            value={formData.seoSlug}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono"
                            disabled={saving}
                        />
                        <p className="mt-1 text-xs text-gray-500">Unikalny link używany w adresie URL, np. `/kategoria/buty-sportowe`.</p>
                    </div>

                    <div>
                        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                            Kategoria nadrzędna
                        </label>
                        <select
                            id="parentId"
                            name="parentId"
                            value={formData.parentId || "null"}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                            disabled={saving}
                        >
                            <option value="null">— Brak (Kategoria główna) —</option>
                            {parentOptions.map(category => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                    disabled={category.disabled}
                                    className={category.disabled ? 'text-gray-400' : ''}
                                >
                                    {category.displayName}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Nie możesz ustawić kategorii jako swojego własnego rodzica lub podkategorii (opcje wyłączone).</p>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Opis
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                            disabled={saving}
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                            disabled={saving}
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                            Kategoria jest aktywna
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                        <button
                            type="button"
                            onClick={handleCancelClick}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={saving}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>{saving ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal potwierdzenia edycji (Przed zapisem) */}
            <ConfirmationModal
                show={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setDataToConfirm(null);
                }}
                onConfirm={confirmSubmit}
                title={`Potwierdź Zmiany w Kategorii "${formData.name}"`}
                message={`Czy na pewno chcesz zapisać zmiany w ustawieniach i strukturze kategorii "${formData.name}"? Ta operacja jest nieodwracalna. `}
                confirmText="Zapisz zmiany"
                cancelText="Wróć do edycji"
                type="warning"
                isProcessing={saving}
            />

            {/* Modal potwierdzenia - Opuść stronę */}
            <ConfirmationModal
                show={showCancelConfirmModal}
                onClose={() => setShowCancelConfirmModal(false)}
                onConfirm={confirmCancel}
                title={isDirty ? "Niezapisane zmiany" : "Potwierdź opuszczenie strony"}
                message={isDirty
                    ? "Czy na pewno chcesz opuścić tę stronę? Wprowadzone niezapisane dane zostaną trwale utracone."
                    : "Czy na pewno chcesz wrócić do listy kategorii?"
                }
                confirmText="Opuść stronę"
                cancelText="Zostań"
                type={isDirty ? "warning" : "info"}
                isProcessing={saving}
            />
        </div>
    );
}