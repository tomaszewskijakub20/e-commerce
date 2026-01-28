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
    AlertTriangle, Info, User
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
    { id: 'BLIK', name: 'BLIK', icon: CreditCard },
    { id: 'CASH_ON_DELIVERY', name: 'Płatność przy odbiorze', icon: CreditCard },
];

const PAYMENT_MOCK_SCENARIO = 'SUCCESS';

// Funkcja pomocnicza do formatowania kodu pocztowego (00-000)
const formatPostalCode = (value) => {
    // 1. Usuń wszystko co nie jest cyfrą
    const digits = value.replace(/\D/g, '');
    
    // 2. Ogranicz do 5 cyfr
    const truncated = digits.slice(0, 5);

    // 3. Dodaj myślnik po 2 cyfrach
    if (truncated.length > 2) {
        return `${truncated.slice(0, 2)}-${truncated.slice(2)}`;
    }
    
    return truncated;
};

// --- Komponenty pomocnicze (Modale) ---

const ConfirmationModal = ({ show, onClose, title, message, onConfirm, confirmText = 'Potwierdź', cancelText = 'Anuluj', type = 'info', isProcessing = false }) => {
    if (!show) return null;
    const styles = {
        success: { Icon: CheckCircle, iconColor: 'text-green-600', confirmBg: 'bg-green-600 hover:bg-green-700' },
        danger: { Icon: XCircle, iconColor: 'text-red-600', confirmBg: 'bg-red-600 hover:bg-red-700' },
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
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4" disabled={isProcessing}><X className="h-5 w-5" /></button>
                </div>
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled={isProcessing}>{cancelText}</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg ${confirmBg} disabled:opacity-50 flex items-center`} disabled={isProcessing}>
                        {isProcessing && <Loader className="h-4 w-4 animate-spin mr-2" />}{confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const OrderSuccessModal = ({ show, orderId, successMessage, onClose, navigate, isGuest }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-8 shadow-2xl text-center border border-gray-200">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Zamówienie złożone pomyślnie!</h2>
                <p className="text-lg text-gray-600 mb-6">{successMessage}</p>
                <div className="flex justify-center space-x-3">
                    <button onClick={() => { onClose(); navigate('/'); }} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                        <Home className="h-5 w-5" /> <span>Strona główna</span>
                    </button>
                    {!isGuest && (
                        <button onClick={() => { onClose(); navigate(`/account/orders/${orderId}`); }} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
                            <ShoppingBag className="h-5 w-5" /> Szczegóły zamówienia
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Modal edycji adresu (Tylko dla zalogowanych)
const AddressModal = ({ show, onClose, addressToEdit, onSuccess, isProcessing }) => {
    const isEdit = !!addressToEdit;
    const [formData, setFormData] = useState({ line1: '', line2: '', city: '', region: POLISH_REGIONS[0], postalCode: '', country: 'Polska', isActive: true });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            setFormData(isEdit ? { ...addressToEdit, country: 'Polska' } : { line1: '', line2: '', city: '', region: POLISH_REGIONS[0], postalCode: '', country: 'Polska', isActive: true });
            setErrors({});
        }
    }, [isEdit, addressToEdit, show]);

    if (!show) return null;

    const validate = () => {
        const newErrors = {};
        if (!formData.line1.trim()) newErrors.line1 = "Adres jest wymagany";
        if (!formData.city.trim()) newErrors.city = "Miasto jest wymagane";
        if (!formData.postalCode.trim()) newErrors.postalCode = "Kod pocztowy jest wymagany";
        else if (!/^\d{2}-\d{3}$/.test(formData.postalCode)) newErrors.postalCode = "Format XX-XXX";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSuccess({ data: formData, isEdit, id: addressToEdit?.id });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        // Wymuszanie formatowania kodu pocztowego w Modalu
        if (name === 'postalCode') {
            newValue = formatPostalCode(value);
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
        
        // Usuwanie błędu przy wpisywaniu
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-semibold">{isEdit ? 'Edytuj adres' : 'Dodaj nowy adres'}</h3>
                    <button onClick={onClose}><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Adres 1 *</label>
                            <input name="line1" value={formData.line1} onChange={handleChange} disabled={isProcessing} className={`w-full border rounded p-2 ${errors.line1 ? 'border-red-500' : ''}`}/>
                            {errors.line1 && <p className="text-red-500 text-xs mt-1">{errors.line1}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Adres 2</label>
                            <input name="line2" value={formData.line2} onChange={handleChange} disabled={isProcessing} className="w-full border rounded p-2"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Miasto *</label>
                            <input name="city" value={formData.city} onChange={handleChange} disabled={isProcessing} className={`w-full border rounded p-2 ${errors.city ? 'border-red-500' : ''}`}/>
                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Kod pocztowy *</label>
                            <input 
                                name="postalCode" 
                                placeholder="00-000" 
                                value={formData.postalCode} 
                                onChange={handleChange} 
                                disabled={isProcessing} 
                                className={`w-full border rounded p-2 ${errors.postalCode ? 'border-red-500' : ''}`}
                                maxLength={6}
                            />
                            {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                        </div>
                        <div>
                             <label className="text-sm font-medium">Region *</label>
                             <select name="region" value={formData.region} onChange={handleChange} disabled={isProcessing} className="w-full border rounded p-2 bg-white">
                                {POLISH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                        </div>
                        <div><label className="text-sm font-medium">Kraj</label><input disabled className="w-full border rounded p-2 bg-gray-100" value="Polska"/></div>
                    </div>
                    <div className="flex items-center"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="mr-2"/><label>Aktywny</label></div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Anuluj</button>
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded flex items-center" disabled={isProcessing}>
                             {isProcessing && <Loader className="h-4 w-4 animate-spin mr-2" />} Zapisz
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Główny komponent checkout
export default function Checkout() {
    const { user, isAuthenticated } = useAuth();
    const { cartItems, getCartTotals, clearCart, cartCount } = useCart();
    const navigate = useNavigate();
    const { subtotal, shippingCost, total } = getCartTotals();

    // Główny stan
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Stan dla Użytkownika (Adresy)
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressToEdit, setAddressToEdit] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState(null);

    // Stan dla Gościa (Formularz)
    const [guestData, setGuestData] = useState({
        email: '', firstName: '', lastName: '', phone: '',
        addressLine1: '', addressLine2: '', city: '', region: POLISH_REGIONS[0], postalCode: '', country: 'Polska'
    });
    // Stan błędów walidacji formularza gościa
    const [guestErrors, setGuestErrors] = useState({});

    // Stan wspólny Checkout
    const [selectedAddressId, setSelectedAddressId] = useState(null); // Tylko dla zalogowanych
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0].id);
    const [orderId, setOrderId] = useState(null);
    const [serverTotalAmount, setServerTotalAmount] = useState(null);
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);

    // Pobieranie adresów (tylko zalogowany)
    const fetchAddresses = useCallback(async () => {
        if (!user?.id) return;
        setAddressesLoading(true);
        try {
            const data = await addressService.getAddresses(user.id);
            const list = Array.isArray(data) ? data : [];
            setAddresses(list);
            if (list.length > 0 && !selectedAddressId) setSelectedAddressId(list[0].id);
        } catch (err) { console.error(err); setError("Błąd pobierania adresów."); }
        finally { setAddressesLoading(false); }
    }, [user?.id, selectedAddressId]);

    useEffect(() => {
        // Jeśli pusty koszyk i brak zamówienia -> powrót
        if (cartCount === 0 && !orderId) navigate('/cart');
        
        if (isAuthenticated) fetchAddresses();
    }, [isAuthenticated, cartCount, navigate, fetchAddresses, orderId]);

    // Formatowanie ceny
    const formatPrice = (p) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(p || 0);

    // Obsługa zalogowanego użytkownika (Adresy)
    const handleSaveAddress = async ({ data, isEdit, id }) => {
        setShowAddressModal(false); setLoading(true);
        try {
            if (isEdit) await addressService.updateAddress(id, data);
            else await addressService.addAddress(data);
            await fetchAddresses();
            setSuccess(isEdit ? "Adres zaktualizowany." : "Adres dodany.");
        } catch(e) { setError("Błąd zapisu adresu."); }
        finally { setLoading(false); }
    };

    const handleDeleteAddress = async () => {
        setShowDeleteModal(false); setLoading(true);
        try {
            await addressService.deleteAddress(addressToDelete);
            await fetchAddresses();
            setSuccess("Adres usunięty.");
        } catch(e) { setError("Błąd usuwania adresu."); }
        finally { setLoading(false); }
    };

    // Obsługa gościa (Formularz)
    const handleGuestChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        // Wymuszanie formatowania kodu pocztowego dla Gościa
        if (name === 'postalCode') {
            newValue = formatPostalCode(value);
        }

        setGuestData(prev => ({ ...prev, [name]: newValue }));
        
        // Usuwanie błędu po wpisaniu znaku
        if (guestErrors[name]) {
            setGuestErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Walidacja formularza gościa
    const validateGuestForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const postalCodeRegex = /^\d{2}-\d{3}$/;

        if (!guestData.email.trim()) errors.email = "Email jest wymagany";
        else if (!emailRegex.test(guestData.email)) errors.email = "Niepoprawny format email";

        if (!guestData.phone.trim()) errors.phone = "Telefon jest wymagany";
        if (!guestData.firstName.trim()) errors.firstName = "Imię jest wymagane";
        if (!guestData.lastName.trim()) errors.lastName = "Nazwisko jest wymagane";
        if (!guestData.addressLine1.trim()) errors.addressLine1 = "Adres jest wymagany";
        if (!guestData.city.trim()) errors.city = "Miasto jest wymagane";
        
        if (!guestData.postalCode.trim()) errors.postalCode = "Kod pocztowy jest wymagany";
        else if (!postalCodeRegex.test(guestData.postalCode)) errors.postalCode = "Format XX-XXX";

        setGuestErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Krok 1: Tworzenie zamówienia
    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setError(null);

        // Walidacja koszyka
        if (cartItems.length === 0) return setError("Koszyk jest pusty.");
        
        // Walidacja Zalogowanego: czy wybrano adres
        if (isAuthenticated && !selectedAddressId) return setError("Wybierz adres dostawy.");
        
        // Walidacja Gościa
        if (!isAuthenticated) {
            if (!validateGuestForm()) {
                setError("Proszę poprawić błędy w formularzu.");
                return;
            }
        }

        setLoading(true);
        try {
            const items = cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }));
            let response;

            if (isAuthenticated) {
                // Tryb Zalogowany: wysyłamy addressId
                response = await orderService.createOrder({
                    addressId: selectedAddressId,
                    status: "NEW",
                    items
                });
            } else {
                // Tryb Gość: wysyłamy pełne dane
                response = await orderService.createGuestOrder({
                    ...guestData,
                    items
                });
            }

            setOrderId(response.id);
            setServerTotalAmount(response.totalAmount);
            setStep(2); // Przejście do płatności
        } catch (err) {
            console.error(err);
            setError("Błąd tworzenia zamówienia: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Krok 2: Płatność
    const handleInitiatePayment = async () => {
        if (!isTermsAccepted) return setError("Zaakceptuj regulamin.");
        setLoading(true);
        setError(null);

        try {
            const amount = parseFloat(serverTotalAmount);
            let paymentRes;

            const basePayload = {
                orderId: orderId,
                amount: amount,
                method: selectedPaymentMethod,
                transactionId: `${selectedPaymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'TXN'}-${Date.now()}`,
                notes: isAuthenticated ? 'User payment' : 'Guest payment'
            };

            if (isAuthenticated) {
                 paymentRes = await paymentService.createPayment(basePayload);
            } else {
                 // Dla gościa musimy dodać email do payloadu płatności
                 paymentRes = await paymentService.createGuestPayment({
                     ...basePayload,
                     email: guestData.email
                 });
            }

            // Obsługa pobrania
            if (selectedPaymentMethod === 'CASH_ON_DELIVERY') {
                setSuccess(`Zamówienie przyjęte. Płatność przy odbiorze: ${formatPrice(amount)}`);
                clearCart();
                setStep(3);
                return;
            }

            // Symulacja płatności online
            let simulateRes;
            if (isAuthenticated) {
                simulateRes = await paymentService.simulatePayment(paymentRes.id, PAYMENT_MOCK_SCENARIO);
            } else {
                simulateRes = await paymentService.simulateGuestPayment(paymentRes.id, guestData.email, PAYMENT_MOCK_SCENARIO);
            }

            if (simulateRes.status === 'COMPLETED') {
                setSuccess(`Opłacono pomyślnie: ${formatPrice(amount)}`);
                clearCart();
                setStep(3);
            } else {
                setError(`Płatność odrzucona (Status: ${simulateRes.status}).`);
            }

        } catch (err) {
            console.error(err);
            setError("Błąd płatności: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Renderowanie kroków

    // Krok 1: Wybór adresu (User) LUB Formularz (Gość)
    const renderStep1 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-4">1. Dane Dostawy</h2>
            
            {isAuthenticated ? (
                // Widok zalogowanego
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-700">Twoje zapisane adresy:</h3>
                        <button onClick={() => { setAddressToEdit(null); setShowAddressModal(true); }} className="text-blue-600 flex items-center text-sm font-bold">
                            <PlusCircle className="h-4 w-4 mr-1"/> Dodaj nowy
                        </button>
                    </div>

                    {addressesLoading && <div className="text-center py-4"><Loader className="animate-spin inline"/> Ładowanie...</div>}
                    
                    {!addressesLoading && addresses.length === 0 && (
                         <div className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">Brak adresów. Dodaj nowy, aby zamówić.</div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {addresses.map(addr => (
                            <div 
                                key={addr.id} 
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all relative ${selectedAddressId === addr.id ? 'border-black ring-1 ring-black bg-gray-50' : 'hover:border-gray-400'}`}
                            >
                                <div className="flex items-start">
                                    <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-1"/>
                                    <div>
                                        <div className="font-bold">{addr.line1}</div>
                                        <div className="text-sm text-gray-600">{addr.postalCode} {addr.city}</div>
                                        {addr.line2 && <div className="text-sm text-gray-500">{addr.line2}</div>}
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 flex space-x-1">
                                     <button onClick={(e) => { e.stopPropagation(); setAddressToEdit(addr); setShowAddressModal(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="h-4 w-4"/></button>
                                     <button onClick={(e) => { e.stopPropagation(); setAddressToDelete(addr.id); setShowDeleteModal(true); }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Widok Gościa
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start mb-6">
                        <User className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-blue-800 text-sm">Zakupy bez rejestracji</h3>
                            <p className="text-sm text-blue-600">Wypełnij poniższe dane, aby złożyć zamówienie jednorazowo. Wszystkie pola (oprócz lokalu) są wymagane.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold">Email *</label>
                            <input name="email" type="email" value={guestData.email} onChange={handleGuestChange} className={`w-full border p-2 rounded ${guestErrors.email ? 'border-red-500' : ''}`} placeholder="Wpisz adres e-mail" />
                            {guestErrors.email && <p className="text-xs text-red-500 mt-1">{guestErrors.email}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-bold">Telefon *</label>
                            <input name="phone" value={guestData.phone} onChange={handleGuestChange} className={`w-full border p-2 rounded ${guestErrors.phone ? 'border-red-500' : ''}`} placeholder="Wpisz numer telefonu" />
                            {guestErrors.phone && <p className="text-xs text-red-500 mt-1">{guestErrors.phone}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-bold">Imię *</label>
                            <input name="firstName" value={guestData.firstName} onChange={handleGuestChange} className={`w-full border p-2 rounded ${guestErrors.firstName ? 'border-red-500' : ''}`} placeholder="Twoje imię" />
                            {guestErrors.firstName && <p className="text-xs text-red-500 mt-1">{guestErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-bold">Nazwisko *</label>
                            <input name="lastName" value={guestData.lastName} onChange={handleGuestChange} className={`w-full border p-2 rounded ${guestErrors.lastName ? 'border-red-500' : ''}`} placeholder="Twoje nazwisko" />
                            {guestErrors.lastName && <p className="text-xs text-red-500 mt-1">{guestErrors.lastName}</p>}
                        </div>
                    </div>

                    <h4 className="font-bold mt-4 border-t pt-4">Adres dostawy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold">Ulica i numer *</label>
                            <input name="addressLine1" value={guestData.addressLine1} onChange={handleGuestChange} className={`w-full border p-2 rounded ${guestErrors.addressLine1 ? 'border-red-500' : ''}`} />
                            {guestErrors.addressLine1 && <p className="text-xs text-red-500 mt-1">{guestErrors.addressLine1}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-bold">Mieszkanie/Lokal</label>
                            <input name="addressLine2" value={guestData.addressLine2} onChange={handleGuestChange} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="text-sm font-bold">Kod pocztowy *</label>
                            <input 
                                name="postalCode" 
                                value={guestData.postalCode} 
                                onChange={handleGuestChange} 
                                className={`w-full border p-2 rounded ${guestErrors.postalCode ? 'border-red-500' : ''}`} 
                                placeholder="00-000"
                                maxLength={6} 
                            />
                            {guestErrors.postalCode && <p className="text-xs text-red-500 mt-1">{guestErrors.postalCode}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-bold">Miasto *</label>
                            <input name="city" value={guestData.city} onChange={handleGuestChange} className={`w-full border p-2 rounded ${guestErrors.city ? 'border-red-500' : ''}`} />
                            {guestErrors.city && <p className="text-xs text-red-500 mt-1">{guestErrors.city}</p>}
                        </div>
                        <div>
                             <label className="text-sm font-bold">Województwo *</label>
                             <select name="region" value={guestData.region} onChange={handleGuestChange} className="w-full border p-2 rounded bg-white">
                                {POLISH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                        </div>
                    </div>
                </div>
            )}

            <button 
                onClick={handleCreateOrder} 
                disabled={loading || (isAuthenticated && !selectedAddressId)}
                className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
                {loading ? <Loader className="animate-spin h-5 w-5 mx-auto"/> : 'Przejdź do płatności'}
            </button>
        </div>
    );

    // Krok 2: Płatność (Wspólny)
    const renderStep2 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-4">2. Płatność</h2>
            <div className="space-y-3">
                {paymentMethods.map(m => (
                    <div 
                        key={m.id} 
                        onClick={() => setSelectedPaymentMethod(m.id)}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer ${selectedPaymentMethod === m.id ? 'border-black ring-1 ring-black bg-gray-50' : 'hover:border-gray-400'}`}
                    >
                        <m.icon className="h-6 w-6 mr-3 text-gray-700"/>
                        <span className="font-semibold">{m.name}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-start mt-6 p-4 bg-gray-50 rounded">
                <input type="checkbox" id="terms" checked={isTermsAccepted} onChange={e => setIsTermsAccepted(e.target.checked)} className="mt-1 mr-3 h-5 w-5"/>
                <label htmlFor="terms" className="text-sm text-gray-600">
                    Oświadczam, że zapoznałem się z <Link to="/terms" className="text-blue-600 underline">Regulaminem</Link> i akceptuję jego postanowienia. *
                </label>
            </div>

            <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(1)} disabled={loading} className="w-1/3 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-medium">
                    Wróć
                </button>
                <button 
                    onClick={handleInitiatePayment} 
                    disabled={loading || !isTermsAccepted}
                    className="w-2/3 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 flex justify-center items-center"
                >
                    {loading ? <Loader className="animate-spin h-5 w-5"/> : `Zapłać ${formatPrice(serverTotalAmount)}`}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Finalizacja Zamówienia</h1>

            {/* Komunikaty błędów/sukcesu */}
            {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6 flex items-center"><XCircle className="mr-2"/>{error}</div>}
            {success && step !== 3 && <div className="bg-green-50 text-green-700 p-4 rounded mb-6 flex items-center"><CheckCircle className="mr-2"/>{success}</div>}

            {step === 3 ? (
                 // Krok 3: Sukces (nie renderujemy kolumn)
                 <div className="max-w-lg mx-auto">
                    <OrderSuccessModal show={true} orderId={orderId} successMessage={success} onClose={() => setStep(1)} navigate={navigate} isGuest={!isAuthenticated} />
                 </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Główna sekcja */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
                        {step === 1 ? renderStep1() : renderStep2()}
                    </div>

                    {/* Sidebar Podsumowania */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Podsumowanie</h2>
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                                {cartItems.map(item => (
                                    <div key={item.productId} className="flex justify-between text-sm">
                                        <div>
                                            <span className="font-medium block">{item.name}</span>
                                            <span className="text-gray-500">{item.quantity} x {formatPrice(item.price)}</span>
                                        </div>
                                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2 border-t pt-3 text-sm">
                                <div className="flex justify-between"><span>Produkty:</span><span>{formatPrice(subtotal)}</span></div>
                                <div className="flex justify-between"><span>Dostawa:</span><span>{shippingCost === 0 ? <span className="text-green-600">Gratis</span> : formatPrice(shippingCost)}</span></div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Razem:</span>
                                    <span>{formatPrice(serverTotalAmount || total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale dla użytkownika zalogowanego */}
            <AddressModal show={showAddressModal} onClose={() => setShowAddressModal(false)} addressToEdit={addressToEdit} onSuccess={handleSaveAddress} isProcessing={loading} />
            <ConfirmationModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Usuń adres" message="Czy na pewno?" onConfirm={handleDeleteAddress} type="danger" isProcessing={loading} confirmText="Usuń" />
        </div>
    );
}