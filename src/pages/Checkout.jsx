import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { addressService } from '../services/addressService';
import {
    Loader, MapPin, CreditCard, CheckCircle, XCircle, ShoppingBag,
    PlusCircle, X, Edit3, Trash2, Save, Home, ArrowLeft,
    AlertTriangle, Info
} from 'lucide-react';

// Stałe: Lista polskich województw
const POLISH_REGIONS = [
    "Dolnośląskie", "Kujawsko-Pomorskie", "Lubelskie", "Lubuskie", "Łódzkie",
    "Małopolskie", "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie",
    "Pomorskie", "Śląskie", "Świętokrzyskie", "Warmińsko-Mazurskie",
    "Wielkopolskie", "Zachodniopomorskie"
];

// Metody płatności
const paymentMethods = [
    { id: 'CREDIT_CARD', name: 'Karta Kredytowa/Debetowa', icon: CreditCard },
    { id: 'DEBIT_CARD', name: 'Karta Debetowa', icon: CreditCard },
    { id: 'PAYPAL', name: 'PayPal', icon: CreditCard },
    { id: 'BANK_TRANSFER', name: 'Tradycyjny Przelew', icon: CreditCard },
    { id: 'BLIK', name: 'BLIK', icon: CreditCard },
    { id: 'CASH_ON_DELIVERY', name: 'Płatność przy odbiorze', icon: CreditCard },
];

const PAYMENT_MOCK_SCENARIO = 'SUCCESS';

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
            <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl">
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

