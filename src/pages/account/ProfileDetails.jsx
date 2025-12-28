import { useState } from "react";
import { Edit3, Save, X, Loader, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Uniwersalny komponent modalu potwierdzenia
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
            <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <Icon className={`h-6 w-6 mr-3 ${iconColor}`} />
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isProcessing}>
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

export default function ProfileDetails() {
    const { userData, setSuccessMessage, setAddressesError } = useOutletContext();
    const { setUser } = useAuth(); // Pobieramy setUser, aby zsynchronizować pasek boczny

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Stan formularza
    const [formData, setFormData] = useState({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditStart = () => {
        setIsEditing(true);
        setSuccessMessage(null);
        setAddressesError(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email
        });
    };

    // Funkcja wywoływana po zatwierdzeniu w Modalu
    const handleConfirmUpdate = async () => {
        setIsSaving(true);
        setShowConfirmModal(false);

        try {
            // Przygotowanie danych zgodnie z UserUpdateDTO na backendzie
            const updatePayload = {
                firstName: formData.firstName,
                lastName: formData.lastName
            };

            const response = await api.put('/auth/update', updatePayload);

            // Aktualizacja globalnego stanu użytkownika (paska bocznego i layoutu)
            setUser(prev => ({
                ...prev,
                firstName: response.data.firstName,
                lastName: response.data.lastName
            }));

            setSuccessMessage("Dane profilowe zostały pomyślnie zaktualizowane.");
            setIsEditing(false);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Błąd podczas aktualizacji profilu.";
            setAddressesError(errMsg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Edytuj profil</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            disabled={isSaving}
                        >
                            <Save className="h-4 w-4" />
                            <span>Zapisz zmiany</span>
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isSaving}
                        >
                            <span>Anuluj</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imię *</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleFormChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-black outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nazwisko *</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleFormChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-black outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email (nieedytowalny)</label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <ConfirmationModal
                    show={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleConfirmUpdate}
                    title="Potwierdź aktualizację"
                    message="Czy na pewno chcesz zapisać wprowadzone zmiany w swoim profilu?"
                    confirmText="Tak, zapisz"
                    type="success"
                    isProcessing={isSaving}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Mój profil</h3>
                <button
                    onClick={handleEditStart}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Edit3 className="h-4 w-4" />
                    <span>Edytuj dane</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imię</label>
                    <p className="text-gray-900 font-medium">{userData.firstName}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko</label>
                    <p className="text-gray-900 font-medium">{userData.lastName}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 font-medium">{userData.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data dołączenia</label>
                    <p className="text-gray-900 font-medium">
                        {new Date(userData.joinDate).toLocaleDateString('pl-PL')}
                    </p>
                </div>
            </div>
        </div>
    );
}