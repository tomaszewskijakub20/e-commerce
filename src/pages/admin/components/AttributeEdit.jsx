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
        isKeyAttribute: false,
        globalAttributeId: null
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [categoryName, setCategoryName] = useState('');

    // Stan kontrolujący zmiany i modale
    const [isDirty, setIsDirty] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const attributeTypes = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT"];

    useEffect(() => {
        const loadAttributeData = async () => {
            try {
                setLoading(true);
                const attrResponse = await api.get(`/categories/${categoryId}/attributes/${attributeId}`);
                const attrData = attrResponse.data;
                
                setFormData({
                    name: attrData.attributeName || '',
                    type: attrData.attributeType || 'TEXT',
                    isKeyAttribute: attrData.isKeyAttribute || false,
                    globalAttributeId: attrData.attributeId
                });

                const catResponse = await api.get(`/categories/${categoryId}`);
                setCategoryName(catResponse.data.name);
            } catch (err) {
                setError("Nie udało się załadować danych atrybutu.");
            } finally {
                setLoading(false);
            }
        };
        loadAttributeData();
    }, [categoryId, attributeId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Oznaczamy formularz jako "brudny" przy zmianie
        setIsDirty(true);
    };

    // Obsługa przycisku Powrót/Anuluj
    const handleCancelClick = () => {
        if (isDirty) {
            setShowCancelModal(true);
        } else {
            navigate(`/admin/categories/${categoryId}`);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError("Nazwa atrybutu jest wymagana.");
            return;
        }
        setError('');
        setShowSaveModal(true);
    };

    const confirmSubmit = async () => {
        setShowSaveModal(false);
        setSaving(true);
        setError('');

        try {
            // Aktualizacja globalnej definicji
            await api.put(`/attributes/${formData.globalAttributeId}`, {
                name: formData.name,
                type: formData.type
            });

            // Aktualizacja powiązania w kategorii
            await api.put(`/categories/${categoryId}/attributes/${attributeId}`, {
                attributeId: formData.globalAttributeId,
                isKeyAttribute: formData.isKeyAttribute,
                isActive: true
            });

            setIsDirty(false);
            navigate(`/admin/categories/${categoryId}`, { 
                state: { successMessage: `Zmiany w atrybucie "${formData.name}" zostały zapisane.` } 
            });
        } catch (err) {
            setError(err.response?.data?.message || "Wystąpił błąd podczas zapisu.");
        } finally {
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
            <div className="max-w-3xl mx-auto px-4">

                <div className="mb-8 pt-8">
                    <div className="mb-4">
                        <button
                            onClick={handleCancelClick}
                            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Powrót do kategorii "{categoryName}"</span>
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Edytuj atrybut</h1>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <XCircle className="h-5 w-5 mr-2" />
                            <span>{error}</span>
                        </div>
                        <X className="h-5 w-5 cursor-pointer" onClick={() => setError('')} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa atrybutu *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Typ atrybutu *</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-black"
                            disabled={saving}
                        >
                            {attributeTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    id="isKeyAttribute"
                                    name="isKeyAttribute"
                                    checked={formData.isKeyAttribute}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="isKeyAttribute" className="font-medium text-gray-700">Atrybut kluczowy</label>
                                <p className="text-gray-500">Czy ten atrybut ma być widoczny w filtrach tej kategorii?</p>
                            </div>
                        </div>
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
                            disabled={saving || !isDirty}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>{saving ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal potwierdzenia zapisu */}
            <ConfirmationModal
                show={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onConfirm={confirmSubmit}
                title="Zapisać zmiany?"
                message={`Wprowadzone zmiany w atrybucie "${formData.name}" zostaną zastosowane w systemie.`}
                confirmText="Zapisz zmiany"
                cancelText="Wróć"
                type="success"
                isProcessing={saving}
            />

            {/* Modal anulowania (isDirty) */}
            <ConfirmationModal
                show={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={() => navigate(`/admin/categories/${categoryId}`)}
                title="Niezapisane zmiany"
                message="Czy na pewno chcesz wyjść? Wprowadzone zmiany zostaną utracone."
                confirmText="Opuść stronę"
                cancelText="Zostań"
                type="warning"
                isProcessing={saving}
            />
        </div>
    );
}