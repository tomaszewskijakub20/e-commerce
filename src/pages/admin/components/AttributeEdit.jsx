import { useState, useEffect } from 'react';
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


export default function AttributeEdit() {
    const { categoryId, attributeId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        type: 'TEXT',
        isActive: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [categoryName, setCategoryName] = useState('');

    // Stany dla modala potwierdzenia zapisu
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [dataToConfirm, setDataToConfirm] = useState(null);

    // Typy atrybutów z dokumentacji API
    const attributeTypes = [
        "TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT"
    ];

    // Efekt do ładowania danych atrybutu i nazwy kategorii
    useEffect(() => {
        const loadAttribute = async () => {
            try {
                setLoading(true);
                setError('');

                // Pobranie danych atrybutu
                const attrResponse = await api.get(`/categories/${categoryId}/attributes/${attributeId}`);
                const attrData = attrResponse.data;
                setFormData({
                    name: attrData.name,
                    type: attrData.type,
                    isActive: attrData.isActive
                });

                // Pobranie nazwy kategorii dla nagłówka
                const catResponse = await api.get(`/categories/${categoryId}`);
                setCategoryName(catResponse.data.name);

            } catch (err) {
                console.error("Błąd ładowania atrybutu:", err);
                setError("Nie udało się załadować danych atrybutu.");
            } finally {
                setLoading(false);
            }
        };

        loadAttribute();
    }, [categoryId, attributeId]);

    // Obsługa zmian w formularzu
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Walidacja formularza i otwarcie modala potwierdzenia
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError("Nazwa atrybutu jest wymagana.");
            return;
        }

        setError('');
        setDataToConfirm(formData);
        setShowConfirmModal(true);
    };

    // Wysyłanie danych do API po potwierdzeniu
    const confirmSubmit = async () => {
        if (!dataToConfirm) return;

        setShowConfirmModal(false);
        setSaving(true);
        setError('');

        try {
            // Endpoint: PUT /api/categories/{categoryId}/attributes/{id}
            await api.put(`/categories/${categoryId}/attributes/${attributeId}`, dataToConfirm);

            setSaving(false);
            // Przekierowanie z komunikatem sukcesu
            navigate(`/admin/categories/${categoryId}`, { state: { successMessage: `Atrybut "${dataToConfirm.name}" zaktualizowany pomyślnie.` } });

        } catch (err) {
            console.error("Błąd zapisu atrybutu:", err);
            const errMsg = err.response?.data?.message || "Wystąpił błąd podczas zapisu.";
            setError(errMsg);
            setSaving(false);
        } finally {
            setDataToConfirm(null);
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
                        <Link
                            to={`/admin/categories/${categoryId}`}
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Powrót do kategorii "{categoryName}"</span>
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Edytuj atrybut
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
                            Nazwa atrybutu *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                            placeholder="Np. Kolor, Materiał, Waga"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                            Typ atrybutu *
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                            disabled={saving}
                        >
                            {attributeTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Określa rodzaj danych (np. tekst, liczba).</p>
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
                            Atrybut jest aktywny
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                        <Link
                            to={`/admin/categories/${categoryId}`}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={saving}
                        >
                            Anuluj
                        </Link>
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

            {/* Modal potwierdzenia edycji */}
            <ConfirmationModal
                show={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setDataToConfirm(null);
                }}
                onConfirm={confirmSubmit}
                title="Potwierdź Edycję Atrybutu"
                message={`Czy na pewno chcesz zapisać zmiany dla atrybutu "${dataToConfirm?.name || ''}"?`}
                confirmText="Zapisz"
                cancelText="Wróć do edycji"
                type="warning"
                isProcessing={saving}
            />

        </div>
    );
}