// Komponent sukcesu zamówienia
const OrderSuccessModal = ({ show, orderId, successMessage, onClose, navigate }) => {
    if (!show) return null;

    const handleNavigate = (path) => {
        onClose();
        navigate(path);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-8 shadow-2xl text-center border border-gray-200">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Zamówienie złożone pomyślnie!</h2>
                <p className="text-lg text-gray-600 mb-6">{successMessage || "Dziękujemy za zakupy. Status zamówienia możesz sprawdzić na swoim koncie."}</p>
                <div className="flex justify-center space-x-3">
                    <button
                        onClick={() => handleNavigate('/')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                        <Home className="h-5 w-5" /> <span>Wróć do strony głównej</span>
                    </button>
                    <button
                        onClick={() => handleNavigate(`/account/orders/${orderId}`)}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    >
                        <ShoppingBag className="h-5 w-5" /> Szczegóły zamówienia
                    </button>
                </div>
            </div>
        </div>
    );
};

// Komponent modalny dla formularza adresu
const AddressModal = ({ show, onClose, addressToEdit, onSuccess, onError, isProcessing }) => {
    const isEdit = !!addressToEdit;
    const [formData, setFormData] = useState({
        line1: '', line2: '', city: '', region: '', postalCode: '', country: 'Polska', isActive: true,
    });

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

    const validateForm = () => {
        const errors = {};
        if (!formData.line1.trim()) errors.line1 = "Adres jest wymagany.";

        const cityValue = formData.city.trim();
        if (!cityValue) {
            errors.city = "Miasto jest wymagane.";
        } else if (!/^[A-ZŁŚĆŻŹŃÓĘĄa-złśćżźńóęą\s-]+$/i.test(cityValue)) {
            errors.city = "Nieprawidłowe znaki w nazwie miasta (dozwolone litery, spacja i '-').";
        }

        const postalCodeValue = formData.postalCode.trim();
        if (!postalCodeValue) {
            errors.postalCode = "Kod pocztowy jest wymagany.";
        } else if (!/^\d{2}-\d{3}$/.test(postalCodeValue)) {
            errors.postalCode = "Nieprawidłowy format kodu pocztowego (Oczekiwany format: XX-XXX).";
        }

        if (!formData.country.trim()) errors.country = "Kraj jest wymagany.";

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
            // Przekazanie danych do komponentu nadrzędnego po walidacji
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
                            <select name="region" value={formData.region} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg ${validationErrors.region ? 'border-red-500' : 'border-gray-300'} bg-white`} disabled={isProcessing} >
                                {POLISH_REGIONS.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                            <p className="text-xs text-red-500 mt-1">{validationErrors.region}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kraj *</label>
                            <input type="text" name="country" value={formData.country} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg border-gray-300 bg-gray-100`} disabled />
                        </div>
                    </div>

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
                            <span>{isEdit ? 'Potwierdź zmiany' : 'Dodaj adres'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function Checkout() {
    const { user, isAuthenticated } = useAuth();
    const { cartItems, getCartTotals, clearCart, cartCount } = useCart();
    const navigate = useNavigate();

    const { subtotal, shippingCost, total } = getCartTotals();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(true);

    // Stany dla modala adresów (Formularz)
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressToEdit, setAddressToEdit] = useState(null);

    // Stany dla modala potwierdzenia usunięcia
    const [showDeleteAddressModal, setShowDeleteAddressModal] = useState(false);
    const [addressToDeleteId, setAddressToDeleteId] = useState(null);

    // Stany dla modala potwierdzenia zapisu adresu
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
    const [addressDataToSave, setAddressDataToSave] = useState(null);
    const [isAddressSaving, setIsAddressSaving] = useState(false); // Stan ładowania dla operacji adresowych

    // Stan formularza Checkout
    const [checkoutData, setCheckoutData] = useState({
        selectedAddressId: null,
        selectedPaymentMethod: paymentMethods[0]?.id || null,
        orderId: null,
        serverTotalAmount: null,
        paymentId: null,
    });

    // Wymagana zgoda na regulamin w Kroku 2
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);


    // Funkcja do ładowania adresów użytkownika
    const fetchAddresses = useCallback(async () => {
        const userId = user?.id;
        if (!userId) {
            setAddressesLoading(false);
            return;
        }

        setAddressesLoading(true);
        setError(null);
        try {
            const userAddresses = await addressService.getAddresses(userId);
            const addressList = Array.isArray(userAddresses) ? userAddresses : [];
            setAddresses(addressList);

            if (addressList.length > 0) {
                // Ustawienie domyślnego/zapamiętanego adresu
                setCheckoutData(prev => ({
                    ...prev,
                    selectedAddressId: prev.selectedAddressId && addressList.some(a => a.id === prev.selectedAddressId)
                        ? prev.selectedAddressId
                        : addressList[0].id
                }));
            } else {
                setCheckoutData(prev => ({ ...prev, selectedAddressId: null }));
            }
        } catch (err) {
            console.error("Błąd pobierania adresów w Checkout:", err);
            setError("Nie udało się załadować adresów. Sprawdź połączenie.");
        } finally {
            setAddressesLoading(false);
        }
    }, [user?.id]);


    // Weryfikacja Auth i Ładowanie Adresów
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        // Jeśli koszyk jest pusty i nie ma jeszcze ID zamówienia, wróć do koszyka
        if (cartCount === 0 && !checkoutData.orderId) {
            navigate('/cart');
            return;
        }

        if (user?.id) {
            fetchAddresses();
        }
    }, [isAuthenticated, cartCount, navigate, fetchAddresses, user?.id, checkoutData.orderId]);


    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price || 0);
    };

    // Właściwy zapis/edycja adresu (po potwierdzeniu)
    const handleSaveAddress = async () => {
        if (!addressDataToSave) return;

        const { data: formData, isEdit, id } = addressDataToSave;

        setShowSaveConfirmModal(false);
        setIsAddressSaving(true);
        setError(null);

        try {
            const action = isEdit
                ? addressService.updateAddress(id, formData)
                : addressService.addAddress(formData);

            await action;
            const message = isEdit ? `Adres zaktualizowany pomyślnie.` : `Nowy adres dodany pomyślnie.`;

            // Po pomyślnym zapisie:
            setShowAddressModal(false); // Zamknij modal formularza
            setAddressToEdit(null);
            await fetchAddresses(); // Przeładuj listę i zaktualizuj selectedAddressId
            setSuccess(message); // Pokaż sukces

        } catch (err) {
            const errMsg = err.response?.data?.message || "Wystąpił błąd podczas komunikacji z serwerem.";
            setError("Błąd serwera podczas zapisu adresu: " + errMsg);
        } finally {
            setIsAddressSaving(false);
            setAddressDataToSave(null);
        }
    };

    // Obsługa Modala Adresowego (otwiera modal potwierdzenia po walidacji)
    const handleAddressSuccess = (addressData) => {
        setAddressDataToSave(addressData);
        setShowSaveConfirmModal(true); // Otwórz ujednolicony modal potwierdzenia
    };

    const handleOpenAddressModal = (address = null) => {
        setError(null);
        setSuccess(null);
        setAddressToEdit(address);
        setShowAddressModal(true);
    };

    // Otwarcie modala usuwania adresu
    const handleConfirmDelete = (addressId) => {
        setError(null);
        setSuccess(null);
        setAddressToDeleteId(addressId);
        setShowDeleteAddressModal(true);
    };

    const handleDeleteAddress = async () => {
        const addressId = addressToDeleteId;
        if (!addressId) return;

        setShowDeleteAddressModal(false);
        setLoading(true);
        try {
            await addressService.deleteAddress(addressId);
            await fetchAddresses(); // Przeładowanie listy
            setSuccess("Adres usunięty pomyślnie.");
        } catch (err) {
            setError("Nie udało się usunąć adresu.");
        } finally {
            setLoading(false);
            setAddressToDeleteId(null);
        }
    }


    // Krok 1: Tworzenie zamówienia
    const handleCreateOrder = async () => {
        if (addressesLoading) return;
        if (!checkoutData.selectedAddressId) {
            setError("Wybierz adres dostawy, aby kontynuować.");
            return;
        }
        if (cartItems.length === 0) {
            setError("Koszyk jest pusty.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const orderItems = cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            }));

            const orderPayload = {
                addressId: checkoutData.selectedAddressId,
                status: "NEW",
                items: orderItems,
            };

            // Wysłanie zamówienia do serwera
            const orderResponse = await orderService.createOrder(orderPayload);

            if (!orderResponse || !orderResponse.id || orderResponse.totalAmount === undefined || orderResponse.totalAmount === null) {
                throw new Error("Serwer nie zwrócił ID ani ostatecznej kwoty zamówienia (totalAmount).");
            }

            setCheckoutData(prev => ({
                ...prev,
                orderId: orderResponse.id,
                serverTotalAmount: orderResponse.totalAmount
            }));

            setLoading(false);
            setStep(2); // Przejście do Kroku 2: Płatność

        } catch (err) {
            console.error("Błąd tworzenia zamówienia:", err.response || err);
            setError("Nie udało się utworzyć zamówienia. Spróbuj ponownie. Szczegóły: " + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    // Krok 2: Inicjacja i symulacja płatności
    const handleInitiatePayment = async () => {
        if (!checkoutData.selectedPaymentMethod || !checkoutData.orderId) {
            setError("Brak wybranej metody płatności lub ID zamówienia.");
            return;
        }
        if (!isTermsAccepted) {
            setError("Musisz zaakceptować Regulamin i Politykę Prywatności, aby złożyć zamówienie.");
            return;
        }
        if (!checkoutData.serverTotalAmount) {
            setError("Brak kwoty zamówienia z serwera. Wróć do Kroku 1.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const isCOD = checkoutData.selectedPaymentMethod === 'CASH_ON_DELIVERY';
            const finalAmount = parseFloat(checkoutData.serverTotalAmount).toFixed(2);

            if (isCOD) {
                // Logika dla Płatności przy Odbiorze
                const paymentPayload = {
                    orderId: checkoutData.orderId,
                    amount: parseFloat(finalAmount),
                    method: 'CASH_ON_DELIVERY',
                    transactionId: `COD-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                    notes: `Płatność za zamówienie #${checkoutData.orderId} - Oczekuje przy odbiorze.`,
                };

                await paymentService.createPayment(paymentPayload);

                setSuccess(`Twoje zamówienie zostało złożone, płatność przy odbiorze (${formatPrice(finalAmount)}).`);
                clearCart();
                setStep(3);
                setLoading(false);
                return;
            }

            // Inicjacja Płatności Online
            const paymentPayload = {
                orderId: checkoutData.orderId,
                amount: parseFloat(finalAmount),
                method: checkoutData.selectedPaymentMethod,
                transactionId: `TXN-INIT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                notes: `Płatność za zamówienie #${checkoutData.orderId} - Inicjacja`,
            };

            const paymentResponse = await paymentService.createPayment(paymentPayload);
            const paymentId = paymentResponse.id;

            // Symulacja Bramki Płatniczej
            const simulateResponse = await paymentService.simulatePayment(paymentId, PAYMENT_MOCK_SCENARIO);

            if (simulateResponse.status === 'COMPLETED') {
                setSuccess(`Twoje zamówienie zostało pomyślnie złożone i opłacone (${formatPrice(finalAmount)}).`);
                clearCart();
                setStep(3); // Krok 3: Sukces
            } else {
                setError(`Płatność nie powiodła się. Status: ${simulateResponse.status}. Spróbuj inną metodą.`);
            }

        } catch (err) {
            console.error("Błąd płatności:", err.response || err);
            let errMsg = "Wystąpił błąd podczas przetwarzania płatności.";
            if (err.response?.status === 400 && err.response?.data?.details) {
                errMsg = `Błąd walidacji: ${err.response.data.details.map(d => d.message).join(', ')}`;
            } else if (err.response?.data?.message) {
                errMsg = err.response.data.message;
            }
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    // Renderowanie poszczególnych kroków
    const renderStepContent = () => {

        switch (step) {
            case 1:
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4">1. Adres i Dostawa</h2>
                        <div className="space-y-4">
                            {addressesLoading ? (
                                <div className="flex justify-center items-center h-20">
                                    <Loader className="h-6 w-6 animate-spin text-black" />
                                    <span className="ml-3 text-gray-600">Ładowanie adresów...</span>
                                </div>
                            ) : addresses.length > 0 ? (
                                addresses.map(address => (
                                    <div
                                        key={address.id}
                                        className={`p-4 border rounded-lg transition-all ${checkoutData.selectedAddressId === address.id ? 'border-black ring-2 ring-black' : 'border-gray-300 hover:border-gray-500 cursor-pointer'
                                            }`}
                                        onClick={() => setCheckoutData(prev => ({ ...prev, selectedAddressId: address.id }))}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <MapPin className="h-5 w-5 inline mr-3 text-gray-600" />
                                                <span className="font-semibold">{address.line1}</span>, {address.postalCode} {address.city}
                                                {address.line2 && <p className="text-sm text-gray-500 ml-8">{address.line2}</p>}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleOpenAddressModal(address); }}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Edytuj"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleConfirmDelete(address.id); }}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Usuń"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <XCircle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Brak aktywnych adresów</h3>
                                    <p>Aby kontynuować, musisz dodać adres dostawy.</p>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleOpenAddressModal(null)}
                            className="mt-4 text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
                        >
                            <PlusCircle className="h-4 w-4" /> <span>Dodaj nowy adres</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateOrder}
                            disabled={loading || addressesLoading || addresses.length === 0}
                            className="mt-6 w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Przejdź do płatności'}
                        </button>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4">2. Wybór Płatności</h2>
                        <div className="space-y-4">
                            {paymentMethods.map(method => (
                                <div
                                    key={method.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${checkoutData.selectedPaymentMethod === method.id ? 'border-black ring-2 ring-black' : 'border-gray-300 hover:border-gray-500'
                                        }`}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, selectedPaymentMethod: method.id }))}
                                >
                                    <method.icon className="h-5 w-5 inline mr-3 text-gray-600" />
                                    <span className="font-semibold">{method.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Checkbox zgody na regulamin */}
                        <div className="flex items-start pt-4 border-t border-gray-100 mt-6">
                            <input
                                type="checkbox"
                                id="termsAccepted"
                                checked={isTermsAccepted}
                                onChange={(e) => setIsTermsAccepted(e.target.checked)}
                                className={`h-5 w-5 text-black border-gray-300 rounded focus:ring-black mt-0.5 ${error && !isTermsAccepted ? 'border-red-500 ring-red-500' : ''}`}
                            />
                            <label htmlFor="termsAccepted" className={`ml-3 text-base ${error && !isTermsAccepted ? 'text-red-600' : 'text-gray-700'}`}>
                                Zgadzam się z <Link to="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">Regulaminem</Link> i <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">Polityką Prywatności</Link> *
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={handleInitiatePayment}
                            disabled={loading || !checkoutData.selectedPaymentMethod || !isTermsAccepted}
                            className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {loading
                                ? <Loader className="h-4 w-4 animate-spin" />
                                : (checkoutData.selectedPaymentMethod === 'CASH_ON_DELIVERY'
                                    ? 'Złóż zamówienie (Płatność przy odbiorze)'
                                    : `Zapłać ${formatPrice(checkoutData.serverTotalAmount)} i złóż zamówienie`)}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep(1); setError(null); setSuccess(null); }}
                            className="mt-3 w-full py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                            disabled={loading}
                        >
                            <ArrowLeft className="h-4 w-4" /> <span>Wróć do wyboru adresu</span>
                        </button>
                    </>
                );
            case 3:
                return (
                    // Przekierowanie do OrderSuccessModal
                    <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center h-80">
                        <CheckCircle className="h-10 w-10 text-green-600 mb-3" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Dziękujemy za złożenie zamówienia!</h3>
                        <p className="mt-2 text-gray-600">Oczekuj na automatyczne przekierowanie lub zamknij okno, aby kontynuować.</p>
                        <p className="mt-1 text-sm text-gray-500">Zamówienie ID: {checkoutData.orderId}</p>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizacja Zamówienia</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                </div>
            )}
            {success && step !== 3 && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="text-green-700 font-bold ml-4">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    {renderStepContent()}
                </div>

                {/* Prawa kolumna: Podsumowanie Koszyka */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">Podsumowanie</h2>

                        {cartItems.map(item => (
                            <div key={item.productId} className="flex justify-between items-start py-2 border-b border-gray-200">
                                <div className="flex flex-col text-sm">
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    <span className="text-gray-500">Ilość: {item.quantity} x {formatPrice(item.price)}</span>
                                </div>
                                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}

                        <div className="space-y-3 text-gray-700 mt-4">
                            <div className="flex justify-between">
                                <span>Wysyłka:</span>
                                <span className="font-medium">
                                    {shippingCost === 0.00 && subtotal > 0 ? (
                                        <>
                                            <span className="line-through text-gray-500 mr-2">{formatPrice(29.99)}</span>
                                            <span className="text-green-600">DARMOWA</span>
                                        </>
                                    ) : (
                                        formatPrice(shippingCost)
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">Łącznie:</span>
                            <span className="text-2xl font-extrabold text-black">
                                {formatPrice(checkoutData.serverTotalAmount || total)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal edycji/dodawania adresu (formularz) */}
            <AddressModal
                show={showAddressModal}
                onClose={() => {
                    if (!isAddressSaving) { // Zapobiegaj zamknięciu podczas zapisu
                        setShowAddressModal(false);
                        setAddressToEdit(null);
                    }
                }}
                addressToEdit={addressToEdit}
                onSuccess={handleAddressSuccess} // Wywoływany po walidacji
                onError={setError}
                isProcessing={isAddressSaving} // Blokowanie inputów
            />

            {/* Modal potwierdzenia zapisu/edycji adresu */}
            <ConfirmationModal
                show={showSaveConfirmModal}
                onClose={() => {
                    setShowSaveConfirmModal(false);
                    setAddressDataToSave(null);
                }}
                title={addressDataToSave?.isEdit ? 'Zatwierdź zmiany adresu' : 'Potwierdź dodanie adresu'}
                message={`Czy na pewno chcesz ${addressDataToSave?.isEdit ? 'zatwierdzić zmiany w tym adresie' : 'dodać ten adres'}?`}
                onConfirm={handleSaveAddress}
                confirmText={addressDataToSave?.isEdit ? 'Zapisz zmiany' : 'Dodaj adres'}
                type="success"
                isProcessing={isAddressSaving}
            />

            {/* Modal potwierdzenia usunięcia adresu */}
            <ConfirmationModal
                show={showDeleteAddressModal}
                onClose={() => { setShowDeleteAddressModal(false); setAddressToDeleteId(null); }}
                title="Potwierdź usunięcie"
                message="Czy na pewno chcesz usunąć ten adres? Tej operacji nie można cofnąć."
                onConfirm={handleDeleteAddress}
                confirmText="Usuń"
                type="danger"
                isProcessing={loading}
            />

            {/* Modal sukcesu zamówienia */}
            <OrderSuccessModal
                show={step === 3}
                orderId={checkoutData.orderId}
                successMessage={success}
                onClose={() => setStep(2)}
                navigate={navigate}
            />
        </div>
    );
}