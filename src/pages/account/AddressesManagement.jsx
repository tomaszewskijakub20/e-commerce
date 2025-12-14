import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addressService } from '../../services/addressService';
import { MapPin, Plus, Trash2, Edit3, X, Loader, CheckCircle, Save, XCircle, AlertTriangle, Info } from 'lucide-react';
import api from '../../services/api';

// Lista polskich województw do walidacji i wyboru
const POLISH_REGIONS = [
    "Dolnośląskie", "Kujawsko-Pomorskie", "Lubelskie", "Lubuskie", "Łódzkie",
    "Małopolskie", "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie",
    "Pomorskie", "Śląskie", "Świętokrzyskie", "Warmińsko-Mazurskie",
    "Wielkopolskie", "Zachodniopomorskie"
];

// Komponent uniwersalnego modalu potwierdzenia
const ConfirmationModal = ({
    show,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = 'Potwierdź',
    cancelText = 'Anuluj',
    type = 'info',
    isProcessing = false
}) => {
    if (!show) return null;

    // Definicja stylów na podstawie typu modalu
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
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
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


// Komponent modala dodawania/edycji adresu
const AddressModal = ({ show, onClose, addressToEdit, onSuccess, isProcessing }) => {
    const isEdit = !!addressToEdit;
    const [formData, setFormData] = useState({
        line1: '', line2: '', city: '', region: '', postalCode: '', country: 'Polska', isActive: true,
    });

    // Błędy walidacji formularza
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (show) {
            setFormData(isEdit ? {
                line1: addressToEdit.line1 || '', line2: addressToEdit.line2 || '', city: addressToEdit.city || '',
                region: addressToEdit.region || POLISH_REGIONS[0], postalCode: addressToEdit.postalCode || '',
                country: addressToEdit.country || 'Polska', isActive: addressToEdit.isActive !== undefined ? addressToEdit.isActive : true,
            } : {
                line1: '', line2: '', city: '', region: POLISH_REGIONS[0], postalCode: '', country: 'Polska', isActive: true,
            });
        }
        setValidationErrors({});
    }, [isEdit, addressToEdit, show]);

    if (!show) return null;

    // Logika walidacji formularza
    const validateForm = () => {
        const errors = {};
        if (!formData.line1.trim()) errors.line1 = "Adres jest wymagany.";

        const cityValue = formData.city.trim();
        if (!cityValue) {
            errors.city = "Miasto jest wymagane.";
        } else if (!/^[A-ZŁŚĆŻŹŃÓĘĄa-złśćżźńóęą\s-]+$/i.test(cityValue)) {
            errors.city = "Nieprawidłowe znaki w nazwie miasta.";
        }

        const postalCodeValue = formData.postalCode.trim();
        if (!postalCodeValue) {
            errors.postalCode = "Kod pocztowy jest wymagany.";
        } else if (!/^\d{2}-\d{3}$/.test(postalCodeValue)) {
            errors.postalCode = "Oczekiwany format: XX-XXX.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Przekazanie danych do komponentu nadrzędnego po pomyślnej walidacji
            onSuccess({ data: formData, isEdit: isEdit, id: addressToEdit?.id });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {isEdit ? 'Edytuj adres' : 'Dodaj nowy adres'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isProcessing}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Wiersz 1: Adres 1 i Adres 2 */}
                        <div><label className="block text-sm font-medium text-gray-700">Adres 1 *</label><input type="text" name="line1" value={formData.line1} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg ${validationErrors.line1 ? 'border-red-500' : 'border-gray-300'}`} disabled={isProcessing} /><p className="text-xs text-red-500 mt-1">{validationErrors.line1}</p></div>
                        <div><label className="block text-sm font-medium text-gray-700">Adres 2 (Opcjonalnie)</label><input type="text" name="line2" value={formData.line2} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={isProcessing} /></div>

                        {/* Wiersz 2: Miasto i Kod pocztowy */}
                        <div><label className="block text-sm font-medium text-gray-700">Miasto *</label><input type="text" name="city" value={formData.city} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg ${validationErrors.city ? 'border-red-500' : 'border-gray-300'}`} disabled={isProcessing} /><p className="text-xs text-red-500 mt-1">{validationErrors.city}</p></div>
                        <div><label className="block text-sm font-medium text-gray-700">Kod pocztowy *</label><input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg ${validationErrors.postalCode ? 'border-red-500' : 'border-gray-300'}`} disabled={isProcessing} /><p className="text-xs text-red-500 mt-1">{validationErrors.postalCode}</p></div>

                        {/* Wiersz 3: Region i Kraj */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Region/Województwo *</label>
                            <select name="region" value={formData.region} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg border-gray-300 bg-white`} disabled={isProcessing} >
                                {POLISH_REGIONS.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kraj *</label>
                            <input type="text" name="country" value={formData.country} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg border-gray-300 bg-gray-100`} disabled />
                        </div>
                    </div>

                    {/* Pole wyboru aktywności */}
                    <div className="flex items-center">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" disabled={isProcessing} />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">Adres jest aktywny</label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50" disabled={isProcessing}>
                            Anuluj
                        </button>
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2" disabled={isProcessing}>
                            {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            <span>{isEdit ? 'Zapisz zmiany' : 'Dodaj adres'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Główny komponent zarządzający adresami użytkownika
export default function AddressesManagement() {
    const { userData, setSuccessMessage, setAddressesError, addressesError } = useOutletContext();

    const [userAddresses, setUserAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);

    // Stan modalu formularza (Dodaj/Edytuj)
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [addressToEdit, setAddressToEdit] = useState(null);

    // Stany dla Modalu Potwierdzenia Zapisu/Edycji
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
    const [addressDataToSave, setAddressDataToSave] = useState(null); // Przechowuje dane z formularza
    const [isSaving, setIsSaving] = useState(false); // Stan blokujący interfejs podczas zapisu API

    // Stany dla Modalu Potwierdzenia Usuwania
    const [showDeleteAddressModal, setShowDeleteAddressModal] = useState(false);
    const [addressToDeleteId, setAddressToDeleteId] = useState(null);

    // Funkcja pobierająca listę adresów z API
    const loadUserAddresses = useCallback(async () => {
        const userId = userData.id;

        if (!userId) {
            setUserAddresses([]);
            setAddressesLoading(false);
            return;
        }

        setAddressesLoading(true);
        setAddressesError(null);

        try {
            const addresses = await addressService.getAddresses(userId);
            setUserAddresses(addresses);
        } catch (err) {
            console.error(`Błąd ładowania adresów dla użytkownika:`, err.response || err);
            const errMsg = err.response?.status === 403
                ? "Brak uprawnień lub błąd autoryzacji serwera dla adresów."
                : "Nie udało się załadować listy adresów.";
            setAddressesError(errMsg);
            setUserAddresses([]);
        } finally {
            setAddressesLoading(false);
        }
    }, [userData.id, setAddressesError]);

    // Obsługa danych z AddressModal (uruchamia modal potwierdzenia zapisu)
    const handleAddressModalSuccess = (payload) => {
        setAddressDataToSave(payload);
        setShowSaveConfirmModal(true);
    };

    // Właściwy zapis/edycja do API po potwierdzeniu
    const handleConfirmSave = async () => {
        if (!addressDataToSave) return;

        const { data: formData, isEdit, id } = addressDataToSave;

        setShowSaveConfirmModal(false);
        setIsSaving(true);
        setAddressesError(null);

        try {
            const action = isEdit
                ? addressService.updateAddress(id, formData)
                : addressService.addAddress(formData);

            await action;
            const message = isEdit ? `Adres zaktualizowany pomyślnie.` : `Nowy adres dodany pomyślnie.`;

            // Po sukcesie zamykamy modal i odświeżamy listę
            setShowAddAddressModal(false);
            setAddressToEdit(null);

            await loadUserAddresses();
            setSuccessMessage(message);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Błąd zapisu adresu.";
            setAddressesError("Wystąpił błąd podczas zapisu adresu: " + errMsg);
            // Pozostawienie formularza otwartego
            setShowAddAddressModal(true);
        } finally {
            setIsSaving(false);
            setAddressDataToSave(null);
        }
    };

    // Otwarcie modalu potwierdzenia usuwania
    const handleConfirmDelete = (addressId) => {
        setAddressToDeleteId(addressId);
        setShowDeleteAddressModal(true);
        setSuccessMessage(null);
    };

    // Wykonanie operacji usuwania po potwierdzeniu
    const handleDeleteAddress = async () => {
        const addressId = addressToDeleteId;
        if (!addressId) return;

        setShowDeleteAddressModal(false);
        setAddressesLoading(true);
        setAddressesError(null);

        try {
            await addressService.deleteAddress(addressId);
            await loadUserAddresses();
            setSuccessMessage("Adres usunięty pomyślnie.");
        } catch (err) {
            setAddressesError("Nie udało się usunąć adresu.");
        } finally {
            setAddressesLoading(false);
            setAddressToDeleteId(null);
        }
    };

    // Uruchomienie modalu dodawania/edycji
    const handleOpenModal = (address = null) => {
        setAddressToEdit(address);
        setShowAddAddressModal(true);
        setSuccessMessage(null);
        setAddressesError(null);
    };

    // Zamknięcie modalu formularza (z blokadą podczas zapisu)
    const handleCloseAddressModal = () => {
        if (!isSaving) {
            setShowAddAddressModal(false);
            setAddressToEdit(null);
            setAddressesError(null);
        }
    };

    useEffect(() => {
        if (userData.id) {
            loadUserAddresses();
        }
    }, [userData.id, loadUserAddresses]);


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Moje adresy</h3>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    disabled={addressesLoading}
                >
                    <Plus className="h-4 w-4" />
                    <span>Dodaj nowy adres</span>
                </button>
            </div>

            {/* Wyświetlanie globalnego błędu API */}
            {addressesError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {addressesError}
                </div>
            )}

            {/* Stan ładowania i pusta lista */}
            {addressesLoading && !userAddresses.length ? (
                <div className="text-center py-12"><Loader className="h-6 w-6 animate-spin mx-auto text-gray-600" /></div>
            ) : userAddresses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">Brak zapisanych adresów.</p>
                    <p className="text-sm text-gray-400">Dodaj adres, aby ułatwić sobie składanie zamówień.</p>
                </div>
            ) : (
                // Lista adresów
                <div className="space-y-4">
                    {userAddresses.map(address => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4 shadow-sm flex justify-between items-center">
                            <div className="text-gray-900">
                                <p className="font-semibold">{address.line1}</p>
                                {address.line2 && <p className="text-sm">{address.line2}</p>}
                                <p className="text-sm">{address.postalCode} {address.city}</p>
                                <p className="text-sm text-gray-600">{address.country}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleOpenModal(address)}
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                                    title="Edytuj adres"
                                    disabled={addressesLoading}
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleConfirmDelete(address.id)}
                                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                                    title="Usuń adres"
                                    disabled={addressesLoading}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal edycji/dodawania adresu */}
            <AddressModal
                show={showAddAddressModal}
                onClose={handleCloseAddressModal}
                addressToEdit={addressToEdit}
                onSuccess={handleAddressModalSuccess}
                isProcessing={isSaving} // Blokuje formularz, gdy trwa zapis
            />

            {/* Modal potwierdzenia zapisu/edycji */}
            <ConfirmationModal
                show={showSaveConfirmModal}
                onClose={() => {
                    setShowSaveConfirmModal(false);
                    setAddressDataToSave(null);
                }}
                title={addressDataToSave?.isEdit ? 'Zatwierdź zmiany adresu' : 'Potwierdź dodanie adresu'}
                message={`Czy na pewno chcesz ${addressDataToSave?.isEdit ? 'zatwierdzić zmiany' : 'dodać ten adres'}?`}
                onConfirm={handleConfirmSave}
                confirmText={addressDataToSave?.isEdit ? 'Zapisz zmiany' : 'Dodaj adres'}
                type="success"
                isProcessing={isSaving}
            />

            {/* Modal potwierdzenia usuwania adresu */}
            <ConfirmationModal
                show={showDeleteAddressModal}
                onClose={() => {
                    setShowDeleteAddressModal(false);
                    setAddressToDeleteId(null);
                }}
                title="Potwierdź usunięcie"
                message="Czy na pewno chcesz usunąć ten adres? Tej operacji nie można cofnąć."
                onConfirm={handleDeleteAddress}
                confirmText="Usuń adres"
                type="danger"
                isProcessing={addressesLoading}
            />
        </div>
    );
}