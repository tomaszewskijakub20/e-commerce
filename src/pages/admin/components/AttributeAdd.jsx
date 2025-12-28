import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader, Save, ArrowLeft, XCircle, CheckCircle, AlertTriangle, Info, X, Plus, List } from 'lucide-react';
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


export default function AttributeAdd() {
    const { categoryId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        type: 'TEXT',
        attributeId: '', 
        isKeyAttribute: false
    });
    
    const [useExisting, setUseExisting] = useState(true); 
    const [globalAttributes, setGlobalAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const attributeTypes = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT"];

    // Pobieranie danych początkowych
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const catResponse = await api.get(`/categories/${categoryId}`);
                setCategoryName(catResponse.data.name);

                try {
                    const attrsResponse = await api.get('/attributes?size=100');
                    const attributesList = attrsResponse.data.content || [];
                    setGlobalAttributes(attributesList);
                    
                    if (attributesList.length === 0) {
                        setUseExisting(false);
                    }
                } catch (attrErr) {
                    console.warn("Błąd pobierania /api/attributes.");
                    setUseExisting(false);
                }

            } catch (err) {
                console.error("Błąd ładowania kategorii:", err);
                setError("Nie można załadować danych kategorii.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [categoryId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setIsDirty(true); // Oznacz zmiany
    };

    // Obsługa kliknięcia Anuluj
    const handleCancelClick = () => {
        if (isDirty) {
            setShowCancelModal(true);
        } else {
            navigate(`/admin/categories/${categoryId}`);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!useExisting && !formData.name.trim()) {
            setError("Nazwa atrybutu jest wymagana.");
            return;
        }
        if (useExisting && !formData.attributeId) {
            setError("Proszę wybrać atrybut z listy.");
            return;
        }
        setError('');
        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmModal(false);
        setSaving(true);
        setError('');

        try {
            let finalAttributeId = formData.attributeId;

            if (!useExisting) {
                const newAttrResp = await api.post('/attributes', {
                    name: formData.name,
                    type: formData.type
                });
                finalAttributeId = newAttrResp.data.id;
            }

            await api.post(`/categories/${categoryId}/attributes`, {
                attributeId: parseInt(finalAttributeId),
                isKeyAttribute: formData.isKeyAttribute,
                isActive: true 
            });

            setIsDirty(false); // Resetuj przed nawigacją
            navigate(`/admin/categories/${categoryId}`, { 
                state: { successMessage: `Atrybut został pomyślnie dodany do kategorii.` } 
            });

        } catch (err) {
            console.error("Błąd zapisu:", err);
            setError(err.response?.data?.message || "Wystąpił błąd podczas zapisywania.");
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
                    <button 
                        onClick={handleCancelClick}
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Powrót do kategorii "{categoryName}"</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Dodaj atrybut</h1>
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

                {/* Przełącznik trybu */}
                <div className="flex mb-6 bg-gray-200 p-1 rounded-lg">
                    <button 
                        type="button"
                        onClick={() => { setUseExisting(true); setIsDirty(true); }}
                        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${useExisting ? 'bg-white shadow-sm text-black' : 'text-gray-600'}`}
                    >
                        <List className="h-4 w-4 mr-2" /> Wybierz z bazy
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setUseExisting(false); setIsDirty(true); }}
                        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${!useExisting ? 'bg-white shadow-sm text-black' : 'text-gray-600'}`}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Nowa definicja
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                    
                    {useExisting ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Atrybuty w systemie *
                            </label>
                            <select
                                name="attributeId"
                                value={formData.attributeId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-black"
                                disabled={saving}
                            >
                                <option value="">-- Wybierz atrybut --</option>
                                {globalAttributes.map(attr => (
                                    <option key={attr.id} value={attr.id}>
                                        {attr.name} ({attr.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa atrybutu *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
                                    placeholder="np. Materiał, Styl"
                                    disabled={saving}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Typ danych *</label>
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
                        </>
                    )}

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
                                <p className="text-gray-500">Zaznacz, jeśli ten atrybut ma służyć do filtrowania produktów w tej kategorii.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button 
                            type="button"
                            onClick={handleCancelClick}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center space-x-2"
                        >
                            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>{saving ? 'Zapisywanie...' : 'Dodaj atrybut'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal potwierdzenia zapisu */}
            <ConfirmationModal
                show={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmSubmit}
                title="Potwierdź dodanie"
                message={useExisting 
                    ? "Czy na pewno chcesz przypisać ten atrybut do bieżącej kategorii?" 
                    : `Czy chcesz utworzyć nową definicję "${formData.name}" i przypisać ją do kategorii?`}
                confirmText="Tak, dodaj"
                cancelText="Wróć"
                type="success"
                isProcessing={saving}
            />

            {/* Modal anulowania (isDirty) */}
            <ConfirmationModal
                show={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={() => navigate(`/admin/categories/${categoryId}`)}
                title={isDirty ? "Niezapisane zmiany" : "Potwierdź wyjście"}
                message={isDirty 
                    ? "Masz niezapisane zmiany w formularzu. Czy na pewno chcesz opuścić tę stronę? Dane zostaną utracone."
                    : "Czy na pewno chcesz wrócić do widoku kategorii?"}
                confirmText="Opuść stronę"
                cancelText="Zostań"
                type={isDirty ? "warning" : "info"}
                isProcessing={saving}
            />
        </div>
    );
}