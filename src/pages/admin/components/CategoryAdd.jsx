import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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


export default function CategoryAdd() {
    const navigate = useNavigate();
    const location = useLocation();

    // Identyfikator kategorii nadrzędnej (jeśli dodawana jest podkategoria)
    const parentId = location.state?.parentId || null;

    // Początkowy stan formularza
    const initialFormData = {
        name: '',
        description: '',
        seoSlug: '',
        parentId: parentId,
        isActive: true
    };

    const [formData, setFormData] = useState(initialFormData);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [parentCategoryName, setParentCategoryName] = useState('');

    // Stan dla modala potwierdzenia dodawania
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [dataToConfirm, setDataToConfirm] = useState(null);

    // Stan dla modala potwierdzenia anulowania / opuszczenia strony
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

    // Stan kontrolujący, czy wprowadzono zmiany
    const [isDirty, setIsDirty] = useState(false);


    // Ładowanie nazwy kategorii nadrzędnej
    useEffect(() => {
        if (parentId) {
            api.get(`/categories/${parentId}`)
                .then(response => {
                    setParentCategoryName(response.data.name);
                })
                .catch(err => {
                    console.error("Błąd ładowania kategorii nadrzędnej:", err);
                    setError("Nie udało się załadować kategorii nadrzędnej.");
                });
        }
    }, [parentId]);

    // Obsługa zmian w formularzu, w tym generowanie slug z nazwy
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setIsDirty(true);

        if (name === 'name') {
            // Generowanie slug
            const slug = value
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({
                ...prev,
                name: value,
                seoSlug: slug
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Obsługa ręcznej zmiany slug
    const handleSlugChange = (e) => {
        setFormData(prev => ({
            ...prev,
            seoSlug: e.target.value
        }));
        setIsDirty(true);
    };

    // Ścieżka powrotu
    const getReturnPath = () => {
        return parentId ? `/admin/categories/${parentId}` : '/admin/categories';
    };

    // Obsługa kliknięcia "Anuluj" (wyświetla modal, jeśli są niezapisane zmiany)
    const handleCancelClick = () => {
        if (isDirty) {
            setShowCancelConfirmModal(true);
        } else {
            navigate(getReturnPath());
        }
    };

    // Potwierdzenie opuszczenia strony
    const confirmCancel = () => {
        setShowCancelConfirmModal(false);
        navigate(getReturnPath());
    };

    // Walidacja formularza i otwarcie modala przed zapisem
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.seoSlug.trim()) {
            setError("Nazwa i SEO Slug są wymagane.");
            return;
        }

        setError('');
        const dataToSend = {
            ...formData,
            parentId: formData.parentId ? formData.parentId : null
        };

        setDataToConfirm(dataToSend);
        setShowConfirmModal(true);
    };

    // Wysyłanie danych do API po potwierdzeniu w modal
    const confirmSubmit = async () => {
        if (!dataToConfirm) return;

        setShowConfirmModal(false);
        setSaving(true);
        setError('');

        try {
            // Wysłanie danych do API
            await api.post('/categories', dataToConfirm);

            setSaving(false);
            setIsDirty(false);

            const successMessage = `Kategoria "${dataToConfirm.name}" została dodana pomyślnie.`;

            // Nawigacja do odpowiedniej listy
            if (parentId) {
                navigate(`/admin/categories/${parentId}`, { state: { successMessage: successMessage } });
            } else {
                navigate('/admin/categories', { state: { successMessage: successMessage } });
            }

        } catch (err) {
            console.error("Błąd zapisu kategorii:", err.response);

            let detailedError = "Wystąpił błąd podczas zapisu.";

            if (err.response?.data?.details) {
                detailedError = err.response.data.details
                    .map(d => `${d.field}: ${d.message}`)
                    .join(', ');
            } else if (err.response?.data?.message) {
                detailedError = err.response.data.message;
            }

            // Specyficzny błąd dla duplikatu slug
            if (err.response?.status === 400 && detailedError.toLowerCase().includes('duplicate') && detailedError.toLowerCase().includes('slug')) {
                setError("Błąd: Ten SEO Slug już istnieje. Wybierz inny.");
            } else {
                setError(detailedError);
            }

            setSaving(false);
        }
    };

    const isSubcategory = !!parentId;
    const actionText = isSubcategory ? 'nową podkategorię' : 'nową kategorię główną';
    const confirmMessage = isSubcategory
        ? `Czy na pewno chcesz dodać podkategorię "${dataToConfirm?.name || ''}" do kategorii "${parentCategoryName}"?`
        : `Czy na pewno chcesz dodać nową kategorię główną "${dataToConfirm?.name || ''}"?`;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Nagłówek i Powrót */}
                <div className="mb-8 pt-8">
                    <div className="mb-4">
                        <button
                            onClick={handleCancelClick}
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                            disabled={saving}
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>
                                {parentId ? `Powrót do kategorii "${parentCategoryName}"` : 'Powrót do listy kategorii'}
                            </span>
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Dodaj {actionText}
                    </h1>
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
                            placeholder="Np. Rzeźby, Obrazy, Szkło"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label htmlFor="seoSlug" className="block text-sm font-medium text-gray-700 mb-1">
                            SEO Slug *
                        </label>
                        <input
                            type="text"
                            id="seoSlug"
                            name="seoSlug"
                            value={formData.seoSlug}
                            onChange={handleSlugChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono"
                            placeholder="np. rzezby, obrazy, szklo"
                            disabled={saving}
                        />
                        <p className="mt-1 text-xs text-gray-500">Generowany automatycznie z nazwy, ale możesz poprawić.</p>
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
                            placeholder="Krótki opis kategorii"
                            disabled={saving}
                        />
                    </div>

                    {/* parentId jest ukryte, ponieważ jest ustawiane automatycznie */}
                    <input type="hidden" name="parentId" value={formData.parentId || ''} />

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
                        {/* Przycisk Anuluj/Powrót (wywołuje modal, jeśli isDirty) */}
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
                            <span>{saving ? 'Zapisywanie...' : 'Utwórz kategorię'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal potwierdzenia dodania (Przed zapisem) */}
            <ConfirmationModal
                show={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setDataToConfirm(null);
                }}
                onConfirm={confirmSubmit}
                title={`Potwierdź Dodanie ${isSubcategory ? 'Podkategorii' : 'Kategorii Głównej'}`}
                message={confirmMessage}
                confirmText={`Utwórz ${isSubcategory ? 'podkategorię' : 'kategorię'}`}
                cancelText="Wróć do formularza"
                type="success"
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